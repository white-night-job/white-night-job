import type { SupabaseClient } from "@supabase/supabase-js";
import {
  fetchJobMonthlyAnalytics,
  type MonthlyAnalyticsBucket,
} from "@/lib/job-analytics";
import { formatMonthLabel, getCurrentJstMonthKey } from "@/lib/job-applications";
import { parseCastVoices, parseStoreImages } from "@/lib/job-db";
import {
  calculateDistrictRank,
  fetchBoostStatsForJobs,
} from "@/lib/shop-boosts";
import {
  getPlanDefinition,
  getPlanFeatures,
  parseJobPlan,
  type JobPlan,
} from "@/lib/job-plan";

/** 同一セッションの連続表示をまとめる間隔。既存グラフの集計には影響させない。 */
const IMPRESSION_DEDUPE_MS = 60 * 1000;

const MAX_ADVICES = 3;
const STORE_IMAGE_TARGET = 3;
const INTRO_LENGTH_TARGET = 200;
const BENEFIT_TARGET = 5;
const STALE_UPDATE_DAYS = 14;
const PEER_MIN_SAMPLE = 3;
const PEER_REFERENCE_THRESHOLD = 5;
const PEER_FETCH_LIMIT = 40;

/** 率判定に使う最低母数 */
const MIN_IMPRESSIONS_FOR_DETAIL_RATE = 50;
const MIN_DETAIL_FOR_APPLY_RATE = 15;
const LOW_DETAIL_RATE = 3;
const GOOD_DETAIL_RATE = 5;
const LOW_APPLY_RATE = 5;
const HIGH_APPLY_RATE = 10;
const LOW_IMPRESSION_ABS = 30;

export type ImprovementMetrics = {
  impressions: number;
  detailClicks: number;
  lineClicks: number;
  phoneClicks: number;
  applyTotal: number;
};

export type ImprovementRates = {
  /** 店舗詳細クリック数 ÷ 表示回数 */
  detailClickRate: number;
  /** 応募クリック合計 ÷ 店舗詳細クリック数 */
  applyClickRate: number;
};

export type ImprovementDiff = {
  label: string;
  current: number;
  previous: number;
  diff: number;
  percent: number | null;
  unit: "count" | "percent";
};

export type AdvicePriorityLevel = "high" | "medium" | "low";

export type ImprovementAdvice = {
  id: string;
  /** 小さいほど優先度が高い（並び用） */
  priority: number;
  priorityLevel: AdvicePriorityLevel;
  issue: string;
  action: string;
  expectedEffect: string;
  reason: string;
};

export type PeerComparison = {
  sampleSize: number;
  /** 件数が少ないため参考値扱い */
  isReference: boolean;
  detailClickRate: number;
  applyClickRate: number;
  impressionsAvg: number;
};

export type ListingContext = {
  districtRank: number | null;
  districtTotal: number | null;
  todayBoostCount: number;
  canBoost: boolean;
  planLabel: string;
  updatedAt: string | null;
  daysSinceUpdate: number | null;
  title: string | null;
  district: string | null;
  jobType: string | null;
};

export type PremiumDetailedAnalysis = {
  strengths: string[];
  mainChallenge: string | null;
  priorityFixes: string[];
  peerGaps: string[];
  nextMetricsToWatch: string[];
  prioritizedAdvices: ImprovementAdvice[];
  topPriorityAction: string | null;
  missingFields: string[];
};

export type ShopImprovementReport = {
  jobId: string;
  plan: JobPlan;
  monthKey: string;
  monthLabel: string;
  previousMonthLabel: string;
  current: ImprovementMetrics;
  previous: ImprovementMetrics;
  rates: ImprovementRates;
  previousRates: ImprovementRates;
  comparison: ImprovementDiff[];
  /** 表示回数の月別推移（直近12か月）。旧「アクセス・応募分析」から統合。 */
  monthly: MonthlyAnalyticsBucket[];
  /** 現在の状況の短い要約 */
  situationSummary: string[];
  goodPoints: string[];
  /** 構造化提案（最大3件） */
  advices: ImprovementAdvice[];
  /** 互換用：提案の課題文 */
  issues: string[];
  /** 互換用：提案の具体アクション */
  actions: string[];
  peerComparison: PeerComparison | null;
  listingContext: ListingContext;
  /** プレミアムのみ。ライト・スタンダードでは null。 */
  premium: PremiumDetailedAnalysis | null;
  generatedAt: string;
};

/** ライトプラン向け。店舗詳細クリック数・率・改善判定は含めない。 */
export type LightAnalyticsMetrics = {
  impressions: number;
  lineClicks: number;
  phoneClicks: number;
  applyTotal: number;
};

export type ShopLightAnalyticsSummary = {
  jobId: string;
  plan: JobPlan;
  monthKey: string;
  monthLabel: string;
  /** 対象期間の表示用（例: 2026年7月） */
  periodLabel: string;
  current: LightAnalyticsMetrics;
  generatedAt: string;
};

type AnalyticsEventRow = {
  event_type: string;
  session_id: string | null;
  created_at: string;
  job_id?: string;
};

type JobContentRow = {
  id: string;
  title: string | null;
  district: string | null;
  job_type: string | null;
  plan: string | null;
  listing_priority: string | null;
  published: boolean | null;
  updated_at: string | null;
  image_url: string | null;
  store_images: unknown;
  introduction_text: string | null;
  description_text: string | null;
  salary: string | null;
  benefits: string[] | null;
  other_benefits: string[] | null;
  cast_voices: unknown;
  line_url: string | null;
  phone: string | null;
  x_url: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  youtube_url: string | null;
  website_url: string | null;
  business_hours: string | null;
  access: string | null;
  age_group: string | null;
};

export const IMPROVEMENT_JOB_COLUMNS = [
  "id",
  "title",
  "district",
  "job_type",
  "plan",
  "listing_priority",
  "published",
  "updated_at",
  "image_url",
  "store_images",
  "introduction_text",
  "description_text",
  "salary",
  "benefits",
  "other_benefits",
  "cast_voices",
  "line_url",
  "phone",
  "x_url",
  "instagram_url",
  "tiktok_url",
  "youtube_url",
  "website_url",
  "business_hours",
  "access",
  "age_group",
].join(", ");

type FunnelStage =
  | "healthy"
  | "low_impressions"
  | "low_detail_ctr"
  | "low_apply_ctr"
  | "insufficient_data";

function emptyMetrics(): ImprovementMetrics {
  return {
    impressions: 0,
    detailClicks: 0,
    lineClicks: 0,
    phoneClicks: 0,
    applyTotal: 0,
  };
}

