import type Stripe from "stripe";
import { planToDbRow, parseJobPlan, type JobPlan } from "@/lib/job-plan";
import { stripePriceIdToPlan } from "@/lib/stripe";
import { createSupabaseAdmin } from "@/lib/supabase";
import type { SubscriptionRecord, SubscriptionStatus } from "@/types/subscription";

type SubscriptionDbRow = {
  id: string;
  store_id: string | null;
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
  customer_email?: string | null;
  pending_stripe_price_id?: string | null;
  pending_change_at?: string | null;
  stripe_schedule_id?: string | null;
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
    customerEmail: row.customer_email?.trim() || null,
    pendingStripePriceId: row.pending_stripe_price_id ?? null,
    pendingChangeAt: row.pending_change_at ?? null,
    stripeScheduleId: row.stripe_schedule_id ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getStoreSubscription(
  storeId: string,
): Promise<SubscriptionRecord | null> {
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

export async function getSubscriptionByCustomerId(
  stripeCustomerId: string,
): Promise<SubscriptionRecord | null> {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("stripe_customer_id", stripeCustomerId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return mapSubscriptionRow(data as SubscriptionDbRow);
}

function customerIdFromSubscription(subscription: Stripe.Subscription): string | null {
  if (typeof subscription.customer === "string") return subscription.customer;
  if (
    subscription.customer &&
    !("deleted" in subscription.customer && subscription.customer.deleted)
  ) {
    return subscription.customer.id;
  }
  return null;
}

export function customerEmailFromSubscription(
  subscription: Stripe.Subscription,
): string | null {
  const customer = subscription.customer;
  if (customer && typeof customer !== "string" && !("deleted" in customer && customer.deleted)) {
    const email = customer.email?.trim().toLowerCase();
    if (email) return email;
  }
  return null;
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

/**
 * 顧客メールから店舗を推定する（参考用）。
 * 自動紐付けの確定には使わないこと。
 */
export async function resolveStoreIdByCustomerEmail(
  email: string | null | undefined,
): Promise<string | null> {
  const normalized = email?.trim().toLowerCase();
  if (!normalized) return null;

  const supabase = createSupabaseAdmin();

  const { data: shop } = await supabase
    .from("shops")
    .select("linked_job_id")
    .ilike("contact_email", normalized)
    .not("linked_job_id", "is", null)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (shop?.linked_job_id) return String(shop.linked_job_id);

  const { data: application } = await supabase
    .from("listing_applications")
    .select("linked_job_id")
    .ilike("contact_email", normalized)
    .not("linked_job_id", "is", null)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (application?.linked_job_id) return String(application.linked_job_id);

  return null;
}

/**
 * 自動紐付け用の店舗解決。
 * 確実な識別子のみ使用（メール一致では確定しない）。
 * 優先: subscription.metadata.store_id → customer.metadata.store_id → fallbackStoreId
 * （fallback は checkout の metadata / client_reference_id 経由）
 */
async function resolveStoreIdForSubscription(
  subscription: Stripe.Subscription,
  options?: { fallbackStoreId?: string | null },
): Promise<string | null> {
  const metadataStoreId =
    typeof subscription.metadata?.store_id === "string"
      ? subscription.metadata.store_id.trim()
      : null;
  if (metadataStoreId) return metadataStoreId;

  const customerStoreId =
    subscription.customer &&
    typeof subscription.customer !== "string" &&
    !("deleted" in subscription.customer && subscription.customer.deleted) &&
    typeof subscription.customer.metadata?.store_id === "string"
      ? subscription.customer.metadata.store_id.trim()
      : null;
  if (customerStoreId) return customerStoreId;

  const fallback = options?.fallbackStoreId?.trim() || null;
  if (fallback) return fallback;

  // 同一 Stripe Customer に既に紐付け済みの契約があれば継承
  const customerId = customerIdFromSubscription(subscription);
  const byCustomer = customerId
    ? await getSubscriptionByCustomerId(customerId)
    : null;
  if (byCustomer?.storeId) return byCustomer.storeId;

  return null;
}

/**
 * Stripe Subscription を subscriptions へ upsert。
 * 一意キーは stripe_subscription_id。store_id が取れない場合は null で保存する。
 */
export async function upsertSubscriptionFromStripe(
  subscription: Stripe.Subscription,
  options?: { fallbackStoreId?: string | null; preserveFailureCount?: boolean },
): Promise<SubscriptionRecord> {
  const supabase = createSupabaseAdmin();
  const customerId = customerIdFromSubscription(subscription);
  let customerEmail = customerEmailFromSubscription(subscription);
  if (!customerEmail && customerId) {
    try {
      const { getStripeServer } = await import("@/lib/stripe");
      const customer = await getStripeServer().customers.retrieve(customerId);
      if (!("deleted" in customer && customer.deleted)) {
        customerEmail = customer.email?.trim().toLowerCase() || null;
      }
    } catch {
      // メール取得失敗は upsert 自体を止めない
    }
  }

  const storeId = await resolveStoreIdForSubscription(subscription, {
    fallbackStoreId: options?.fallbackStoreId,
  });

  const previousByStripe = await getSubscriptionByStripeId(subscription.id);
  const previousByStore = storeId ? await getStoreSubscription(storeId) : null;
  const previousByCustomer = customerId
    ? await getSubscriptionByCustomerId(customerId)
    : null;
  const previous = previousByStripe ?? previousByCustomer ?? previousByStore;

  const priceId = subscription.items.data[0]?.price?.id ?? null;
  const plan = derivePlanFromStripeSubscription(subscription);
  const status = deriveEffectiveStatus(subscription);
  const period = getSubscriptionPeriod(subscription);

  // 既存行の store_id を誤って null で上書きしない
  const resolvedStoreId = storeId ?? previous?.storeId ?? null;

  let pendingStripePriceId: string | null = null;
  let pendingChangeAt: string | null = null;
  let stripeScheduleId: string | null = null;
  try {
    const { getPendingPlanChangeForSubscription } = await import(
      "@/lib/stripe-subscription-schedule"
    );
    const pending = await getPendingPlanChangeForSubscription(subscription);
    if (pending) {
      pendingStripePriceId = pending.stripePriceId;
      pendingChangeAt = pending.effectiveAt;
      stripeScheduleId = pending.scheduleId;
    } else if (subscription.schedule) {
      stripeScheduleId =
        typeof subscription.schedule === "string"
          ? subscription.schedule
          : subscription.schedule.id;
    }
  } catch {
    // schedule 取得失敗時は pending をクリアせず previous を維持しない（不明時は null）
    const metaPending = subscription.metadata?.pending_price_id?.trim();
    const metaAt = subscription.metadata?.pending_change_at?.trim();
    if (metaPending) {
      pendingStripePriceId = metaPending;
      const asUnix = metaAt && /^\d+$/.test(metaAt) ? Number(metaAt) : null;
      pendingChangeAt = asUnix
        ? unixToIso(asUnix)
        : metaAt || unixToIso(period.end);
    }
  }

  const payload = {
    store_id: resolvedStoreId,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    stripe_price_id: priceId,
    plan,
    status,
    payment_status: derivePaymentStatus(subscription),
    payment_failed_count:
      options?.preserveFailureCount && previous
        ? previous.paymentFailedCount
        : (previous?.paymentFailedCount ?? 0),
    current_period_start: unixToIso(period.start),
    current_period_end: unixToIso(period.end),
    cancel_at_period_end: Boolean(subscription.cancel_at_period_end),
    canceled_at: unixToIso(subscription.canceled_at),
    customer_email: customerEmail ?? previous?.customerEmail ?? null,
    pending_stripe_price_id: pendingStripePriceId,
    pending_change_at: pendingChangeAt,
    stripe_schedule_id: stripeScheduleId,
  };

  let data: SubscriptionDbRow | null = null;

  if (previousByStripe) {
    const { data: updated, error } = await supabase
      .from("subscriptions")
      .update(payload)
      .eq("id", previousByStripe.id)
      .select("*")
      .single();
    if (error) throw error;
    data = updated as SubscriptionDbRow;
  } else if (
    previousByStore &&
    (!previousByStore.stripeSubscriptionId ||
      previousByStore.stripeSubscriptionId === subscription.id ||
      previousByStore.status === "canceled")
  ) {
    // 同一店舗の再契約・または未設定 Subscription ID の更新
    const { data: updated, error } = await supabase
      .from("subscriptions")
      .update(payload)
      .eq("id", previousByStore.id)
      .select("*")
      .single();
    if (error) throw error;
    data = updated as SubscriptionDbRow;
  } else {
    const { data: inserted, error } = await supabase
      .from("subscriptions")
      .upsert(payload, { onConflict: "stripe_subscription_id" })
      .select("*")
      .single();
    if (error) {
      // store_id UNIQUE 衝突時は当該店舗行を更新
      if (
        resolvedStoreId &&
        (error.code === "23505" || String(error.message).includes("store_id"))
      ) {
        const { data: updated, error: updateError } = await supabase
          .from("subscriptions")
          .update(payload)
          .eq("store_id", resolvedStoreId)
          .select("*")
          .single();
        if (updateError) throw updateError;
        data = updated as SubscriptionDbRow;
      } else {
        throw error;
      }
    } else {
      data = inserted as SubscriptionDbRow;
    }
  }

  if (!data) throw new Error("subscription upsert returned empty data");

  if (resolvedStoreId) {
    await syncJobAccessFromSubscription(resolvedStoreId, plan, status);
  }
  return mapSubscriptionRow(data);
}

export async function markInvoicePaid(
  stripeSubscriptionId: string,
  periodStartUnix?: number | null,
  periodEndUnix?: number | null,
): Promise<SubscriptionRecord | null> {
  const supabase = createSupabaseAdmin();
  const record = await getSubscriptionByStripeId(stripeSubscriptionId);
  if (!record) return null;

  const updates: Record<string, unknown> = {
    payment_status: "paid",
    payment_failed_count: 0,
    status: "active",
    current_period_start:
      unixToIso(periodStartUnix) ?? record.currentPeriodStart,
    current_period_end: unixToIso(periodEndUnix) ?? record.currentPeriodEnd,
  };
  const { data, error } = await supabase
    .from("subscriptions")
    .update(updates)
    .eq("id", record.id)
    .select("*")
    .single();
  if (error) throw error;
  if (record.storeId) {
    await syncJobAccessFromSubscription(record.storeId, record.plan, "active");
  }
  return mapSubscriptionRow(data as SubscriptionDbRow);
}

export async function markInvoicePaymentFailed(
  stripeSubscriptionId: string,
  options?: {
    /** Stripe Invoice.attempt_count（同一請求の再送で二重加算しない） */
    attemptCount?: number | null;
    invoiceId?: string | null;
  },
): Promise<SubscriptionRecord | null> {
  const supabase = createSupabaseAdmin();
  const record = await getSubscriptionByStripeId(stripeSubscriptionId);
  if (!record) return null;

  const attempt =
    typeof options?.attemptCount === "number" &&
    Number.isFinite(options.attemptCount) &&
    options.attemptCount > 0
      ? Math.floor(options.attemptCount)
      : null;

  // attempt_count があればそれを採用。無い場合のみ +1（ただし既に past_due/unpaid で
  // 同じ invoice の再処理は呼び出し側で抑止する）
  const failed = attempt ?? (record.paymentFailedCount ?? 0) + 1;
  const nextStatus = failed >= 3 ? "unpaid" : "past_due";
  const { data, error } = await supabase
    .from("subscriptions")
    .update({
      payment_status: "payment_failed",
      status: nextStatus,
      payment_failed_count: failed,
    })
    .eq("id", record.id)
    .select("*")
    .single();
  if (error) throw error;
  if (record.storeId) {
    await syncJobAccessFromSubscription(record.storeId, record.plan, nextStatus);
  }
  return mapSubscriptionRow(data as SubscriptionDbRow);
}

export async function syncJobAccessFromSubscription(
  storeId: string | null | undefined,
  plan: JobPlan,
  status: SubscriptionStatus,
): Promise<void> {
  if (!storeId) return;
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

/**
 * Stripe API から全 Subscription を取得して upsert（管理画面の手動同期用）。
 */
export async function syncAllSubscriptionsFromStripe(): Promise<{
  synced: number;
  unlinked: number;
  errors: string[];
}> {
  const { getStripeServer } = await import("@/lib/stripe");
  const stripe = getStripeServer();
  let startingAfter: string | undefined;
  let synced = 0;
  let unlinked = 0;
  const errors: string[] = [];

  for (;;) {
    const page = await stripe.subscriptions.list({
      limit: 100,
      status: "all",
      starting_after: startingAfter,
      expand: ["data.customer", "data.latest_invoice", "data.items.data.price"],
    });

    for (const sub of page.data) {
      try {
        const record = await upsertSubscriptionFromStripe(sub);
        synced += 1;
        if (!record.storeId) unlinked += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        errors.push(`${sub.id}: ${message}`);
      }
    }

    if (!page.has_more || page.data.length === 0) break;
    startingAfter = page.data[page.data.length - 1]?.id;
    if (!startingAfter) break;
  }

  return { synced, unlinked, errors };
}

export type LinkSubscriptionResult = {
  subscription: SubscriptionRecord;
  shopName: string;
  replacedPreviousSubscriptionId: string | null;
};

/**
 * 管理画面からの手動店舗紐付け。
 * Stripe の料金・期間・Schedule・解約予約は変更しない（DB の store_id のみ）。
 * 必要なら Stripe metadata.store_id のみ更新（請求に影響なし）。
 */
export async function linkSubscriptionToStore(params: {
  stripeSubscriptionId: string;
  storeId: string;
  /** 店舗に別契約がある場合、既存の store_id を外して付け替える */
  confirmReplaceExisting?: boolean;
}): Promise<LinkSubscriptionResult> {
  const supabase = createSupabaseAdmin();
  const storeId = params.storeId.trim();
  const stripeSubscriptionId = params.stripeSubscriptionId.trim();
  if (!storeId || !stripeSubscriptionId) {
    throw new Error("storeId と stripeSubscriptionId は必須です。");
  }

  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select("id, shop_name")
    .eq("id", storeId)
    .maybeSingle();
  if (jobError) throw jobError;
  if (!job) throw new Error("指定された店舗が見つかりません。");

  const record = await getSubscriptionByStripeId(stripeSubscriptionId);
  if (!record) throw new Error("指定された契約が見つかりません。");

  if (record.storeId && record.storeId === storeId) {
    return {
      subscription: record,
      shopName: (job.shop_name as string)?.trim() || "店舗名未設定",
      replacedPreviousSubscriptionId: null,
    };
  }

  if (record.storeId && record.storeId !== storeId) {
    throw new Error(
      "この契約はすでに別店舗に紐付いています。先に紐付けを見直してください。",
    );
  }

  const existingOnStore = await getStoreSubscription(storeId);
  let replacedPreviousSubscriptionId: string | null = null;

  if (
    existingOnStore &&
    existingOnStore.stripeSubscriptionId &&
    existingOnStore.stripeSubscriptionId !== stripeSubscriptionId
  ) {
    if (!params.confirmReplaceExisting) {
      const err = new Error(
        `この店舗にはすでに別契約（${existingOnStore.stripeSubscriptionId}）が紐付いています。付け替える場合は確認のうえ再実行してください。`,
      ) as Error & { code?: string; existingSubscriptionId?: string };
      err.code = "STORE_ALREADY_LINKED";
      err.existingSubscriptionId = existingOnStore.stripeSubscriptionId;
      throw err;
    }

    const { error: unlinkError } = await supabase
      .from("subscriptions")
      .update({ store_id: null })
      .eq("id", existingOnStore.id);
    if (unlinkError) throw unlinkError;
    replacedPreviousSubscriptionId =
      existingOnStore.stripeSubscriptionId ?? existingOnStore.id;
  }

  const { data: updated, error: updateError } = await supabase
    .from("subscriptions")
    .update({ store_id: storeId })
    .eq("stripe_subscription_id", stripeSubscriptionId)
    .select("*")
    .single();
  if (updateError) throw updateError;

  // 請求に影響しない metadata のみ（今後の自動紐付け用）
  try {
    const { getStripeServer } = await import("@/lib/stripe");
    const stripe = getStripeServer();
    const sub = await stripe.subscriptions.retrieve(stripeSubscriptionId);
    await stripe.subscriptions.update(stripeSubscriptionId, {
      metadata: {
        ...sub.metadata,
        store_id: storeId,
      },
    });
    const customerId =
      typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
    if (customerId) {
      const customer = await stripe.customers.retrieve(customerId);
      if (!("deleted" in customer && customer.deleted)) {
        await stripe.customers.update(customerId, {
          metadata: {
            ...customer.metadata,
            store_id: storeId,
          },
        });
      }
    }
  } catch (error) {
    console.warn(
      "[linkSubscriptionToStore] Stripe metadata update skipped",
      error,
    );
  }

  // 紐付け後、掲載状態を契約に合わせて同期（Stripe 課金は変更しない）
  const mapped = mapSubscriptionRow(updated as SubscriptionDbRow);
  await syncJobAccessFromSubscription(storeId, mapped.plan, mapped.status);

  return {
    subscription: mapped,
    shopName: (job.shop_name as string)?.trim() || "店舗名未設定",
    replacedPreviousSubscriptionId,
  };
}

