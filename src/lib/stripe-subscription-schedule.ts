import type Stripe from "stripe";
import {
  billingKeyToStripePriceId,
  getStripeServer,
  resolveBillingLabel,
  stripePriceIdToBillingKey,
  stripePriceIdToPlan,
} from "@/lib/stripe";
import type { StripeBillingKey } from "@/lib/stripe-billing";
import { STRIPE_BILLING_DEFINITIONS } from "@/lib/stripe-billing";
import type { PendingPlanChange } from "@/types/subscription";

function periodEndUnix(subscription: Stripe.Subscription): number {
  const fromItem = subscription.items?.data?.[0]?.current_period_end;
  if (fromItem && Number.isFinite(fromItem)) return fromItem;
  throw new Error("subscription current_period_end is missing.");
}

function periodStartUnix(subscription: Stripe.Subscription): number {
  const fromItem = subscription.items?.data?.[0]?.current_period_start;
  if (fromItem && Number.isFinite(fromItem)) return fromItem;
  throw new Error("subscription current_period_start is missing.");
}

function currentPriceId(subscription: Stripe.Subscription): string {
  const priceId = subscription.items.data[0]?.price?.id;
  if (!priceId) throw new Error("subscription price is missing.");
  return priceId;
}

function scheduleIdOf(subscription: Stripe.Subscription): string | null {
  if (!subscription.schedule) return null;
  return typeof subscription.schedule === "string"
    ? subscription.schedule
    : subscription.schedule.id;
}

function phasePriceId(
  phase: Stripe.SubscriptionSchedule.Phase,
): string | null {
  const item = phase.items?.[0];
  if (!item) return null;
  if (typeof item.price === "string") return item.price;
  return item.price?.id ?? null;
}

/**
 * プラン変更 Schedule の phases を組み立てる（副作用なし）。
 * - phase0: 現在 Price を当初の period_end まで維持
 * - phase1: 新 Price へ切替（日割りなし）
 */
export function buildDeferredPlanChangePhases(input: {
  currentPriceId: string;
  newPriceId: string;
  phase0StartUnix: number;
  periodEndUnix: number;
  currentBillingKey: string;
  newBillingKey: StripeBillingKey;
}): Stripe.SubscriptionScheduleUpdateParams.Phase[] {
  if (input.currentPriceId === input.newPriceId) {
    throw new Error("すでに同じプランです。");
  }
  if (input.periodEndUnix <= input.phase0StartUnix) {
    throw new Error("請求期間の終了日が不正です。");
  }

  return [
    {
      items: [{ price: input.currentPriceId, quantity: 1 }],
      start_date: input.phase0StartUnix,
      end_date: input.periodEndUnix,
      proration_behavior: "none",
      metadata: {
        billing_key: input.currentBillingKey,
      },
    },
    {
      items: [{ price: input.newPriceId, quantity: 1 }],
      proration_behavior: "none",
      metadata: {
        billing_key: input.newBillingKey,
      },
    },
  ];
}

export function pendingPlanChangeFromSchedule(
  schedule: Stripe.SubscriptionSchedule,
  nowUnix = Math.floor(Date.now() / 1000),
): PendingPlanChange | null {
  if (schedule.status !== "active" && schedule.status !== "not_started") {
    return null;
  }
  const phases = schedule.phases ?? [];
  if (phases.length < 2) return null;

  const current =
    phases.find(
      (p) =>
        p.start_date <= nowUnix &&
        (p.end_date == null || p.end_date > nowUnix),
    ) ?? phases[0];
  const currentIdx = phases.indexOf(current);
  const next = phases[currentIdx + 1] ?? null;
  if (!next) return null;

  const currentPrice = phasePriceId(current);
  const nextPrice = phasePriceId(next);
  if (!nextPrice || !currentPrice || nextPrice === currentPrice) return null;

  const billingKey = stripePriceIdToBillingKey(nextPrice);
  return {
    stripePriceId: nextPrice,
    billingKey,
    billingLabel: billingKey
      ? STRIPE_BILLING_DEFINITIONS[billingKey].label
      : resolveBillingLabel(nextPrice),
    plan: billingKey
      ? STRIPE_BILLING_DEFINITIONS[billingKey].plan
      : (stripePriceIdToPlan(nextPrice) ?? "light"),
    effectiveAt: new Date(next.start_date * 1000).toISOString(),
    scheduleId: schedule.id,
  };
}

export async function getPendingPlanChangeForSubscription(
  subscription: Stripe.Subscription,
): Promise<PendingPlanChange | null> {
  const scheduleId = scheduleIdOf(subscription);
  if (!scheduleId) return null;
  const stripe = getStripeServer();
  const schedule = await stripe.subscriptionSchedules.retrieve(scheduleId);
  return pendingPlanChangeFromSchedule(schedule);
}

