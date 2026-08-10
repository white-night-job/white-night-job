import type { JobPlan } from "@/lib/job-plan";
import type { StripeBillingKey } from "@/lib/stripe-billing";

export type SubscriptionStatus =
  | "incomplete"
  | "incomplete_expired"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "paused";

export type PendingPlanChange = {
  stripePriceId: string;
  billingKey: StripeBillingKey | null;
  billingLabel: string | null;
  plan: JobPlan;
  effectiveAt: string;
  scheduleId: string;
};

export type SubscriptionRecord = {
  id: string;
  /** null = 店舗未紐付け */
  storeId: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  plan: JobPlan;
  status: SubscriptionStatus;
  paymentStatus: string | null;
  paymentFailedCount: number;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: string | null;
  customerEmail: string | null;
  pendingStripePriceId: string | null;
  pendingChangeAt: string | null;
  stripeScheduleId: string | null;
  createdAt: string;
  updatedAt: string;
};

export const SUBSCRIPTION_STATUS_LABELS_JA: Record<SubscriptionStatus, string> = {
  incomplete: "未完了",
  incomplete_expired: "期限切れ",
  trialing: "トライアル",
  active: "有効",
  past_due: "支払い遅延",
  unpaid: "未払い",
  canceled: "解約済み",
  paused: "一時停止",
};

export function subscriptionStatusLabelJa(status: string): string {
  return (
    SUBSCRIPTION_STATUS_LABELS_JA[status as SubscriptionStatus] ?? status
  );
}