function safeRate(numerator: number, denominator: number): number {
  if (!denominator || denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 1000) / 10;
}

function percentChangeOrNull(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

function jstMonthStartIso(year: number, month: number): string {
  const mm = String(month).padStart(2, "0");
  return new Date(`${year}-${mm}-01T00:00:00+09:00`).toISOString();
}

function shiftMonth(year: number, month: number, delta: number) {
  const index = year * 12 + (month - 1) + delta;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

export function getReportMonthRanges(referenceDate = new Date()) {
  const monthKey = getCurrentJstMonthKey(referenceDate);
  const [yearText, monthText] = monthKey.split("-");
  const year = Number(yearText);
  const month = Number(monthText);

  const previous = shiftMonth(year, month, -1);
  const next = shiftMonth(year, month, 1);
  const previousMonthKey = `${previous.year}-${String(previous.month).padStart(2, "0")}`;

  return {
    monthKey,
    previousMonthKey,
    monthLabel: formatMonthLabel(monthKey),
    previousMonthLabel: formatMonthLabel(previousMonthKey),
    previousStartIso: jstMonthStartIso(previous.year, previous.month),
    currentStartIso: jstMonthStartIso(year, month),
    currentEndIso: jstMonthStartIso(next.year, next.month),
  };
}

/**
 * 表示回数のみ、同一セッション・同一求人の1分以内の連続表示を1回に丸める。
 * クリック系はユーザー行動として1件ずつ数える。
 */
function countEventsWithImpressionDedupe(
  rows: AnalyticsEventRow[],
): ImprovementMetrics {
  const metrics = emptyMetrics();
  const lastImpressionAt = new Map<string, number>();

  const sorted = [...rows].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );

  sorted.forEach((row, index) => {
    if (row.event_type === "job_impression") {
      // session_id が無い行は同一ユーザー判定ができないため丸めない。
      const key = row.session_id?.trim() || `__anonymous__${index}`;
      const timestamp = new Date(row.created_at).getTime();
      const previousAt = lastImpressionAt.get(key);
      if (previousAt != null && timestamp - previousAt < IMPRESSION_DEDUPE_MS) {
        return;
      }
      lastImpressionAt.set(key, timestamp);
      metrics.impressions += 1;
      return;
    }

    if (row.event_type === "job_detail_click") metrics.detailClicks += 1;
    else if (row.event_type === "line_click") metrics.lineClicks += 1;
    else if (row.event_type === "phone_click") metrics.phoneClicks += 1;
  });

  metrics.applyTotal = metrics.lineClicks + metrics.phoneClicks;
  return metrics;
}

function toRates(metrics: ImprovementMetrics): ImprovementRates {
  return {
    detailClickRate: safeRate(metrics.detailClicks, metrics.impressions),
    applyClickRate: safeRate(metrics.applyTotal, metrics.detailClicks),
  };
}

function textLength(value: string | null | undefined): number {
  return value?.trim().length ?? 0;
}

function hasText(value: string | null | undefined): boolean {
  return textLength(value) > 0;
}

function daysSince(iso: string | null | undefined, now = new Date()): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.floor((now.getTime() - t) / (24 * 60 * 60 * 1000));
}

type ContentSnapshot = {
  hasMainImage: boolean;
  storeImageCount: number;
  introductionLength: number;
  hasDescription: boolean;
  hasSalary: boolean;
  benefitCount: number;
  castVoiceCount: number;
  hasLineUrl: boolean;
  hasPhone: boolean;
  snsCount: number;
  hasBusinessHours: boolean;
  hasAccess: boolean;
  hasAgeGroup: boolean;
};

function buildContentSnapshot(row: JobContentRow | null): ContentSnapshot {
  if (!row) {
    return {
      hasMainImage: false,
      storeImageCount: 0,
      introductionLength: 0,
      hasDescription: false,
      hasSalary: false,
      benefitCount: 0,
      castVoiceCount: 0,
      hasLineUrl: false,
      hasPhone: false,
      snsCount: 0,
      hasBusinessHours: false,
      hasAccess: false,
      hasAgeGroup: false,
    };
  }

  const castVoices = parseCastVoices(row.cast_voices ?? []);
  const castVoiceCount = Array.isArray(castVoices) ? castVoices.length : 0;
  const benefits = [...(row.benefits ?? []), ...(row.other_benefits ?? [])].filter(
    (item) => typeof item === "string" && item.trim().length > 0,
  );
  const snsCount = [
    row.x_url,
    row.instagram_url,
    row.tiktok_url,
    row.youtube_url,
    row.website_url,
  ].filter((value) => hasText(value)).length;

  return {
    hasMainImage: hasText(row.image_url),
    storeImageCount: parseStoreImages(row.store_images).length,
    introductionLength: textLength(row.introduction_text),
    hasDescription: hasText(row.description_text),
    hasSalary: hasText(row.salary),
    benefitCount: benefits.length,
    castVoiceCount,
    hasLineUrl: hasText(row.line_url),
    hasPhone: hasText(row.phone),
    snsCount,
    hasBusinessHours: hasText(row.business_hours),
    hasAccess: hasText(row.access),
    hasAgeGroup: hasText(row.age_group),
  };
}

function buildMissingFields(content: ContentSnapshot): string[] {
  const missing: string[] = [];
  if (!content.hasMainImage) missing.push("メイン画像");
  if (content.storeImageCount < STORE_IMAGE_TARGET) {
    missing.push(
      `店内画像（現在${content.storeImageCount}枚 / 目安${STORE_IMAGE_TARGET}枚以上）`,
    );
  }
  if (content.introductionLength < INTRO_LENGTH_TARGET) {
    missing.push(
      `紹介文（現在${content.introductionLength}文字 / 目安${INTRO_LENGTH_TARGET}文字以上）`,
    );
  }
  if (!content.hasDescription) missing.push("「どんなお店？」");
  if (!content.hasSalary) missing.push("時給");
  if (content.benefitCount < BENEFIT_TARGET) {
    missing.push(
      `待遇項目（現在${content.benefitCount}件 / 目安${BENEFIT_TARGET}件以上）`,
    );
  }
  if (content.castVoiceCount === 0) missing.push("在籍キャストの声");
  if (!content.hasLineUrl) missing.push("LINE応募URL");
  if (!content.hasPhone) missing.push("電話番号");
  if (content.snsCount === 0) missing.push("SNSリンク");
  if (!content.hasBusinessHours) missing.push("営業時間");
  if (!content.hasAccess) missing.push("アクセス");
  if (!content.hasAgeGroup) missing.push("キャスト年齢");
  return missing;
}

