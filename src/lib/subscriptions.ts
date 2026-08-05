import type Stripe from "stripe";
import { planToDbRow, parseJobPlan, type JobPlan } from "@/lib/job-plan";
import { stripePriceIdToPlan } from "@/lib/stripe";
import { createSupabaseAdmin } from "@/lib/supabase";
import type { SubscriptionRecord, SubscriptionStatus } from "@/types/subscription";

type SubscriptionDbRow = {
  id: string;
  store_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  plan: string | null;
  status: string;
  payment_status: string | null;
  payment_failed_count: number | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  canceled_at: string | null;
  created_at: string;
  updated_at: string;
};

const ACTIVE_STATUSES: SubscriptionStatus[] = ["active", "trialing"];

function unixToIso(value: number | null | undefined): string | null {
  if (!value || !Number.isFinite(value)) return null;
  return new Date(value * 1000).toISOString();
}

function normalizeStatus(status: string | null | undefined): SubscriptionStatus {
  switch (status) {
    case "incomplete":
    case "incomplete_expired":
    case "trialing":
    case "active":
    case "past_due":
    case "canceled":
    case "unpaid":
    case "paused":
      return status;
    default:
      return "incomplete";
  }
}

function deriveEffectiveStatus(subscription: Stripe.Subscription): SubscriptionStatus {
  if (subscription.pause_collection) return "paused";
  return normalizeStatus(subscription.status);
}

function getSubscriptionPeriod(subscription: Stripe.Subscription): {
  start: number | null;
  end: number | null;
} {
  const item = subscription.items?.data?.[0];
  return {
    start: item?.current_period_start ?? null,
    end: item?.current_period_end ?? null,
  };
}

