import type { ListingPriority } from "@/lib/listing-priority";

/** Display order in admin plan picker (uncontracted first). */
export const JOB_PLANS = ["uncontracted", "light", "standard", "premium"] as const;
export type JobPlan = (typeof JOB_PLANS)[number];

/** Paid / Stripe-backed plans only (excludes uncontracted). */
export const PAID_JOB_PLANS = ["light", "standard", "premium"] as const;
export type PaidJobPlan = (typeof PAID_JOB_PLANS)[number];

export type JobPlanFeatures = {
  listingPriority: ListingPriority;
  newListing: boolean;
  /** 新着店舗一覧に表示する日数（公開日からの日数） */
  newListingDays: number;
  pickup: boolean;
  aiRecommend: boolean;
  /** Higher = stronger AI ranking when enabled */
  aiPriority: number;
  lineRecommendNotify: boolean;
  boost: boolean;
  analytics: boolean;
  /** 職種診断結果からの店舗紹介対象 */
  diagnosisRecommend: boolean;
};

export type JobPlanDefinition = {
  key: JobPlan;
  label: string;
  /** 月額（税込）。未契約は 0。サイト内の料金表示はここを参照する。 */
  monthlyPrice: number;
  priceLabel: string;
  /** Short card subtitle under the plan name */
  cardSubtitle: string;
  /** Optional small note under subtitle (uncontracted) */
  cardNote?: string;
  features: JobPlanFeatures;
};

/** Single source of truth for plan pricing (tax included, monthly). */
export const JOB_PLAN_MONTHLY_PRICES: Record<JobPlan, number> = {
  uncontracted: 0,
  light: 18000,
  standard: 33000,
  premium: 55000,
};

/** 1234567 -> "1,234,567" */
export function formatJpyAmount(amount: number): string {
  return new Intl.NumberFormat("ja-JP").format(amount);
}

/** 18000 -> "18,000円" */
export function formatJpyPrice(amount: number): string {
  return `${formatJpyAmount(amount)}円`;
}

export function getPlanMonthlyPrice(plan: JobPlan): number {
  return JOB_PLAN_MONTHLY_PRICES[plan];
}

/** 例: "税込18,000円/月" — uncontracted has no fee */
export function formatPlanPriceLabel(plan: JobPlan): string {
  if (plan === "uncontracted") return "店舗情報のみ掲載";
  return `税込${formatJpyPrice(JOB_PLAN_MONTHLY_PRICES[plan])}/月`;
}

const UNCONTRACTED_FEATURES: JobPlanFeatures = {
  listingPriority: "normal",
  newListing: false,
  newListingDays: 0,
  pickup: false,
  aiRecommend: false,
  aiPriority: 0,
  lineRecommendNotify: false,
  boost: false,
  analytics: false,
  diagnosisRecommend: false,
};

export const JOB_PLAN_DEFINITIONS: Record<JobPlan, JobPlanDefinition> = {
  uncontracted: {
    key: "uncontracted",
    label: "未契約店舗",
    monthlyPrice: 0,
    priceLabel: formatPlanPriceLabel("uncontracted"),
    cardSubtitle: "店舗情報のみ掲載",
    cardNote: "求人情報・応募機能は表示されません",
    features: UNCONTRACTED_FEATURES,
  },
  light: {
    key: "light",
    label: "ライト",
    monthlyPrice: JOB_PLAN_MONTHLY_PRICES.light,
    priceLabel: formatPlanPriceLabel("light"),
    cardSubtitle: formatPlanPriceLabel("light"),
    features: {
      listingPriority: "normal",
      newListing: true,
      newListingDays: 30,
      pickup: false,
      aiRecommend: false,
      aiPriority: 0,
      lineRecommendNotify: false,
      boost: true,
      analytics: false,
      diagnosisRecommend: false,
    },
  },
  standard: {
    key: "standard",
    label: "スタンダード",
    monthlyPrice: JOB_PLAN_MONTHLY_PRICES.standard,
    priceLabel: formatPlanPriceLabel("standard"),
    cardSubtitle: formatPlanPriceLabel("standard"),
    features: {
      listingPriority: "priority",
      newListing: true,
      newListingDays: 60,
      pickup: false,
      aiRecommend: true,
      aiPriority: 50,
      lineRecommendNotify: false,
      boost: true,
      analytics: true,
      diagnosisRecommend: false,
    },
  },
  premium: {
    key: "premium",
    label: "プレミアム",
    monthlyPrice: JOB_PLAN_MONTHLY_PRICES.premium,
    priceLabel: formatPlanPriceLabel("premium"),
    cardSubtitle: formatPlanPriceLabel("premium"),
    features: {
      listingPriority: "top",
      newListing: true,
      newListingDays: 60,
      pickup: true,
      aiRecommend: true,
      aiPriority: 100,
      lineRecommendNotify: true,
      boost: true,
      analytics: true,
      diagnosisRecommend: true,
    },
  },
};