function detectFunnelStage(
  current: ImprovementMetrics,
  rates: ImprovementRates,
  peer: PeerComparison | null,
): FunnelStage {
  if (
    current.detailClicks >= MIN_DETAIL_FOR_APPLY_RATE &&
    rates.applyClickRate >= HIGH_APPLY_RATE
  ) {
    return "healthy";
  }

  const peerImpressionFloor =
    peer && peer.impressionsAvg > 0
      ? Math.max(LOW_IMPRESSION_ABS, Math.round(peer.impressionsAvg * 0.5))
      : LOW_IMPRESSION_ABS;

  if (current.impressions < peerImpressionFloor) {
    if (current.impressions === 0 && current.detailClicks === 0) {
      return "insufficient_data";
    }
    return "low_impressions";
  }

  if (
    current.impressions >= MIN_IMPRESSIONS_FOR_DETAIL_RATE &&
    rates.detailClickRate < LOW_DETAIL_RATE
  ) {
    return "low_detail_ctr";
  }

  if (
    peer &&
    current.impressions >= MIN_IMPRESSIONS_FOR_DETAIL_RATE &&
    rates.detailClickRate + 3 < peer.detailClickRate
  ) {
    return "low_detail_ctr";
  }

  if (
    current.detailClicks >= MIN_DETAIL_FOR_APPLY_RATE &&
    rates.applyClickRate < LOW_APPLY_RATE
  ) {
    return "low_apply_ctr";
  }

  if (
    peer &&
    current.detailClicks >= MIN_DETAIL_FOR_APPLY_RATE &&
    rates.applyClickRate + 2 < peer.applyClickRate
  ) {
    return "low_apply_ctr";
  }

  if (current.impressions < MIN_IMPRESSIONS_FOR_DETAIL_RATE) {
    return "insufficient_data";
  }

  return "healthy";
}

function canSuggestBoost(
  listing: ListingContext,
  funnel: FunnelStage,
  current: ImprovementMetrics,
): boolean {
  if (!listing.canBoost) return false;
  if (listing.todayBoostCount > 0) return false;
  if (listing.districtRank != null && listing.districtRank <= 3) return false;

  // 表示は十分で応募・詳細が課題のときは上位表示を勧めない
  if (funnel === "low_apply_ctr" || funnel === "low_detail_ctr") return false;
  if (funnel === "healthy") return false;

  // 表示回数が十分高いのに応募が課題、というケースの保険
  if (
    current.impressions >= MIN_IMPRESSIONS_FOR_DETAIL_RATE &&
    current.detailClicks >= MIN_DETAIL_FOR_APPLY_RATE
  ) {
    return false;
  }

  return funnel === "low_impressions" || funnel === "insufficient_data";
}