export function mapSubscriptionRow(row: SubscriptionDbRow): SubscriptionRecord {
  return {
    id: row.id,
    storeId: row.store_id,
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    stripePriceId: row.stripe_price_id,
    plan: parseJobPlan(row.plan),
    status: normalizeStatus(row.status),
    paymentStatus: row.payment_status,
    paymentFailedCount: row.payment_failed_count ?? 0,
    currentPeriodStart: row.current_period_start,
    currentPeriodEnd: row.current_period_end,
    cancelAtPeriodEnd: Boolean(row.cancel_at_period_end),
    canceledAt: row.canceled_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getStoreSubscription(storeId: string): Promise<SubscriptionRecord | null> {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return mapSubscriptionRow(data as SubscriptionDbRow);
}

export async function getSubscriptionByStripeId(
  stripeSubscriptionId: string,
): Promise<SubscriptionRecord | null> {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("stripe_subscription_id", stripeSubscriptionId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return mapSubscriptionRow(data as SubscriptionDbRow);
}

function derivePlanFromStripeSubscription(subscription: Stripe.Subscription): JobPlan {
  const priceId = subscription.items.data[0]?.price?.id ?? "";
  return stripePriceIdToPlan(priceId) ?? "light";
}

function derivePaymentStatus(subscription: Stripe.Subscription): string | null {
  if (subscription.pause_collection) return "paused";
  if (
    subscription.latest_invoice &&
    typeof subscription.latest_invoice !== "string"
  ) {
    return subscription.latest_invoice.status ?? null;
  }
  return subscription.status;
}

export async function upsertSubscriptionFromStripe(
  subscription: Stripe.Subscription,
  options?: { fallbackStoreId?: string; preserveFailureCount?: boolean },
): Promise<SubscriptionRecord> {
  const supabase = createSupabaseAdmin();
  const metadataStoreId =
    typeof subscription.metadata?.store_id === "string"
      ? subscription.metadata.store_id
      : null;
  const customerStoreId =
    subscription.customer &&
    typeof subscription.customer !== "string" &&
    !("deleted" in subscription.customer && subscription.customer.deleted) &&
    typeof subscription.customer.metadata?.store_id === "string"
      ? subscription.customer.metadata.store_id
      : null;
  const storeId = metadataStoreId || customerStoreId || options?.fallbackStoreId;
  if (!storeId) {
    throw new Error("store_id is missing on Stripe subscription metadata.");
  }

  const previous =
    (await getSubscriptionByStripeId(subscription.id)) ??
    (await getStoreSubscription(storeId));
  const priceId = subscription.items.data[0]?.price?.id ?? null;
  const plan = derivePlanFromStripeSubscription(subscription);
  const status = deriveEffectiveStatus(subscription);
  const period = getSubscriptionPeriod(subscription);

  const payload = {
    store_id: storeId,
    stripe_customer_id:
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer &&
            !("deleted" in subscription.customer && subscription.customer.deleted)
          ? subscription.customer.id
          : null,
    stripe_subscription_id: subscription.id,
    stripe_price_id: priceId,
    plan,
    status,
    payment_status: derivePaymentStatus(subscription),
    payment_failed_count:
      options?.preserveFailureCount && previous
        ? previous.paymentFailedCount
        : previous?.paymentFailedCount ?? 0,
    current_period_start: unixToIso(period.start),
    current_period_end: unixToIso(period.end),
    cancel_at_period_end: Boolean(subscription.cancel_at_period_end),
    canceled_at: unixToIso(subscription.canceled_at),
  };

  // One row per store; re-subscribe after cancel overwrites the previous row.
  const { data, error } = await supabase
    .from("subscriptions")
    .upsert(payload, { onConflict: "store_id" })
    .select("*")
    .single();
  if (error) throw error;

  await syncJobAccessFromSubscription(storeId, plan, status);
  return mapSubscriptionRow(data as SubscriptionDbRow);
}

export async function markInvoicePaid(
  stripeSubscriptionId: string,
  periodStartUnix?: number | null,
  periodEndUnix?: number | null,
): Promise<void> {
  const supabase = createSupabaseAdmin();
  const record = await getSubscriptionByStripeId(stripeSubscriptionId);
  if (!record) return;

  const updates: Record<string, unknown> = {
    payment_status: "paid",
    payment_failed_count: 0,
    status: "active",
    current_period_start:
      unixToIso(periodStartUnix) ?? record.currentPeriodStart,
    current_period_end: unixToIso(periodEndUnix) ?? record.currentPeriodEnd,
  };
  const { error } = await supabase
    .from("subscriptions")
    .update(updates)
    .eq("id", record.id);
  if (error) throw error;
  await syncJobAccessFromSubscription(record.storeId, record.plan, "active");
}

export async function markInvoicePaymentFailed(stripeSubscriptionId: string): Promise<void> {
  const supabase = createSupabaseAdmin();
  const record = await getSubscriptionByStripeId(stripeSubscriptionId);
  if (!record) return;
  const failed = (record.paymentFailedCount ?? 0) + 1;
  const { error } = await supabase
    .from("subscriptions")
    .update({
      payment_status: "payment_failed",
      status: failed >= 3 ? "unpaid" : "past_due",
      payment_failed_count: failed,
    })
    .eq("id", record.id);
  if (error) throw error;
  await syncJobAccessFromSubscription(
    record.storeId,
    record.plan,
    failed >= 3 ? "unpaid" : "past_due",
  );
}

export async function syncJobAccessFromSubscription(
  storeId: string,
  plan: JobPlan,
  status: SubscriptionStatus,
): Promise<void> {
  const supabase = createSupabaseAdmin();
  const shouldPublish = ACTIVE_STATUSES.includes(status);
  const listingStatus = shouldPublish ? "published" : "paused";
  const planFlags = planToDbRow(plan);

  const { error } = await supabase
    .from("jobs")
    .update({
      ...planFlags,
      published: shouldPublish,
      listing_status: listingStatus,
    })
    .eq("id", storeId);
  if (error) throw error;
}
