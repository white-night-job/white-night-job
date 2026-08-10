import type Stripe from "stripe";
import { formatJpyPrice, JOB_PLAN_DEFINITIONS, type JobPlan } from "@/lib/job-plan";
import {
  createAdminNotification,
  hasRecentAdminNotification,
  hasRecentAdminNotificationByKey,
  resolveUnreadPaymentFailedNotifications,
} from "@/lib/admin-notifications";
import { notifyAdmin } from "@/lib/admin-notify";
import {
  resolveBillingLabel,
  stripePriceIdToBillingKey,
  stripePriceIdToPlan,
} from "@/lib/stripe";
import { createSupabaseAdmin } from "@/lib/supabase";
import type { SubscriptionRecord } from "@/types/subscription";

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

function formatUnixJst(unix: number | null | undefined): string {
  if (unix == null || !Number.isFinite(unix)) return "—";
  return formatDateTimeJst(new Date(unix * 1000).toISOString());
}

export async function getShopNameByStoreId(
  storeId: string | null | undefined,
): Promise<string> {
  if (!storeId) return "店舗未紐付け";
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
  storeId: string | null;
  title: string;
  message: string;
}): Promise<void> {
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
    `顧客メール：${record.customerEmail ?? "—"}`,
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
  // 決済成功したら、同一契約の未読「決済失敗」は未対応一覧から外す
  if (input.record.stripeSubscriptionId) {
    await resolveUnreadPaymentFailedNotifications(
      input.record.stripeSubscriptionId,
    ).catch((error) => {
      console.warn(
        "[stripe-admin-notify] resolve payment_failed after paid failed",
        error,
      );
    });
  }

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
  invoice?: Stripe.Invoice | null;
}): Promise<void> {
  const invoice = input.invoice ?? null;
  const invoiceId = invoice?.id ?? null;
  const subscriptionId = input.record.stripeSubscriptionId;

  // 同一 Invoice の Webhook 再送で二重通知しない
  if (invoiceId) {
    const alreadyInvoice = await hasRecentAdminNotificationByKey({
      type: "stripe_payment_failed",
      contains: invoiceId,
      withinMinutes: 24 * 60,
    });
    if (alreadyInvoice) return;
  } else if (subscriptionId) {
    const alreadySub = await hasRecentAdminNotificationByKey({
      type: "stripe_payment_failed",
      contains: subscriptionId,
      withinMinutes: 30,
    });
    if (alreadySub) return;
  }

  const shopName = await getShopNameByStoreId(input.record.storeId);
  const failedAtUnix =
    invoice?.status_transitions?.finalized_at ??
    invoice?.created ??
    Math.floor(Date.now() / 1000);
  const nextRetry =
    invoice?.next_payment_attempt != null
      ? formatUnixJst(invoice.next_payment_attempt)
      : "再試行予定なし（または手動対応待ち）";
  const attemptCount =
    typeof invoice?.attempt_count === "number" && invoice.attempt_count > 0
      ? invoice.attempt_count
      : input.record.paymentFailedCount;

  const title = "決済失敗";
  const message = [
    "要約：カード決済失敗",
    `店舗名：${shopName}`,
    `プラン：${resolvePlanLabel(input.record)}`,
    `失敗日時：${formatUnixJst(failedAtUnix)}`,
    `失敗回数：${attemptCount}`,
    `次回再試行予定：${nextRetry}`,
    `状態：${input.record.status}`,
    `Subscription ID：${subscriptionId ?? "—"}`,
    invoiceId ? `Invoice ID：${invoiceId}` : null,
  ]
    .filter(Boolean)
    .join("\n");

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