function buildAdvices(input: {
  current: ImprovementMetrics;
  previous: ImprovementMetrics;
  rates: ImprovementRates;
  content: ContentSnapshot;
  listing: ListingContext;
  peer: PeerComparison | null;
  funnel: FunnelStage;
}): ImprovementAdvice[] {
  const { current, previous, rates, content, listing, peer, funnel } = input;
  const candidates: ImprovementAdvice[] = [];
  const usedCategories = new Set<string>();

  const push = (category: string, advice: ImprovementAdvice) => {
    if (usedCategories.has(category)) return;
    usedCategories.add(category);
    candidates.push(advice);
  };

  const peerLabel = peer
    ? peer.isReference
      ? `同業参考値${peer.detailClickRate}%`
      : `同業平均${peer.detailClickRate}%`
    : null;

  // 応募導線の致命欠落はファネルに関係なく最優先
  if (!content.hasLineUrl) {
    push("line_url", {
      id: "line-url-missing",
      priority: 1,
      priorityLevel: "high",
      issue: "LINE応募URLが未登録のため、LINE応募ボタンが機能していません。",
      action:
        "求人編集の応募導線からLINE公式アカウントの友だち追加URLを登録し、保存後にプレビューでボタン遷移を確認してください。",
      expectedEffect: "応募導線の復旧・LINE応募クリックの獲得",
      reason: "LINE応募URLが空のため、応募導線が成立していないため",
    });
  }

  if (funnel === "healthy") {
    push("maintain", {
      id: "maintain-success",
      priority: 2,
      priorityLevel: "low",
      issue: `応募クリック率は${rates.applyClickRate}%で、現状の導線と求人内容が機能しています。`,
      action:
        "大きな変更はせず、時給・待遇・紹介文の事実関係だけを月1回点検し、数値の落ち込みがないか確認してください。",
      expectedEffect: "現状の応募率の維持",
      reason: `詳細クリック${current.detailClicks}件に対する応募クリック率が${HIGH_APPLY_RATE}%以上のため`,
    });
  }

  if (funnel === "low_impressions" || funnel === "insufficient_data") {
    if (
      listing.districtRank != null &&
      listing.districtRank > 3 &&
      canSuggestBoost(listing, funnel, current)
    ) {
      push("boost", {
        id: "boost-for-impressions",
        priority: 2,
        priorityLevel: "high",
        issue: `表示回数は${current.impressions}回で、同一エリア内の表示順位は${listing.districtRank}位 / ${listing.districtTotal ?? "—"}件中です。`,
        action: `上位表示ボタンを1日あたり最大5回まで利用し、同一エリア内での露出を上げてください。あわせて求人情報の最終更新（現在${listing.daysSinceUpdate != null ? `${listing.daysSinceUpdate}日前` : "不明"}）から内容の見直しも行ってください。`,
        expectedEffect: "表示回数の向上・検索一覧での露出増加",
        reason: "表示回数が少なく、表示順位も上位3位以外のため",
      });
    } else if (
      listing.districtRank != null &&
      listing.districtRank <= 3
    ) {
      push("rank-ok-content", {
        id: "rank-ok-but-low-impressions",
        priority: 2,
        priorityLevel: "medium",
        issue: `表示順位は${listing.districtRank}位で露出条件は良好ですが、表示回数は${current.impressions}回にとどまっています。`,
        action:
          "求人タイトル・業種・地区の設定が実際の募集条件と一致しているか確認し、最終更新日を更新して鮮度を上げてください。上位表示の追加利用は不要です。",
        expectedEffect: "検索条件との一致による表示機会の増加",
        reason: "表示順位は上位だが表示回数が少ないため（順位以外の要因を優先）",
      });
    } else if (
      listing.daysSinceUpdate != null &&
      listing.daysSinceUpdate >= STALE_UPDATE_DAYS
    ) {
      push("stale-update", {
        id: "stale-update",
        priority: 3,
        priorityLevel: "high",
        issue: `求人の最終更新から${listing.daysSinceUpdate}日経過しています。`,
        action:
          "時給・待遇・営業時間のいずれかを最新内容に直し、求人を再保存して更新日を更新してください。",
        expectedEffect: "掲載鮮度の向上・表示機会の維持",
        reason: `最終更新から${STALE_UPDATE_DAYS}日以上経過しているため`,
      });
    }
  }

  if (funnel === "low_detail_ctr") {
    const gapText =
      peer && rates.detailClickRate < peer.detailClickRate
        ? `（店舗${rates.detailClickRate}% / ${peer.isReference ? "同業参考値" : "同業平均"}${peer.detailClickRate}%）`
        : `（現在${rates.detailClickRate}%）`;

    if (!content.hasMainImage) {
      push("main_image", {
        id: "main-image-for-ctr",
        priority: 2,
        priorityLevel: "high",
        issue: `詳細閲覧率は${rates.detailClickRate}%と低めです${gapText}。メイン画像が未登録です。`,
        action:
          "明るく店内が分かる写真をメイン（一覧1枚目）に設定してください。顔出し不要でも、カウンターや内装が分かる写真を優先します。",
        expectedEffect: "詳細閲覧率の向上",
        reason: peerLabel
          ? `詳細閲覧率が${peerLabel}を下回り、メイン画像も未登録のため`
          : "詳細閲覧率が低く、メイン画像が未登録のため",
      });
    } else if (content.storeImageCount < STORE_IMAGE_TARGET) {
      push("store_images", {
        id: "store-images-for-ctr",
        priority: 2,
        priorityLevel: "high",
        issue: `詳細閲覧率は${rates.detailClickRate}%です${gapText}。店内画像は${content.storeImageCount}枚です。`,
        action: `店内画像を最低${STORE_IMAGE_TARGET}枚以上にし、店内全景・カウンター席・スタッフの雰囲気が分かる写真を追加してください。一覧で目に留まる1枚目の印象も合わせて見直してください。`,
        expectedEffect: "詳細閲覧率の向上・情報不足の解消",
        reason: peer
          ? `詳細閲覧率が同業${peer.isReference ? "参考値" : "平均"}より低く、店内画像が${STORE_IMAGE_TARGET}枚未満のため`
          : `詳細閲覧率が低く、店内画像が${content.storeImageCount}枚のため`,
      });
    } else if (!content.hasSalary) {
      push("salary", {
        id: "salary-for-ctr",
        priority: 2,
        priorityLevel: "high",
        issue: `詳細閲覧率は${rates.detailClickRate}%です${gapText}。時給が未入力です。`,
        action:
          "時給の下限・上限（または日給換算）を入力し、一覧でも条件が分かるようにしてください。",
        expectedEffect: "詳細閲覧率の向上",
        reason: "詳細閲覧率が低く、一覧上の給与情報がないため",
      });
    } else if (content.introductionLength < INTRO_LENGTH_TARGET) {
      push("introduction", {
        id: "introduction-for-ctr",
        priority: 3,
        priorityLevel: "high",
        issue: `詳細閲覧率は${rates.detailClickRate}%です${gapText}。紹介文は${content.introductionLength}文字です。`,
        action: `求人タイトルと一覧用紹介文を見直し、未経験者向けの教育体制・客層・ノルマの有無を加えて${INTRO_LENGTH_TARGET}文字以上を目安に整えてください。`,
        expectedEffect: "詳細閲覧率の向上",
        reason: "詳細閲覧率が低く、一覧で伝わる紹介文が短いため",
      });
    } else {
      push("title_image_refresh", {
        id: "title-image-refresh",
        priority: 3,
        priorityLevel: "medium",
        issue: `詳細閲覧率は${rates.detailClickRate}%です${gapText}。`,
        action:
          "一覧1枚目の画像と求人タイトルを差し替え、時給・最寄り・未経験歓迎など一覧で比較される要素をタイトル先頭付近に入れてください。",
        expectedEffect: "詳細閲覧率の向上",
        reason: peer
          ? `詳細閲覧率が同業${peer.isReference ? "参考値" : "平均"}を下回っているため`
          : `詳細閲覧率が${LOW_DETAIL_RATE}%未満のため`,
      });
    }
  }

  if (funnel === "low_apply_ctr") {
    const applyPeerText =
      peer && rates.applyClickRate < peer.applyClickRate
        ? `（店舗${rates.applyClickRate}% / ${peer.isReference ? "同業参考値" : "同業平均"}${peer.applyClickRate}%）`
        : `（現在${rates.applyClickRate}%）`;

    if (listing.districtRank === 1) {
      // 順位の話はせず内容・導線に寄せる（boost は canSuggestBoost で除外済み）
    }

    if (content.benefitCount < BENEFIT_TARGET) {
      push("benefits", {
        id: "benefits-for-apply",
        priority: 3,
        priorityLevel: "high",
        issue: `詳細クリックは${current.detailClicks}件ある一方、応募クリック率は${rates.applyClickRate}%です${applyPeerText}。待遇項目は${content.benefitCount}件です。`,
        action: `待遇を${BENEFIT_TARGET}件以上選び、送迎・日払い・寮・服装自由・ノルマなしなど、当てはまる項目を追加してください。ページ上部で待遇が目に入る配置も確認してください。`,
        expectedEffect: "応募率の向上・不安解消",
        reason: "詳細は見られているが応募率が低く、待遇情報が不足しているため",
      });
    } else if (content.castVoiceCount === 0) {
      push("cast_voice", {
        id: "cast-voice-for-apply",
        priority: 3,
        priorityLevel: "high",
        issue: `応募クリック率は${rates.applyClickRate}%です${applyPeerText}。在籍キャストの声が未登録です。`,
        action:
          "在籍キャストの声を1件以上追加し、「未経験だった感想」「1日の流れ」「サポートの有無」など具体的な一文を入れてください。",
        expectedEffect: "応募率の向上・安心感の補強",
        reason: "詳細閲覧後の応募率が低く、キャストの声がないため",
      });
    } else if (!content.hasDescription) {
      push("description", {
        id: "description-for-apply",
        priority: 3,
        priorityLevel: "high",
        issue: `応募クリック率は${rates.applyClickRate}%です${applyPeerText}。「どんなお店？」が未入力です。`,
        action:
          "「どんなお店？」に客層・席数・服装・未経験者への教育体制を具体的に書き、面接前に知りたい不安を先回りして解消してください。",
        expectedEffect: "応募率の向上・情報不足の解消",
        reason: "詳細閲覧後の応募率が低く、お店説明が未入力のため",
      });
    } else if (
      content.hasLineUrl &&
      current.detailClicks >= MIN_DETAIL_FOR_APPLY_RATE &&
      current.lineClicks < Math.max(2, Math.ceil(current.detailClicks * 0.03))
    ) {
      push("line_cta", {
        id: "line-cta-copy",
        priority: 3,
        priorityLevel: "high",
        issue: `詳細クリック${current.detailClicks}件に対し、LINE応募クリックは${current.lineClicks}件です。`,
        action:
          "紹介文や応募欄に「面接前の相談OK」「○時間以内に返信」など安心材料を明記し、LINE応募を第一導線として案内してください。電話応募の無理な推奨は不要です。",
        expectedEffect: "LINE応募クリックの向上",
        reason: "詳細閲覧に対してLINE応募クリックが少ないため",
      });
    } else if (!content.hasAccess || !content.hasBusinessHours) {
      const missingBits = [
        !content.hasBusinessHours ? "営業時間" : null,
        !content.hasAccess ? "アクセス（最寄り駅からの行き方）" : null,
      ].filter(Boolean);
      push("access_hours", {
        id: "access-hours-for-apply",
        priority: 4,
        priorityLevel: "medium",
        issue: `応募クリック率は${rates.applyClickRate}%です。${missingBits.join("・")}が未入力です。`,
        action: `${missingBits.join("と")}を入力し、通いやすさと勤務時間帯を明確にしてください。`,
        expectedEffect: "応募率の向上・情報不足の解消",
        reason: `詳細閲覧後の応募率が低く、${missingBits.join("・")}が未入力のため`,
      });
    } else {
      push("apply_content_general", {
        id: "apply-content-refine",
        priority: 4,
        priorityLevel: "medium",
        issue: `詳細クリックは${current.detailClicks}件ある一方、応募クリック率は${rates.applyClickRate}%です${applyPeerText}。`,
        action:
          "仕事内容・待遇・担当者情報（返信の目安）を見直し、応募ボタン直上に「未経験歓迎」「ノルマなし」など不安を消す一文を追加してください。",
        expectedEffect: "応募率の向上",
        reason: peer
          ? `応募クリック率が同業${peer.isReference ? "参考値" : "平均"}を下回っているため`
          : `応募クリック率が${LOW_APPLY_RATE}%未満のため`,
      });
    }
  }

  // ファネル横断のコンテンツ不足（重複カテゴリは push で弾く）
  if (funnel !== "healthy") {
    if (!content.hasMainImage) {
      push("main_image", {
        id: "main-image-missing",
        priority: 5,
        priorityLevel: "high",
        issue: "メイン画像が未登録のため、一覧でお店の印象が伝わりません。",
        action:
          "店内が分かる明るい写真をメイン画像に設定してください（顔出し必須ではありません）。",
        expectedEffect: "詳細閲覧率の向上",
        reason: "メイン画像が未登録のため",
      });
    }

    if (!content.hasSalary) {
      push("salary", {
        id: "salary-missing",
        priority: 5,
        priorityLevel: "high",
        issue: "時給が未入力のため、条件比較の段階で離脱されやすい状態です。",
        action: "時給の下限・上限を入力し、一覧でも条件が分かるようにしてください。",
        expectedEffect: "詳細閲覧率・応募率の向上",
        reason: "給与情報が未入力のため",
      });
    }

    if (content.storeImageCount < STORE_IMAGE_TARGET) {
      push("store_images", {
        id: "store-images-few",
        priority: 6,
        priorityLevel: "medium",
        issue: `店内画像が${content.storeImageCount}枚です（目安${STORE_IMAGE_TARGET}枚以上）。`,
        action: `店内全景、カウンター席、スタッフの雰囲気が分かる画像を追加し、合計${STORE_IMAGE_TARGET}枚以上にしてください。`,
        expectedEffect: "詳細閲覧率の向上・雰囲気伝達",
        reason: `店内画像が${STORE_IMAGE_TARGET}枚未満のため`,
      });
    }

    if (content.introductionLength < INTRO_LENGTH_TARGET) {
      push("introduction", {
        id: "introduction-short",
        priority: 6,
        priorityLevel: "medium",
        issue: `紹介文が${content.introductionLength}文字です（目安${INTRO_LENGTH_TARGET}文字以上）。`,
        action: `未経験者向けの教育体制、客層、ノルマの有無を加え、${INTRO_LENGTH_TARGET}文字以上を目安に整えてください。`,
        expectedEffect: "詳細閲覧率・応募率の向上",
        reason: `紹介文が${INTRO_LENGTH_TARGET}文字未満のため`,
      });
    }

    if (
      listing.daysSinceUpdate != null &&
      listing.daysSinceUpdate >= STALE_UPDATE_DAYS &&
      funnel === "low_impressions"
    ) {
      push("stale-update", {
        id: "stale-update-secondary",
        priority: 7,
        priorityLevel: "medium",
        issue: `最終更新から${listing.daysSinceUpdate}日経過しています。`,
        action: "求人内容を見直し、再保存して更新日を更新してください。",
        expectedEffect: "掲載鮮度の向上",
        reason: `最終更新から${STALE_UPDATE_DAYS}日以上経過しているため`,
      });
    }
  }

  // 前月比で表示減＋ブースト可のときのみ（順位条件は canSuggestBoost）
  if (
    previous.impressions > 0 &&
    current.impressions < previous.impressions * 0.9 &&
    canSuggestBoost(listing, funnel, current)
  ) {
    push("boost", {
      id: "impressions-down-boost",
      priority: 4,
      priorityLevel: "medium",
      issue: `表示回数が前月の${previous.impressions}回から${current.impressions}回へ減っています。`,
      action:
        "求人情報を更新したうえで、上位表示ボタンを利用して同一エリア内の露出を補ってください。",
      expectedEffect: "表示回数の回復",
      reason: "表示回数が前月比で10%以上減少し、表示順位も上位3位以外のため",
    });
  }

  // 電話は LINE が機能している場合は問題扱いしない（提案しない）
  if (
    !content.hasPhone &&
    content.hasLineUrl &&
    current.lineClicks === 0 &&
    current.detailClicks >= MIN_DETAIL_FOR_APPLY_RATE
  ) {
    // LINE未クリックかつ電話未登録のみ低優先で案内（LINEが動いていれば出さない）
  }

  return candidates
    .sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id))
    .slice(0, MAX_ADVICES);
}