export const JOB_PLAN_FEATURE_LABELS: Array<{
  key: keyof JobPlanFeatures;
  label: string;
  isBoolean: boolean;
}> = [
  { key: "newListing", label: "新着掲載", isBoolean: true },
  { key: "boost", label: "上位表示ボタン", isBoolean: true },
  { key: "pickup", label: "PickUp掲載", isBoolean: true },
  { key: "aiRecommend", label: "AIおすすめ表示", isBoolean: true },
  { key: "lineRecommendNotify", label: "LINEおすすめ通知", isBoolean: true },
  { key: "diagnosisRecommend", label: "職種診断からの紹介", isBoolean: true },
  { key: "analytics", label: "アクセス・応募分析レポート（詳細）", isBoolean: true },
];

export function isJobPlan(value: unknown): value is JobPlan {
  return typeof value === "string" && (JOB_PLANS as readonly string[]).includes(value);
}

export function isPaidJobPlan(value: unknown): value is PaidJobPlan {
  return (
    typeof value === "string" &&
    (PAID_JOB_PLANS as readonly string[]).includes(value)
  );
}

export function isUncontractedPlan(
  plan: JobPlan | string | null | undefined,
): boolean {
  if (plan == null || plan === "") return false;
  if (typeof plan !== "string") return false;
  const trimmed = plan.trim().toLowerCase().replace(/\s+/g, "");
  return (
    trimmed === "uncontracted" ||
    trimmed === "未契約" ||
    trimmed === "未契約店舗"
  );
}

/** Public-facing label for uncontracted listings (never show「未契約店舗」to visitors). */
export const UNCONTRACTED_PUBLIC_LABEL = "店舗情報";

export const UNCONTRACTED_DISCLAIMER =
  "こちらの店舗情報はWhiteNightJobでの求人・優良認定は行われていません。公開情報をもとに掲載しています。";

export const UNCONTRACTED_OWNER_NOTE =
  "こちらの店舗関係者様は、店舗情報の修正・削除・正式な求人掲載のお申込みが可能です。";

/** DB・フォーム・表記ゆれ（premium / プレミアム / PREMIUM 等）を正規化する。 */
export function parseJobPlan(value: unknown): JobPlan {
  if (typeof value !== "string") return "light";
  const trimmed = value.trim();
  if (isJobPlan(trimmed)) return trimmed;

  const normalized = trimmed.toLowerCase().replace(/\s+/g, "");
  if (
    normalized === "uncontracted" ||
    normalized === "未契約" ||
    normalized === "未契約店舗"
  ) {
    return "uncontracted";
  }
  if (
    normalized === "premium" ||
    normalized === "プレミアム" ||
    normalized === "プレミアムプラン"
  ) {
    return "premium";
  }
  if (
    normalized === "standard" ||
    normalized === "スタンダード" ||
    normalized === "スタンダードプラン"
  ) {
    return "standard";
  }
  if (
    normalized === "light" ||
    normalized === "ライト" ||
    normalized === "ライトプラン"
  ) {
    return "light";
  }

  return "light";
}

