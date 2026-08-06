import { formatJpyPrice, JOB_PLAN_DEFINITIONS, type JobPlan } from "@/lib/job-plan";
import {
  createAdminNotification,
  hasRecentAdminNotification,
} from "@/lib/admin-notifications";
import { notifyAdmin } from "@/lib/admin-notify";
import {
  resolveBillingLabel,
  stripePriceIdToBillingKey,
  stripePriceIdToPlan,
} from "@/lib/stripe";
import { createSupabaseAdmin } from "@/lib/supabase";
import type { SubscriptionRecord } from "@/types/subscription";
import type Stripe from "stripe";

function formatDateTimeJst(iso: string | null | undefined): string {
  const date = iso ? new Date(iso) : new Date();
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export async function getShopNameByStoreId(storeId: string): Promise<string> {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("jobs")
    .select("shop_name")
    .eq("id", storeId)
    .maybeSingle();
  if (error) throw error;
  return (data?.shop_name as string | undefined)?.trim() || "店舗名未設定";
}

function resolvePlanLabel(record: SubscriptionRecord): string {
  const billingLabel = resolveBillingLabel(record.stripePriceId);
  if (billingLabel) return billingLabel;
  return JOB_PLAN_DEFINITIONS[record.plan].label;
}

/** Stripe Price の unit_amount（JPY）を優先。なければプラン定義の金額。 */
export function resolveMonthlyPriceLabel(
  subscription: Stripe.Subscription | null,
  plan: JobPlan,
): string {
  const unitAmount = subscription?.items?.data?.[0]?.price?.unit_amount;
  if (typeof unitAmount === "number" && Number.isFinite(unitAmount)) {
    return `${formatJpyPrice(unitAmount)}／月`;
  }
  return `${formatJpyPrice(JOB_PLAN_DEFINITIONS[plan].monthlyPrice)}／月`;
}

async function persistAndSend(input: {
  type: string;
  storeId: string;
  title: string;
  message: string;
}): Promise<void> {
  // 通知保存を先に確定。メール失敗でも通知自体は成功扱い。
  await createAdminNotification({
    type: input.type,
    storeId: input.storeId,
    title: input.title,
    message: input.message,
  });

  try {
    const result = await notifyAdmin({
      title: input.title,
      message: input.message,
      shortMessage: input.title,
    });
    if (!result.ok) {
      console.warn("[stripe-admin-notify] channel send skipped/failed", result);
    }
  } catch (error) {
    console.warn("[stripe-admin-notify] email failed after save", error);
  }
}

export async function notifyStripeNewContract(input: {
  record: SubscriptionRecord;
  stripeSubscription?: Stripe.Subscription | null;
  sourceEvent: "checkout.session.completed" | "customer.subscription.created";
}): Promise<void> {
  const { record } = input;
  if (!record.stripeSubscriptionId) return;

  const already = await hasRecentAdminNotification({
    type: "stripe_new_contract",
    storeId: record.storeId,
    contains: record.stripeSubscriptionId,
    withinMinutes: 60,
  });
  if (already) return;

  if (
    input.sourceEvent === "customer.subscription.created" &&
    record.status !== "active" &&
    record.status !== "trialing"
  ) {
    return;
  }

  const shopName = await getShopNameByStoreId(record.storeId);
  const planLabel = resolvePlanLabel(record);
  const plan =
    stripePriceIdToPlan(record.stripePriceId ?? "") ?? record.plan;
  const monthly = resolveMonthlyPriceLabel(
    input.stripeSubscription ?? null,
    plan,
  );

  const title = "新規契約";
  const message = [
    `要約：${planLabel}契約`,
    `店舗名：${shopName}`,
    `プラン：${planLabel}`,
    `月額料金：${monthly}`,
    `契約日時：${formatDateTimeJst(record.currentPeriodStart ?? record.createdAt)}`,
    `Stripe Customer ID：${record.stripeCustomerId ?? "—"}`,
    `Stripe Subscription ID：${record.stripeSubscriptionId}`,
    `イベント：${input.sourceEvent}`,
  ].join("\n");

  await persistAndSend({
    type: "stripe_new_contract",
    storeId: record.storeId,
    title,
    message,
  });
}

export async function notifyStripeInvoicePaid(input: {
  record: SubscriptionRecord;
  billingReason?: string | null;
  amountPaid?: number | null;
}): Promise<void> {
  if (
    input.billingReason === "subscription_create" ||
    input.billingReason === "subscription"
  ) {
    return;
  }

  const shopName = await getShopNameByStoreId(input.record.storeId);
  const amountLabel =
    typeof input.amountPaid === "number" && Number.isFinite(input.amountPaid)
      ? formatJpyPrice(input.amountPaid)
      : null;
  const title = "定期決済成功";
  const message = [
    `要約：${amountLabel ?? "定期決済完了"}`,
    `店舗名：${shopName}`,
    amountLabel ? `金額：${amountLabel}` : null,
    `プラン：${resolvePlanLabel(input.record)}`,
    `次回請求日：${formatDateTimeJst(input.record.currentPeriodEnd)}`,
    `Subscription ID：${input.record.stripeSubscriptionId ?? "—"}`,
  ]
    .filter(Boolean)
    .join("\n");

  if (input.record.stripeSubscriptionId) {
    const already = await hasRecentAdminNotification({
      type: "stripe_invoice_paid",
      storeId: input.record.storeId,
      contains: input.record.stripeSubscriptionId,
      withinMinutes: 10,
    });
    if (already) return;
  }

  await persistAndSend({
    type: "stripe_invoice_paid",
    storeId: input.record.storeId,
    title,
    message,
  });
}

export async function notifyStripePaymentFailed(input: {
  record: SubscriptionRecord;
}): Promise<void> {
  const shopName = await getShopNameByStoreId(input.record.storeId);
  const title = "決済失敗";
  const message = [
    "要約：カード決済失敗",
    `店舗名：${shopName}`,
    `プラン：${resolvePlanLabel(input.record)}`,
    `失敗回数：${input.record.paymentFailedCount}`,
    `状態：${input.record.status}`,
    `Subscription ID：${input.record.stripeSubscriptionId ?? "—"}`,
  ].join("\n");

  await persistAndSend({
    type: "stripe_payment_failed",
    storeId: input.record.storeId,
    title,
    message,
  });
}

export async function notifyStripeCanceled(input: {
  record: SubscriptionRecord;
}): Promise<void> {
  const shopName = await getShopNameByStoreId(input.record.storeId);
  const planLabel = resolvePlanLabel(input.record);
  const title = "解約";
  const message = [
    `要約：${planLabel}解約`,
    `店舗名：${shopName}`,
    `プラン：${planLabel}`,
    `Subscription ID：${input.record.stripeSubscriptionId ?? "—"}`,
  ].join("\n");

  if (input.record.stripeSubscriptionId) {
    const already = await hasRecentAdminNotification({
      type: "stripe_canceled",
      storeId: input.record.storeId,
      contains: input.record.stripeSubscriptionId,
      withinMinutes: 60,
    });
    if (already) return;
  }

  await persistAndSend({
    type: "stripe_canceled",
    storeId: input.record.storeId,
    title,
    message,
  });
}

export function billingKeyLabelFromPriceId(priceId: string | null): string | null {
  if (!priceId) return null;
  try {
    const key = stripePriceIdToBillingKey(priceId);
    return key ? resolveBillingLabel(priceId) : null;
  } catch {
    return null;
  }
}
