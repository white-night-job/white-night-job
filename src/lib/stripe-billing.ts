import type { PaidJobPlan } from "@/lib/job-plan";

/**
 * Stripe Billing Price keys（金額は Stripe Dashboard 側で管理。
 * アプリには Price ID のみを環境変数で渡す）
 *
 * 貼り付け先: `.env.local` および Vercel Environment Variables
 *  - STRIPE_PRICE_ID_LIGHT
 *  - STRIPE_PRICE_ID_STANDARD
 *  - STRIPE_PRICE_ID_STANDARD_SPECIAL
 *  - STRIPE_PRICE_ID_PREMIUM
 *  - STRIPE_PRICE_ID_PREMIUM_SPECIAL
 */
export const STRIPE_BILLING_KEYS = [
  "light",
  "standard",
  "standard_special",
  "premium",
  "premium_special",
] as const;

export type StripeBillingKey = (typeof STRIPE_BILLING_KEYS)[number];

export const STRIPE_BILLING_DEFINITIONS: Record<
  StripeBillingKey,
  {
    key: StripeBillingKey;
    label: string;
    /** 掲載機能プラン（jobs.plan / subscriptions.plan）— paid only */
    plan: PaidJobPlan;
    /** 店舗 Checkout で選択可能か（特別価格は管理者のみ） */
    shopSelectable: boolean;
    envName: string;
  }
> = {
  light: {
    key: "light",
    label: "ライト",
    plan: "light",
    shopSelectable: true,
    envName: "STRIPE_PRICE_ID_LIGHT",
  },
  standard: {
    key: "standard",
    label: "スタンダード通常",
    plan: "standard",
    shopSelectable: true,
    envName: "STRIPE_PRICE_ID_STANDARD",
  },
  standard_special: {
    key: "standard_special",
    label: "スタンダード特別価格",
    plan: "standard",
    shopSelectable: false,
    envName: "STRIPE_PRICE_ID_STANDARD_SPECIAL",
  },
  premium: {
    key: "premium",
    label: "プレミアム通常",
    plan: "premium",
    shopSelectable: true,
    envName: "STRIPE_PRICE_ID_PREMIUM",
  },
  premium_special: {
    key: "premium_special",
    label: "プレミアム特別価格",
    plan: "premium",
    shopSelectable: false,
    envName: "STRIPE_PRICE_ID_PREMIUM_SPECIAL",
  },
};

export function isStripeBillingKey(value: unknown): value is StripeBillingKey {
  return (
    typeof value === "string" &&
    (STRIPE_BILLING_KEYS as readonly string[]).includes(value)
  );
}

/** Paid JobPlan（店舗選択）→ 通常価格の BillingKey。未契約は Stripe 対象外。 */
export function jobPlanToRegularBillingKey(plan: PaidJobPlan): StripeBillingKey {
  switch (plan) {
    case "light":
      return "light";
    case "standard":
      return "standard";
    case "premium":
      return "premium";
  }
}

export function billingKeyToJobPlan(key: StripeBillingKey): PaidJobPlan {
  return STRIPE_BILLING_DEFINITIONS[key].plan;
}