/** AIチャットボットで紹介可能な掲載プラン（スタンダード・プレミアムのみ） */
export const CHAT_BOT_ELIGIBLE_PLANS = ["standard", "premium"] as const;

export type ChatBotEligiblePlan = (typeof CHAT_BOT_ELIGIBLE_PLANS)[number];

export function isChatBotEligiblePlan(
  plan: JobPlan | string | null | undefined,
): plan is ChatBotEligiblePlan {
  const normalized = parseJobPlan(plan);
  return normalized === "standard" || normalized === "premium";
}

export function getPlanFeatures(plan: JobPlan | null | undefined): JobPlanFeatures {
  return JOB_PLAN_DEFINITIONS[parseJobPlan(plan)].features;
}

export function getPlanDefinition(plan: JobPlan | null | undefined): JobPlanDefinition {
  return JOB_PLAN_DEFINITIONS[parseJobPlan(plan)];
}

/** Infer plan for legacy rows that only have ranking / pickup / AI flags. */
export function inferJobPlan(input: {
  listingPriority?: string | null;
  pickupEnabled?: boolean | null;
  chatRecommendEnabled?: boolean | null;
}): JobPlan {
  if (input.listingPriority === "top" || input.pickupEnabled) return "premium";
  if (input.listingPriority === "priority" || input.chatRecommendEnabled) {
    return "standard";
  }
  return "light";
}

export function planToDbRow(plan: JobPlan): {
  plan: JobPlan;
  listing_priority: ListingPriority;
  pickup_enabled: boolean;
  chat_recommend_enabled: boolean;
  chat_recommend_priority: number;
  line_recommend_notify: boolean;
  new_listing_enabled: boolean;
} {
  const features = getPlanFeatures(plan);
  return {
    plan,
    listing_priority: features.listingPriority,
    pickup_enabled: features.pickup,
    chat_recommend_enabled: features.aiRecommend,
    chat_recommend_priority: features.aiPriority,
    line_recommend_notify: features.lineRecommendNotify,
    new_listing_enabled: features.newListing,
  };
}

export function parsePlanFromBody(body: Record<string, unknown>): JobPlan | null {
  const raw = body.plan ?? body.listing_plan ?? body.listingPlan;
  if (raw == null || raw === "") return null;
  return isJobPlan(raw) ? raw : null;
}

/** Form field patch when a plan is selected (admin UI). */
export function planToFormPatch(plan: JobPlan): {
  plan: JobPlan;
  listingPriority: ListingPriority;
  pickupEnabled: boolean;
  chatRecommendEnabled: boolean;
  chatRecommendPriority: string;
  lineRecommendNotify: boolean;
  newListingEnabled: boolean;
} {
  const features = getPlanFeatures(plan);
  return {
    plan,
    listingPriority: features.listingPriority,
    pickupEnabled: features.pickup,
    chatRecommendEnabled: features.aiRecommend,
    chatRecommendPriority: String(features.aiPriority),
    lineRecommendNotify: features.lineRecommendNotify,
    newListingEnabled: features.newListing,
  };
}

export function getEnabledFeatureLabels(plan: JobPlan): string[] {
  if (plan === "uncontracted") {
    return ["店舗情報のみ掲載", "求人情報・応募機能は表示されません"];
  }

  const features = getPlanFeatures(plan);
  const labels: string[] = [];
  labels.push(
    `表示順位：${
      features.listingPriority === "top"
        ? "最優先"
        : features.listingPriority === "priority"
          ? "優先"
          : "通常"
    }`,
  );
  if (features.newListing) {
    labels.push(`新着掲載（公開日から${features.newListingDays}日間）`);
  }
  for (const item of JOB_PLAN_FEATURE_LABELS) {
    if (item.key === "newListing") continue;
    if (item.key === "analytics") {
      if (features.analytics) {
        labels.push("アクセス・応募分析レポート（詳細）");
      } else {
        labels.push("アクセス・応募分析レポート（基本集計）");
      }
      continue;
    }
    if (item.isBoolean && features[item.key] === true) {
      labels.push(item.label);
    }
  }
  return labels;
}
