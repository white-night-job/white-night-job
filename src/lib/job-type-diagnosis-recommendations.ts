import { JOB_TYPE_DIAGNOSIS_CONFIG } from "@/data/job-type-diagnosis/config";
import {
  mapDiagnosisJobTypeToFilter,
} from "@/lib/job-type-diagnosis-engine";
import type {
  DiagnosisAnswers,
  DiagnosisPreferredArea,
  DiagnosisResult,
  RecommendedDiagnosisShop,
} from "@/lib/job-type-diagnosis-types";
import {
  DIAGNOSIS_PREFERRED_AREA_OPTIONS,
} from "@/lib/job-type-diagnosis-types";
import { parseJobPlan } from "@/lib/job-plan";
import { resolveJobListingStatus } from "@/lib/job-listing-status";
import type { District, Job } from "@/types/job";
import { formatDistrictLabel } from "@/data/districts";

const PRIMARY_MATCH_REASON =
  "希望エリア・診断結果の第1位職種にマッチしています";

export function formatDiagnosisDistrictLabel(district: string): string {
  return formatDistrictLabel(district);
}

export function formatPreferredAreasLabel(
  areas: readonly string[] | null | undefined,
): string {
  if (!areas || areas.length === 0) return "";
  return areas.map(formatDiagnosisDistrictLabel).join("・");
}

export function parsePreferredAreasFromAnswers(
  answers: unknown,
): DiagnosisPreferredArea[] {
  if (!answers || typeof answers !== "object") return [];
  const raw = (answers as { preferredAreas?: unknown }).preferredAreas;
  if (!Array.isArray(raw)) return [];
  const allowed = new Set(
    DIAGNOSIS_PREFERRED_AREA_OPTIONS.map((option) => option.value),
  );
  return raw.filter(
    (value): value is DiagnosisPreferredArea =>
      typeof value === "string" && allowed.has(value as DiagnosisPreferredArea),
  );
}

function isPublishedPremiumJob(job: Job): boolean {
  const status = resolveJobListingStatus(job);
  if (status !== "published") return false;
  return parseJobPlan(job.plan) === "premium";
}

function listingPriorityScore(job: Job): number {
  if (job.listingPriority === "top") return 6;
  if (job.listingPriority === "priority") return 3;
  return 0;
}

function buildShopReason(job: Job, result: DiagnosisResult): string {
  const templates = JOB_TYPE_DIAGNOSIS_CONFIG.shopReasonTemplates;
  const primary = mapDiagnosisJobTypeToFilter(result.topTwo[0].jobType);

  if (job.jobType === primary) {
    return PRIMARY_MATCH_REASON;
  }
  if (job.benefits.includes("未経験者大歓迎")) {
    return templates[1];
  }
  if (job.isVerified) {
    return templates[2];
  }
  return templates[3] ?? PRIMARY_MATCH_REASON;
}

/**
 * おすすめ店舗選定:
 * - 公開中
 * - 診断第1位職種に一致
 * - 希望エリア（複数は OR）に一致
 * - プレミアムプラン
 * 上記をすべて満たす求人のみ。不足分の穴埋め・他プラン代替はしない。
 * 件数超過時は既存のおすすめスコア＋上位表示優先度で並び替え（ランダムなし）。
 */
export function pickRecommendedDiagnosisShops(
  jobs: Job[],
  result: DiagnosisResult,
  answers: DiagnosisAnswers,
  limit = 10,
): RecommendedDiagnosisShop[] {
  const preferredAreas = parsePreferredAreasFromAnswers(answers);
  if (preferredAreas.length === 0) return [];

  const primary = mapDiagnosisJobTypeToFilter(result.topTwo[0].jobType);
  const areaSet = new Set<District>(preferredAreas);

  const ranked = jobs
    .filter(isPublishedPremiumJob)
    .filter((job) => job.jobType === primary)
    .filter((job) => areaSet.has(job.district))
    .map((job) => {
      let score = 20; // 職種・エリア一致は必須条件のためベース点
      if (job.isVerified) score += 4;
      if (job.pickupEnabled) score += 2;
      if (job.benefits.includes("未経験者大歓迎")) score += 3;
      if (job.imageUrl) score += 1;
      score += listingPriorityScore(job);
      return { job, score };
    })
    .sort(
      (a, b) =>
        b.score - a.score || a.job.shopName.localeCompare(b.job.shopName, "ja"),
    );

  return ranked.slice(0, limit).map(({ job }) => ({
    jobId: job.id,
    shopName: job.shopName,
    imageUrl: job.imageUrl ?? null,
    areaLabel: formatDiagnosisDistrictLabel(job.district),
    salary: job.salary,
    jobType: job.jobType,
    reason: buildShopReason(job, result),
    detailUrl: `/jobs/${job.id}`,
  }));
}