/**
 * 管理画面の標準プラン変更。
 * 現在の請求期間終了日（当初の次回更新日）まで旧 Price を維持し、
 * その直後から新 Price へ切り替える（日割り・追加請求・返金なし）。
 * 既存の変更予約がある場合は上書きする（重複予約しない）。
 *
 * ※ Subscription の items/price を即時 update しないこと。
 */
export async function schedulePlanChangeAtPeriodEnd(params: {
  subscriptionId: string;
  billingKey: StripeBillingKey;
}): Promise<{
  subscription: Stripe.Subscription;
  pending: PendingPlanChange;
  originalPeriodEndUnix: number;
}> {
  const stripe = getStripeServer();
  const newPriceId = billingKeyToStripePriceId(params.billingKey);

  let subscription = await stripe.subscriptions.retrieve(params.subscriptionId, {
    expand: ["items.data.price", "schedule"],
  });
  if (!subscription.items.data[0]?.id) {
    throw new Error("subscription item not found.");
  }

  const currentPrice = currentPriceId(subscription);
  if (currentPrice === newPriceId) {
    throw new Error("すでに同じプランです。");
  }

  // 請求サイクルを動かさない: 当初の current_period_end を切替日として固定
  const originalPeriodEnd = periodEndUnix(subscription);

  // 解約予約中にプラン変更する場合は解約予約を解除（継続＋プラン変更の意図）
  if (subscription.cancel_at_period_end) {
    await stripe.subscriptions.update(params.subscriptionId, {
      cancel_at_period_end: false,
    });
    subscription = await stripe.subscriptions.retrieve(params.subscriptionId, {
      expand: ["items.data.price", "schedule"],
    });
  }

  let scheduleId = scheduleIdOf(subscription);

  if (!scheduleId) {
    const created = await stripe.subscriptionSchedules.create({
      from_subscription: params.subscriptionId,
    });
    scheduleId = created.id;
    subscription = await stripe.subscriptions.retrieve(params.subscriptionId, {
      expand: ["items.data.price", "schedule"],
    });
  }

  const schedule = await stripe.subscriptionSchedules.retrieve(scheduleId);
  const nowUnix = Math.floor(Date.now() / 1000);
  const currentPhase =
    schedule.phases.find(
      (p) =>
        p.start_date <= nowUnix &&
        (p.end_date == null || p.end_date > nowUnix),
    ) ?? schedule.phases[0];
  const phase0Start =
    currentPhase?.start_date ??
    schedule.phases[0]?.start_date ??
    periodStartUnix(subscription);

  const currentBillingKey =
    stripePriceIdToBillingKey(currentPrice) ??
    subscription.metadata?.billing_key ??
    "";

  const phases = buildDeferredPlanChangePhases({
    currentPriceId: currentPrice,
    newPriceId,
    phase0StartUnix: phase0Start,
    periodEndUnix: originalPeriodEnd,
    currentBillingKey,
    newBillingKey: params.billingKey,
  });

  await stripe.subscriptionSchedules.update(scheduleId, {
    end_behavior: "release",
    phases,
  });

  // metadata のみ更新（Price の即時変更は行わない）
  await stripe.subscriptions.update(params.subscriptionId, {
    metadata: {
      ...subscription.metadata,
      billing_key: currentBillingKey,
      pending_billing_key: params.billingKey,
      pending_price_id: newPriceId,
      pending_change_at: String(originalPeriodEnd),
    },
  });

  const updatedSchedule = await stripe.subscriptionSchedules.retrieve(scheduleId);
  const pending = pendingPlanChangeFromSchedule(updatedSchedule);
  if (!pending) {
    throw new Error("プラン変更予約の作成に失敗しました。");
  }
  if (pending.effectiveAt !== new Date(originalPeriodEnd * 1000).toISOString()) {
    throw new Error("切替予定日が当初の次回更新日と一致しません。");
  }

  const updatedSub = await stripe.subscriptions.retrieve(params.subscriptionId, {
    expand: ["items.data.price", "latest_invoice", "customer", "schedule"],
  });

  // 防御: 即時に Price が変わっていないこと
  const stillCurrent = updatedSub.items.data[0]?.price?.id;
  if (stillCurrent !== currentPrice) {
    throw new Error(
      "プラン変更予約後に現在の Price が変わってしまいました。処理を中止してください。",
    );
  }

  const stillPeriodEnd = periodEndUnix(updatedSub);
  if (stillPeriodEnd !== originalPeriodEnd) {
    throw new Error(
      "プラン変更予約により次回更新日が変わってしまいました。処理を中止してください。",
    );
  }

  return {
    subscription: updatedSub,
    pending,
    originalPeriodEndUnix: originalPeriodEnd,
  };
}

