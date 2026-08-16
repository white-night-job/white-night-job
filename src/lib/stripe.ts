import Stripe from "stripe";
import { isPaidJobPlan, type PaidJobPlan } from "@/lib/job-plan";
import {
  STRIPE_BILLING_DEFINITIONS,
  STRIPE_BILLING_KEYS,
  billingKeyToJobPlan,
  isStripeBillingKey,
  jobPlanToRegularBillingKey,
  type StripeBillingKey,
} from "@/lib/stripe-billing";

export {
  STRIPE_BILLING_DEFINITIONS,
  STRIPE_BILLING_KEYS,
  billingKeyToJobPlan,
  isStripeBillingKey,
  jobPlanToRegularBillingKey,
  type StripeBillingKey,
} from "@/lib/stripe-billing";

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is not set.`);
  }
  return value;
}

let stripeSingleton: Stripe | null = null;

export function getStripeServer(): Stripe {
  if (stripeSingleton) return stripeSingleton;
  stripeSingleton = new Stripe(requireEnv("STRIPE_SECRET_KEY"), {
    apiVersion: "2026-07-29.dahlia",
    appInfo: {
      name: "White Night Job",
      version: "1.0.0",
    },
  });
  return stripeSingleton;
}

export function getStripePriceIdMap(): Record<StripeBillingKey, string> {
  return {
    light: requireEnv(STRIPE_BILLING_DEFINITIONS.light.envName),
    standard: requireEnv(STRIPE_BILLING_DEFINITIONS.standard.envName),
    standard_special: requireEnv(
      STRIPE_BILLING_DEFINITIONS.standard_special.envName,
    ),
    premium: requireEnv(STRIPE_BILLING_DEFINITIONS.premium.envName),
    premium_special: requireEnv(
      STRIPE_BILLING_DEFINITIONS.premium_special.envName,
    ),
  };
}

export function billingKeyToStripePriceId(key: StripeBillingKey): string {
  return getStripePriceIdMap()[key];
}

/** 店舗 Checkout 用: JobPlan → 通常価格 Price ID（未契約は対象外） */
export function planToStripePriceId(plan: PaidJobPlan): string {
  return billingKeyToStripePriceId(jobPlanToRegularBillingKey(plan));
}

export function stripePriceIdToBillingKey(
  priceId: string,
): StripeBillingKey | null {
  const map = getStripePriceIdMap();
  for (const key of STRIPE_BILLING_KEYS) {
    if (map[key] === priceId) return key;
  }
  return null;
}

export function stripePriceIdToPlan(priceId: string): PaidJobPlan | null {
  const billingKey = stripePriceIdToBillingKey(priceId);
  if (!billingKey) return null;
  return billingKeyToJobPlan(billingKey);
}

export function resolveBillingLabel(priceId: string | null | undefined): string | null {
  if (!priceId) return null;
  try {
    const key = stripePriceIdToBillingKey(priceId);
    return key ? STRIPE_BILLING_DEFINITIONS[key].label : null;
  } catch {
    return null;
  }
}

export function resolveBillingKeySafe(
  priceId: string | null | undefined,
): StripeBillingKey | null {
  if (!priceId) return null;
  try {
    return stripePriceIdToBillingKey(priceId);
  } catch {
    return null;
  }
}

export function normalizeBillingKeyInput(
  value: unknown,
): StripeBillingKey | null {
  if (!isStripeBillingKey(value)) return null;
  return value;
}

/** 店舗 Checkout 用: light / standard / premium のみ */
export function normalizePlanInput(value: unknown): PaidJobPlan | null {
  if (!isPaidJobPlan(value)) return null;
  return value;
}

/**
 * 管理画面のプラン変更用。
 * BillingKey（5種）または JobPlan（通常価格3種）を受け付ける。
 */
export function normalizeAdminPlanChangeInput(
  value: unknown,
): StripeBillingKey | null {
  if (isStripeBillingKey(value)) return value;
  if (isPaidJobPlan(value)) return jobPlanToRegularBillingKey(value);
  return null;
}

export function getStripeWebhookSecret(): string {
  return requireEnv("STRIPE_WEBHOOK_SECRET");
}

export function getStripePublicKey(): string {
  return requireEnv("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
}

export function buildAbsoluteUrl(pathname: string): string {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    "http://localhost:3000";
  return new URL(pathname, base).toString();
}
