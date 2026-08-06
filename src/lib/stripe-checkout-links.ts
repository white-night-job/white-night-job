import {
  STRIPE_BILLING_DEFINITIONS,
  STRIPE_BILLING_KEYS,
  isStripeBillingKey,
  type StripeBillingKey,
} from "@/lib/stripe-billing";
import { createSupabaseAdmin } from "@/lib/supabase";

/** 管理画面「Stripe決済リンク管理」用の表示名 */
export const STRIPE_CHECKOUT_LINK_LABELS: Record<StripeBillingKey, string> = {
  light: "ライトプラン",
  standard: "スタンダードプラン（通常）",
  standard_special: "スタンダードプラン（特別価格）",
  premium: "プレミアムプラン（通常）",
  premium_special: "プレミアムプラン（特別価格）",
};

export type StripeCheckoutLinkRecord = {
  billingKey: StripeBillingKey;
  label: string;
  plan: "light" | "standard" | "premium";
  checkoutUrl: string;
  updatedAt: string | null;
};

type DbRow = {
  billing_key: string;
  checkout_url: string | null;
  updated_at: string | null;
};

async function ensureCheckoutLinkRows(): Promise<void> {
  const supabase = createSupabaseAdmin();
  const rows = STRIPE_BILLING_KEYS.map((billing_key) => ({
    billing_key,
    checkout_url: "",
  }));
  const { error } = await supabase
    .from("stripe_checkout_links")
    .upsert(rows, { onConflict: "billing_key", ignoreDuplicates: true });
  if (error) throw error;
}

export async function listStripeCheckoutLinks(): Promise<StripeCheckoutLinkRecord[]> {
  const supabase = createSupabaseAdmin();
  await ensureCheckoutLinkRows();

  const { data, error } = await supabase
    .from("stripe_checkout_links")
    .select("billing_key, checkout_url, updated_at");
  if (error) throw error;

  const byKey = new Map<string, DbRow>();
  for (const row of (data ?? []) as DbRow[]) {
    byKey.set(row.billing_key, row);
  }

  return STRIPE_BILLING_KEYS.map((key) => {
    const row = byKey.get(key);
    return {
      billingKey: key,
      label: STRIPE_CHECKOUT_LINK_LABELS[key],
      plan: STRIPE_BILLING_DEFINITIONS[key].plan,
      checkoutUrl: row?.checkout_url?.trim() ?? "",
      updatedAt: row?.updated_at ?? null,
    };
  });
}

export async function updateStripeCheckoutLink(
  billingKey: string,
  checkoutUrl: string,
): Promise<StripeCheckoutLinkRecord> {
  if (!isStripeBillingKey(billingKey)) {
    throw new Error("billing_key が不正です。");
  }

  const trimmed = checkoutUrl.trim();
  if (trimmed) {
    let parsed: URL;
    try {
      parsed = new URL(trimmed);
    } catch {
      throw new Error("有効な URL を入力してください。");
    }
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      throw new Error("http または https の URL を入力してください。");
    }
  }

  const supabase = createSupabaseAdmin();
  await ensureCheckoutLinkRows();

  const { data, error } = await supabase
    .from("stripe_checkout_links")
    .upsert(
      {
        billing_key: billingKey,
        checkout_url: trimmed,
      },
      { onConflict: "billing_key" },
    )
    .select("billing_key, checkout_url, updated_at")
    .single();
  if (error) throw error;

  const row = data as DbRow;
  return {
    billingKey,
    label: STRIPE_CHECKOUT_LINK_LABELS[billingKey],
    plan: STRIPE_BILLING_DEFINITIONS[billingKey].plan,
    checkoutUrl: row.checkout_url?.trim() ?? "",
    updatedAt: row.updated_at ?? null,
  };
}