/**
 * プラン変更予約を取消し、現在の Price を継続する。
 */
export async function cancelPendingPlanChange(
  subscriptionId: string,
): Promise<Stripe.Subscription> {
  const stripe = getStripeServer();
  let subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["schedule", "items.data.price"],
  });
  const scheduleId = scheduleIdOf(subscription);
  const priceBefore = currentPriceId(subscription);
  const periodEndBefore = periodEndUnix(subscription);

  if (scheduleId) {
    const schedule = await stripe.subscriptionSchedules.retrieve(scheduleId);
    if (schedule.status === "active" || schedule.status === "not_started") {
      await stripe.subscriptionSchedules.release(scheduleId);
    }
  }

  const billingKey = stripePriceIdToBillingKey(priceBefore);
  subscription = await stripe.subscriptions.update(subscriptionId, {
    metadata: {
      ...subscription.metadata,
      billing_key: billingKey ?? subscription.metadata?.billing_key ?? "",
      pending_billing_key: "",
      pending_price_id: "",
      pending_change_at: "",
    },
  });

  const refreshed = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["items.data.price", "latest_invoice", "customer", "schedule"],
  });

  if (currentPriceId(refreshed) !== priceBefore) {
    throw new Error("予約取消後に現在の Price が変化しました。");
  }
  if (periodEndUnix(refreshed) !== periodEndBefore) {
    throw new Error("予約取消後に次回更新日が変化しました。");
  }

  return refreshed;
}

/**
 * 期間終了解約を予約（即時 cancel しない）。
 * 当初の次回更新日まで現在プランを継続し、その日に契約終了する。
 * 既存のプラン変更予約がある場合は解除してから解約予約する。
 * ※ pause_collection には触れない（既存の一時停止テスト契約を変更しない）。
 */
export async function scheduleCancelAtPeriodEnd(
  subscriptionId: string,
): Promise<{
  subscription: Stripe.Subscription;
  cancelAtUnix: number;
}> {
  const stripe = getStripeServer();
  let subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["items.data.price", "schedule"],
  });

  if (subscription.status === "canceled") {
    throw new Error("すでに解約済みの契約です。");
  }

  const priceBefore = currentPriceId(subscription);
  const originalPeriodEnd = periodEndUnix(subscription);

  if (subscription.cancel_at_period_end) {
    const refreshed = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ["items.data.price", "latest_invoice", "customer", "schedule"],
    });
    return { subscription: refreshed, cancelAtUnix: originalPeriodEnd };
  }

  // プラン変更 Schedule があると期間終了解約と競合するため先に解除
  const scheduleId = scheduleIdOf(subscription);
  if (scheduleId) {
    const schedule = await stripe.subscriptionSchedules.retrieve(scheduleId);
    if (schedule.status === "active" || schedule.status === "not_started") {
      await stripe.subscriptionSchedules.release(scheduleId);
    }
  }

  subscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
    metadata: {
      ...subscription.metadata,
      pending_billing_key: "",
      pending_price_id: "",
      pending_change_at: "",
    },
  });

  const refreshed = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["items.data.price", "latest_invoice", "customer", "schedule"],
  });

  if (!refreshed.cancel_at_period_end) {
    throw new Error("解約予約の設定に失敗しました。");
  }
  if (currentPriceId(refreshed) !== priceBefore) {
    throw new Error("解約予約後に現在の Price が変化しました。");
  }
  if (periodEndUnix(refreshed) !== originalPeriodEnd) {
    throw new Error("解約予約により次回更新日が変化しました。");
  }

  return { subscription: refreshed, cancelAtUnix: originalPeriodEnd };
}

/**
 * 解約予約を取消し、現在の契約を継続する。
 * ※ pause_collection には触れない。
 */
export async function revokeCancelAtPeriodEnd(
  subscriptionId: string,
): Promise<Stripe.Subscription> {
  const stripe = getStripeServer();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["items.data.price", "schedule"],
  });

  if (subscription.status === "canceled") {
    throw new Error("すでに解約済みのため取消できません。");
  }
  if (!subscription.cancel_at_period_end) {
    throw new Error("解約予約がありません。");
  }

  const priceBefore = currentPriceId(subscription);
  const periodEndBefore = periodEndUnix(subscription);

  await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });

  const refreshed = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["items.data.price", "latest_invoice", "customer", "schedule"],
  });

  if (refreshed.cancel_at_period_end) {
    throw new Error("解約予約の取消に失敗しました。");
  }
  if (currentPriceId(refreshed) !== priceBefore) {
    throw new Error("解約予約取消後に現在の Price が変化しました。");
  }
  if (periodEndUnix(refreshed) !== periodEndBefore) {
    throw new Error("解約予約取消後に次回更新日が変化しました。");
  }

  return refreshed;
}