function buildSituationSummary(input: {
  current: ImprovementMetrics;
  rates: ImprovementRates;
  listing: ListingContext;
  peer: PeerComparison | null;
  funnel: FunnelStage;
  monthLabel: string;
}): string[] {
  const { current, rates, listing, peer, funnel, monthLabel } = input;
  const lines: string[] = [];

  lines.push(
    `${monthLabel}：表示${current.impressions}回 / 詳細クリック${current.detailClicks}回 / LINE${current.lineClicks}・電話${current.phoneClicks}（応募合計${current.applyTotal}）`,
  );
  lines.push(
    `詳細閲覧率${rates.detailClickRate}%、応募クリック率${rates.applyClickRate}%（プラン：${listing.planLabel}）`,
  );

  if (listing.districtRank != null && listing.districtTotal != null) {
    lines.push(
      `同一エリア内の表示順位：${listing.districtRank}位 / ${listing.districtTotal}件中`,
    );
  }

  if (listing.districtRank === 1) {
    if (funnel === "low_apply_ctr" || funnel === "low_detail_ctr") {
      lines.push(
        "表示順位は1位で、露出は十分確保できています。現在の課題は順位ではなく、求人詳細の内容または応募導線です。",
      );
    } else {
      lines.push("表示順位は1位で、露出は十分確保できています。");
    }
  }

  if (peer) {
    const tag = peer.isReference ? "参考値" : "平均";
    lines.push(
      `同エリア・同業種（${peer.sampleSize}件）の詳細閲覧率${tag}${peer.detailClickRate}%、応募率${tag}${peer.applyClickRate}%`,
    );
  }

  if (listing.daysSinceUpdate != null) {
    lines.push(`求人の最終更新：${listing.daysSinceUpdate}日前`);
  }

  return lines;
}

