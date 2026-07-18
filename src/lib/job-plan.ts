import type { ListingPriority } from "@/lib/listing-priority";

export const JOB_PLANS = ["light", "standard", "premium"] as const;
export type JobPlan = (typeof JOB_PLANS)[number];

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
};

export type JobPlanDefinition = {
  key: JobPlan;
  label: string;
  priceLabel: string;
  features: JobPlanFeatures;
};

export const JOB_PLAN_DEFINITIONS: Record<JobPlan, JobPlanDefinition> = {
  light: {
    key: "light",
    label: "ライト",
    priceLabel: "税込12,000円/月",
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
    },
  },
  standard: {
    key: "standard",
    label: "スタンダード",
    priceLabel: "税込25,000円/月",
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
    },
  },
  premium: {
    key: "premium",
    label: "プレミアム",
    priceLabel: "税込38,000円/月",
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
  { key: "analytics", label: "応募分析", isBoolean: true },
];

export function isJobPlan(value: unknown): value is JobPlan {
  return typeof value === "string" && (JOB_PLANS as readonly string[]).includes(value);
}

export function parseJobPlan(value: unknown): JobPlan {
  return isJobPlan(value) ? value : "light";
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
    if (item.isBoolean && features[item.key] === true) {
      labels.push(item.label);
    }
  }
  return labels;
}
