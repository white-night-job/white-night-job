import type { SupabaseClient } from "@supabase/supabase-js";
import {
  fetchJobMonthlyAnalytics,
  type MonthlyAnalyticsBucket,
} from "@/lib/job-analytics";
import { formatMonthLabel, getCurrentJstMonthKey } from "@/lib/job-applications";
import { parseCastVoices, parseStoreImages } from "@/lib/job-db";
import type { JobPlan } from "@/lib/job-plan";

/** 同一セッションの連続表示をまとめる間隔。既存グラフの集計には影響させない。 */
const IMPRESSION_DEDUPE_MS = 60 * 1000;

const MAX_ADVICES = 3;

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

export type ImprovementAdvice = {
  id: string;
  /** 小さいほど優先度が高い */
  priority: number;
  issue: string;
  action: string;
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
  goodPoints: string[];
  issues: string[];
  actions: string[];
  /** プレミアムのみ。ライト・スタンダードでは null。 */
  premium: {
    prioritizedAdvices: ImprovementAdvice[];
    topPriorityAction: string | null;
    missingFields: string[];
  } | null;
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
};

type JobContentRow = {
  id: string;
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

  // cast_voices が null / 非配列でも parseCastVoices は空配列を返す
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
  if (content.storeImageCount < 3) {
    missing.push(`店内画像（現在${content.storeImageCount}枚 / 目安3枚以上）`);
  }
  if (content.introductionLength < 120) {
    missing.push(`紹介文（現在${content.introductionLength}文字 / 目安120文字以上）`);
  }
  if (!content.hasDescription) missing.push("「どんなお店？」");
  if (!content.hasSalary) missing.push("時給");
  if (content.benefitCount < 5) {
    missing.push(`待遇項目（現在${content.benefitCount}件 / 目安5件以上）`);
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

function buildAdvices(
  current: ImprovementMetrics,
  previous: ImprovementMetrics,
  rates: ImprovementRates,
  content: ContentSnapshot,
): ImprovementAdvice[] {
  const advices: ImprovementAdvice[] = [];
  const push = (advice: ImprovementAdvice) => advices.push(advice);

  if (!content.hasLineUrl) {
    push({
      id: "line-url-missing",
      priority: 1,
      issue: "LINE応募URLが未入力のため、応募導線が機能していません。",
      action: "LINE応募URLを登録して、応募ボタンから直接つながるようにしましょう。",
    });
  }

  if (!content.hasMainImage) {
    push({
      id: "main-image-missing",
      priority: 2,
      issue: "メイン画像が未登録のため、一覧でお店の印象が伝わっていません。",
      action: "明るい店内写真をメイン画像に設定しましょう。",
    });
  }

  if (!content.hasSalary) {
    push({
      id: "salary-missing",
      priority: 2,
      issue: "時給が未入力のため、条件が伝わらず応募前に離脱されています。",
      action: "時給（下限・上限）を入力して条件を明確にしましょう。",
    });
  }

  if (current.impressions >= 100 && rates.detailClickRate < 3) {
    push({
      id: "low-detail-rate",
      priority: 3,
      issue: `表示回数は多いですが、詳細クリック率が${rates.detailClickRate}%と低めです。`,
      action: "メイン画像と求人一覧の紹介文を見直して、目に留まる内容にしましょう。",
    });
  }

  if (current.detailClicks >= 20 && rates.applyClickRate < 5) {
    push({
      id: "low-apply-rate",
      priority: 3,
      issue: `詳細ページは見られていますが、応募クリック率が${rates.applyClickRate}%と低めです。`,
      action: "時給・待遇・勤務条件をページ上部で分かりやすく表示しましょう。",
    });
  }

  if (
    previous.impressions > 0 &&
    current.impressions < previous.impressions * 0.9
  ) {
    push({
      id: "impressions-down",
      priority: 4,
      issue: "表示回数が前月より減っています。",
      action: "求人情報を更新し、上位表示ボタンの利用を検討してください。",
    });
  }

  if (content.storeImageCount < 3) {
    push({
      id: "store-images-few",
      priority: 5,
      issue: `店内画像が${content.storeImageCount}枚と少なく、店内の雰囲気が伝わりにくい状態です。`,
      action: "店内の雰囲気が伝わる画像を3枚以上追加しましょう。",
    });
  }

  if (content.introductionLength < 120) {
    push({
      id: "introduction-short",
      priority: 5,
      issue: `紹介文が${content.introductionLength}文字と短めです。`,
      action: "未経験者へのサポート内容やお店の雰囲気を紹介文に追加しましょう。",
    });
  }

  if (!content.hasDescription) {
    push({
      id: "description-missing",
      priority: 5,
      issue: "「どんなお店？」が未入力で、お店のイメージが伝わっていません。",
      action: "「どんなお店？」にお客様層や働き方の特徴を入力しましょう。",
    });
  }

  if (content.benefitCount < 5) {
    push({
      id: "benefits-few",
      priority: 6,
      issue: `待遇項目が${content.benefitCount}件と少なめです。`,
      action: "送迎・日払い・体験入店など、当てはまる待遇を追加で選択しましょう。",
    });
  }

  if (
    content.hasPhone &&
    current.lineClicks >= 5 &&
    current.phoneClicks < current.lineClicks * 0.2
  ) {
    push({
      id: "phone-low",
      priority: 6,
      issue: "LINE応募に比べて電話応募が少なくなっています。",
      action: "電話受付時間が正しく入力されているか確認しましょう。",
    });
  }

  if (!content.hasPhone) {
    push({
      id: "phone-missing",
      priority: 6,
      issue: "電話番号が未入力のため、電話で応募したい方を取りこぼしています。",
      action: "電話番号と受付時間を登録しましょう。",
    });
  }

  if (content.castVoiceCount === 0) {
    push({
      id: "cast-voice-missing",
      priority: 7,
      issue: "在籍キャストの声が未登録です。",
      action: "在籍キャストの声を1件以上追加して、働くイメージを伝えましょう。",
    });
  }

  if (!content.hasBusinessHours) {
    push({
      id: "business-hours-missing",
      priority: 7,
      issue: "営業時間が未入力です。",
      action: "営業時間を入力して、勤務イメージを持ってもらいましょう。",
    });
  }

  if (!content.hasAccess) {
    push({
      id: "access-missing",
      priority: 8,
      issue: "アクセスが未入力です。",
      action: "最寄り駅からの行き方を入力して、通いやすさを伝えましょう。",
    });
  }

  if (!content.hasAgeGroup) {
    push({
      id: "age-group-missing",
      priority: 8,
      issue: "キャスト年齢が未入力です。",
      action: "在籍キャストの年齢層を入力して、応募のハードルを下げましょう。",
    });
  }

  if (content.snsCount === 0) {
    push({
      id: "sns-missing",
      priority: 9,
      issue: "SNSリンクが未登録です。",
      action: "X・InstagramなどのSNSを登録して、お店の日常を伝えましょう。",
    });
  }

  return advices.sort((a, b) => a.priority - b.priority);
}

function buildGoodPoints(
  current: ImprovementMetrics,
  previous: ImprovementMetrics,
  rates: ImprovementRates,
  content: ContentSnapshot,
  previousMonthLabel: string,
): string[] {
  const points: string[] = [];

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

  if (current.impressions >= 50 && rates.detailClickRate >= 5) {
    points.push(`詳細クリック率が${rates.detailClickRate}%と良好です`);
  }

  if (current.detailClicks >= 10 && rates.applyClickRate >= 10) {
    points.push(`応募クリック率が${rates.applyClickRate}%と高水準です`);
  }

  if (points.length === 0) {
    if (content.hasMainImage && content.storeImageCount >= 3) {
      points.push("画像が充実しており、お店の雰囲気が伝わる状態です");
    } else if (current.impressions > 0) {
      points.push("求人はしっかり表示されています。あとは中身の充実が伸びしろです");
    } else {
      points.push("掲載は継続できています。まずは求人情報の入力を充実させましょう");
    }
  }

  return points.slice(0, 3);
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

  const content = buildContentSnapshot(
    (jobResult.data as unknown as JobContentRow | null) ?? null,
  );
  const advices = buildAdvices(current, previous, rates, content);
  const visibleAdvices = advices.slice(0, MAX_ADVICES);
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
    goodPoints: buildGoodPoints(
      current,
      previous,
      rates,
      content,
      ranges.previousMonthLabel,
    ),
    issues: visibleAdvices.map((advice) => advice.issue),
    actions: visibleAdvices.map((advice) => advice.action),
    premium: isPremium
      ? {
          prioritizedAdvices: advices,
          topPriorityAction: advices[0]?.action ?? null,
          missingFields: buildMissingFields(content),
        }
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