function buildGoodPoints(
  current: ImprovementMetrics,
  previous: ImprovementMetrics,
  rates: ImprovementRates,
  content: ContentSnapshot,
  previousMonthLabel: string,
  listing: ListingContext,
  peer: PeerComparison | null,
  funnel: FunnelStage,
): string[] {
  const points: string[] = [];

  if (listing.districtRank === 1 && listing.districtTotal != null) {
    points.push(
      `同一エリア内の表示順位が1位です（${listing.districtTotal}件中）`,
    );
  } else if (listing.districtRank != null && listing.districtRank <= 3) {
    points.push(
      `同一エリア内の表示順位が${listing.districtRank}位と上位です`,
    );
  }

  const detailPercent = percentChangeOrNull(
    current.detailClicks,
    previous.detailClicks,
  );
  if (detailPercent != null && detailPercent > 0) {
    points.push(
      `詳細ページの閲覧数は${previousMonthLabel}より${detailPercent}%増えています`,
    );
  }

  const impressionPercent = percentChangeOrNull(
    current.impressions,
    previous.impressions,
  );
  if (impressionPercent != null && impressionPercent > 0) {
    points.push(`表示回数は${previousMonthLabel}より${impressionPercent}%増えています`);
  }

  const applyPercent = percentChangeOrNull(current.applyTotal, previous.applyTotal);
  if (applyPercent != null && applyPercent > 0) {
    points.push(`応募クリックは${previousMonthLabel}より${applyPercent}%増えています`);
  }

  if (current.impressions >= MIN_IMPRESSIONS_FOR_DETAIL_RATE) {
    if (peer && rates.detailClickRate >= peer.detailClickRate) {
      points.push(
        `詳細閲覧率${rates.detailClickRate}%は同業${peer.isReference ? "参考値" : "平均"}${peer.detailClickRate}%以上です`,
      );
    } else if (rates.detailClickRate >= GOOD_DETAIL_RATE) {
      points.push(`詳細クリック率が${rates.detailClickRate}%と良好です`);
    }
  }

  if (current.detailClicks >= MIN_DETAIL_FOR_APPLY_RATE) {
    if (peer && rates.applyClickRate >= peer.applyClickRate) {
      points.push(
        `応募クリック率${rates.applyClickRate}%は同業${peer.isReference ? "参考値" : "平均"}${peer.applyClickRate}%以上です`,
      );
    } else if (rates.applyClickRate >= HIGH_APPLY_RATE) {
      points.push(`応募クリック率が${rates.applyClickRate}%と高水準です`);
    }
  }

  if (funnel === "healthy") {
    points.push("現状の求人内容と応募導線が数値上うまく機能しています");
  }

  if (content.hasMainImage && content.storeImageCount >= STORE_IMAGE_TARGET) {
    points.push(
      `画像はメイン＋店内${content.storeImageCount}枚で目安を満たしています`,
    );
  }

  if (content.hasLineUrl && current.lineClicks > 0) {
    points.push(`LINE応募導線が機能し、今月${current.lineClicks}クリックあります`);
  }

  if (points.length === 0) {
    if (current.impressions > 0) {
      points.push("求人は表示されており、計測データが蓄積されています");
    } else {
      points.push("掲載は継続できています。数値の蓄積とともに改善点を特定できます");
    }
  }

  return points.slice(0, 4);
}

function buildComparison(
  current: ImprovementMetrics,
  previous: ImprovementMetrics,
  rates: ImprovementRates,
  previousRates: ImprovementRates,
): ImprovementDiff[] {
  return [
    {
      label: "表示回数",
      current: current.impressions,
      previous: previous.impressions,
      diff: current.impressions - previous.impressions,
      percent: percentChangeOrNull(current.impressions, previous.impressions),
      unit: "count",
    },
    {
      label: "店舗詳細クリック",
      current: current.detailClicks,
      previous: previous.detailClicks,
      diff: current.detailClicks - previous.detailClicks,
      percent: percentChangeOrNull(current.detailClicks, previous.detailClicks),
      unit: "count",
    },
    {
      label: "応募クリック合計",
      current: current.applyTotal,
      previous: previous.applyTotal,
      diff: current.applyTotal - previous.applyTotal,
      percent: percentChangeOrNull(current.applyTotal, previous.applyTotal),
      unit: "count",
    },
    {
      label: "応募クリック率",
      current: rates.applyClickRate,
      previous: previousRates.applyClickRate,
      diff:
        Math.round((rates.applyClickRate - previousRates.applyClickRate) * 10) / 10,
      percent: null,
      unit: "percent",
    },
  ];
}

function buildPremiumAnalysis(input: {
  goodPoints: string[];
  advices: ImprovementAdvice[];
  allCandidatesForMissing: string[];
  funnel: FunnelStage;
  rates: ImprovementRates;
  current: ImprovementMetrics;
  listing: ListingContext;
  peer: PeerComparison | null;
}): PremiumDetailedAnalysis {
  const {
    goodPoints,
    advices,
    allCandidatesForMissing,
    funnel,
    rates,
    current,
    listing,
    peer,
  } = input;

  let mainChallenge: string | null = null;
  if (listing.districtRank === 1 && funnel === "low_apply_ctr") {
    mainChallenge =
      "表示順位は1位で露出は十分です。課題は求人詳細の内容または応募導線（詳細閲覧後の応募クリック）です。";
  } else if (listing.districtRank === 1 && funnel === "low_detail_ctr") {
    mainChallenge =
      "表示順位は1位で露出は十分です。課題は一覧からの詳細閲覧率（1枚目画像・タイトル・給与表示）です。";
  } else if (funnel === "low_impressions") {
    mainChallenge = `表示回数が${current.impressions}回と少なめです。順位・掲載鮮度・検索条件との一致を優先して確認してください。`;
  } else if (funnel === "low_detail_ctr") {
    mainChallenge = `詳細閲覧率${rates.detailClickRate}%が伸び悩んでいます。一覧上の印象改善が最大の課題です。`;
  } else if (funnel === "low_apply_ctr") {
    mainChallenge = `詳細は見られていますが応募クリック率${rates.applyClickRate}%が課題です。待遇・不安解消・応募導線を優先してください。`;
  } else if (funnel === "healthy") {
    mainChallenge = "大きな課題は見当たらず、現状維持が妥当です。";
  } else {
    mainChallenge =
      current.impressions === 0
        ? "まだ十分な計測データがありません。表示の蓄積を待って再評価します。"
        : null;
  }

  const peerGaps: string[] = [];
  if (peer) {
    const tag = peer.isReference ? "参考値" : "平均";
    const detailDiff =
      Math.round((rates.detailClickRate - peer.detailClickRate) * 10) / 10;
    const applyDiff =
      Math.round((rates.applyClickRate - peer.applyClickRate) * 10) / 10;
    peerGaps.push(
      `詳細閲覧率：店舗${rates.detailClickRate}%、同業${tag}${peer.detailClickRate}%（差${detailDiff > 0 ? "+" : ""}${detailDiff}pt / ${peer.sampleSize}件）`,
    );
    peerGaps.push(
      `応募クリック率：店舗${rates.applyClickRate}%、同業${tag}${peer.applyClickRate}%（差${applyDiff > 0 ? "+" : ""}${applyDiff}pt / ${peer.sampleSize}件）`,
    );
    peerGaps.push(
      `表示回数：店舗${current.impressions}回、同業${tag}${peer.impressionsAvg}回`,
    );
  }

  const nextMetricsToWatch: string[] = [];
  if (funnel === "low_impressions" || funnel === "insufficient_data") {
    nextMetricsToWatch.push("表示回数", "同一エリア内の表示順位");
  }
  if (funnel === "low_detail_ctr" || funnel === "insufficient_data") {
    nextMetricsToWatch.push("詳細閲覧率", "店舗詳細クリック数");
  }
  if (funnel === "low_apply_ctr" || funnel === "healthy") {
    nextMetricsToWatch.push("応募クリック率", "LINE応募クリック数");
  }
  if (nextMetricsToWatch.length === 0) {
    nextMetricsToWatch.push("詳細閲覧率", "応募クリック率", "表示回数");
  }

  // 表示順位1位のときは上位表示利用を提案文に絶対含めない（二重チェック）
  const safeAdvices = advices.filter((advice) => {
    if (listing.districtRank != null && listing.districtRank <= 3) {
      return !/上位表示/.test(advice.action) && !/上位表示/.test(advice.issue);
    }
    return true;
  });

  return {
    strengths: goodPoints.slice(0, 3),
    mainChallenge,
    priorityFixes: safeAdvices.map((a) => a.action),
    peerGaps,
    nextMetricsToWatch: [...new Set(nextMetricsToWatch)].slice(0, 4),
    prioritizedAdvices: safeAdvices,
    topPriorityAction: safeAdvices[0]?.action ?? null,
    missingFields: allCandidatesForMissing,
  };
}

async function fetchListingContext(
  supabase: SupabaseClient,
  jobId: string,
  jobRow: JobContentRow | null,
  plan: JobPlan,
): Promise<ListingContext> {
  const features = getPlanFeatures(plan);
  const planLabel = getPlanDefinition(plan).label;
  const updatedAt = jobRow?.updated_at ?? null;
  const base: ListingContext = {
    districtRank: null,
    districtTotal: null,
    todayBoostCount: 0,
    canBoost: features.boost,
    planLabel,
    updatedAt,
    daysSinceUpdate: daysSince(updatedAt),
    title: jobRow?.title ?? null,
    district: jobRow?.district ?? null,
    jobType: jobRow?.job_type ?? null,
  };

  if (!jobRow?.district) return base;

  try {
    const { data: districtRows, error } = await supabase
      .from("jobs")
      .select("id, created_at, updated_at, plan")
      .eq("published", true)
      .eq("district", jobRow.district);

    if (error) throw error;

    const districtJobs = (districtRows ?? []).map((row) => ({
      id: row.id as string,
      created_at: row.created_at as string,
      updated_at: (row.updated_at as string | null) ?? null,
      plan: (row.plan as string | null) ?? null,
    }));

    const boostMap = await fetchBoostStatsForJobs(
      supabase,
      districtJobs.map((row) => row.id),
    );
    const rankInfo = calculateDistrictRank(jobId, districtJobs, boostMap);

    return {
      ...base,
      districtRank: rankInfo.rank,
      districtTotal: rankInfo.total,
      todayBoostCount: boostMap[jobId]?.todayCount ?? 0,
    };
  } catch (error) {
    console.error("[shop-improvement-report] listing context failed", error);
    return base;
  }
}

async function fetchPeerComparison(
  supabase: SupabaseClient,
  jobId: string,
  district: string | null,
  jobType: string | null,
  currentStartIso: string,
  currentEndIso: string,
): Promise<PeerComparison | null> {
  if (!district || !jobType) return null;

  try {
    const { data: peerJobs, error: peerError } = await supabase
      .from("jobs")
      .select("id")
      .eq("published", true)
      .eq("district", district)
      .eq("job_type", jobType)
      .neq("id", jobId)
      .limit(PEER_FETCH_LIMIT);

    if (peerError) throw peerError;

    const peerIds = (peerJobs ?? []).map((row) => row.id as string);
    if (peerIds.length < PEER_MIN_SAMPLE) return null;

    const { data: eventRows, error: eventError } = await supabase
      .from("job_analytics_events")
      .select("job_id, event_type, session_id, created_at")
      .in("job_id", peerIds)
      .eq("is_internal", false)
      .gte("created_at", currentStartIso)
      .lt("created_at", currentEndIso);

    if (eventError) throw eventError;

    const byJob = new Map<string, AnalyticsEventRow[]>();
    for (const row of (eventRows ?? []) as AnalyticsEventRow[]) {
      const id = row.job_id;
      if (!id) continue;
      const list = byJob.get(id) ?? [];
      list.push(row);
      byJob.set(id, list);
    }

    const detailRates: number[] = [];
    const applyRates: number[] = [];
    const impressionsList: number[] = [];

    for (const id of peerIds) {
      const metrics = countEventsWithImpressionDedupe(byJob.get(id) ?? []);
      impressionsList.push(metrics.impressions);
      if (metrics.impressions >= 10) {
        detailRates.push(safeRate(metrics.detailClicks, metrics.impressions));
      }
      if (metrics.detailClicks >= 5) {
        applyRates.push(safeRate(metrics.applyTotal, metrics.detailClicks));
      }
    }

    if (detailRates.length < PEER_MIN_SAMPLE && applyRates.length < PEER_MIN_SAMPLE) {
      return null;
    }

    const avg = (values: number[]) =>
      values.length === 0
        ? 0
        : Math.round(
            (values.reduce((sum, value) => sum + value, 0) / values.length) * 10,
          ) / 10;

    const sampleSize = peerIds.length;

    return {
      sampleSize,
      isReference: sampleSize < PEER_REFERENCE_THRESHOLD,
      detailClickRate: avg(detailRates),
      applyClickRate: avg(applyRates),
      impressionsAvg: Math.round(avg(impressionsList)),
    };
  } catch (error) {
    console.error("[shop-improvement-report] peer comparison failed", error);
    return null;
  }
}

/**
 * 当月と前月のイベント・求人内容から応募改善レポートを組み立てる。
 * プラン判定は呼び出し側（APIルート）で行う。
 */
export async function buildShopImprovementReport(
  supabase: SupabaseClient,
  jobId: string,
  plan: JobPlan,
  referenceDate = new Date(),
): Promise<ShopImprovementReport> {
  const ranges = getReportMonthRanges(referenceDate);

  // monthly は旧「アクセス・応募分析」と同じ集計関数を使う（集計方法は変更しない）
  const [eventsResult, jobResult, monthly] = await Promise.all([
    supabase
      .from("job_analytics_events")
      .select("event_type, session_id, created_at")
      .eq("job_id", jobId)
      .eq("is_internal", false)
      .gte("created_at", ranges.previousStartIso)
      .lt("created_at", ranges.currentEndIso),
    supabase
      .from("jobs")
      .select(IMPROVEMENT_JOB_COLUMNS)
      .eq("id", jobId)
      .maybeSingle(),
    fetchJobMonthlyAnalytics(supabase, jobId),
  ]);

  if (eventsResult.error) throw eventsResult.error;
  if (jobResult.error) throw jobResult.error;

  const rows = (eventsResult.data ?? []) as AnalyticsEventRow[];
  const currentStart = new Date(ranges.currentStartIso).getTime();
  const currentRows: AnalyticsEventRow[] = [];
  const previousRows: AnalyticsEventRow[] = [];

  for (const row of rows) {
    if (new Date(row.created_at).getTime() >= currentStart) currentRows.push(row);
    else previousRows.push(row);
  }

  const current = countEventsWithImpressionDedupe(currentRows);
  const previous = countEventsWithImpressionDedupe(previousRows);
  const rates = toRates(current);
  const previousRates = toRates(previous);

  const jobRow = (jobResult.data as unknown as JobContentRow | null) ?? null;
  const content = buildContentSnapshot(jobRow);

  const [listingContext, peerComparison] = await Promise.all([
    fetchListingContext(supabase, jobId, jobRow, plan),
    fetchPeerComparison(
      supabase,
      jobId,
      jobRow?.district ?? null,
      jobRow?.job_type ?? null,
      ranges.currentStartIso,
      ranges.currentEndIso,
    ),
  ]);

  const funnel = detectFunnelStage(current, rates, peerComparison);
  let advices = buildAdvices({
    current,
    previous,
    rates,
    content,
    listing: listingContext,
    peer: peerComparison,
    funnel,
  });

  // 表示順位上位では上位表示提案を最終除去
  if (listingContext.districtRank != null && listingContext.districtRank <= 3) {
    advices = advices.filter(
      (advice) =>
        !/上位表示/.test(advice.action) && !/上位表示/.test(advice.issue),
    );
  }

  const goodPoints = buildGoodPoints(
    current,
    previous,
    rates,
    content,
    ranges.previousMonthLabel,
    listingContext,
    peerComparison,
    funnel,
  );

  const situationSummary = buildSituationSummary({
    current,
    rates,
    listing: listingContext,
    peer: peerComparison,
    funnel,
    monthLabel: ranges.monthLabel,
  });

  const isPremium = plan === "premium";

  return {
    jobId,
    plan,
    monthKey: ranges.monthKey,
    monthLabel: ranges.monthLabel,
    previousMonthLabel: ranges.previousMonthLabel,
    current,
    previous,
    rates,
    previousRates,
    comparison: buildComparison(current, previous, rates, previousRates),
    monthly,
    situationSummary,
    goodPoints,
    advices,
    issues: advices.map((advice) => advice.issue),
    actions: advices.map((advice) => advice.action),
    peerComparison,
    listingContext,
    premium: isPremium
      ? buildPremiumAnalysis({
          goodPoints,
          advices,
          allCandidatesForMissing: buildMissingFields(content),
          funnel,
          rates,
          current,
          listing: listingContext,
          peer: peerComparison,
        })
      : null,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * ライトプラン向けの簡易集計。当月の表示・応募クリックのみで、
 * 店舗詳細クリック数は返却にも判定にも使わない（改善レポートは含めない）。
 * 月別詳細や詳細クリック系データは含めない。
 */
export async function buildShopLightAnalyticsSummary(
  supabase: SupabaseClient,
  jobId: string,
  plan: JobPlan,
  referenceDate = new Date(),
): Promise<ShopLightAnalyticsSummary> {
  const ranges = getReportMonthRanges(referenceDate);

  const eventsResult = await supabase
    .from("job_analytics_events")
    .select("event_type, session_id, created_at")
    .eq("job_id", jobId)
    .eq("is_internal", false)
    .gte("created_at", ranges.currentStartIso)
    .lt("created_at", ranges.currentEndIso);

  if (eventsResult.error) throw eventsResult.error;

  const counts = countEventsWithImpressionDedupe(
    (eventsResult.data ?? []) as AnalyticsEventRow[],
  );

  return {
    jobId,
    plan,
    monthKey: ranges.monthKey,
    monthLabel: ranges.monthLabel,
    periodLabel: ranges.monthLabel,
    current: {
      impressions: counts.impressions,
      lineClicks: counts.lineClicks,
      phoneClicks: counts.phoneClicks,
      applyTotal: counts.applyTotal,
    },
    generatedAt: new Date().toISOString(),
  };
}
