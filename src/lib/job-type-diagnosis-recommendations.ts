import { JOB_TYPE_DIAGNOSIS_CONFIG } from "@/data/job-type-diagnosis/config";
import {
  mapDiagnosisJobTypeToFilter,
} from "@/lib/job-type-diagnosis-engine";
import type { DiagnosisResult, RecommendedDiagnosisShop } from "@/lib/job-type-diagnosis-types";
import { formatLocation } from "@/lib/job-storage";
import type { Job } from "@/types/job";

function buildShopReason(job: Job, result: DiagnosisResult, index: number): string {
  const templates = JOB_TYPE_DIAGNOSIS_CONFIG.shopReasonTemplates;
  const primary = mapDiagnosisJobTypeToFilter(result.topTwo[0].jobType);

  if (job.jobType === primary) {
    return templates[0];
  }
  if (job.benefits.includes("未経験者大歓迎")) {
    return templates[1];
  }
  if (job.isVerified) {
    return templates[2];
  }
  return templates[index % templates.length];
}

export function pickRecommendedDiagnosisShops(
  jobs: Job[],
  result: DiagnosisResult,
  limit = 3,
): RecommendedDiagnosisShop[] {
  const primary = mapDiagnosisJobTypeToFilter(result.topTwo[0].jobType);
  const secondary = mapDiagnosisJobTypeToFilter(result.topTwo[1].jobType);

  const ranked = jobs
    .map((job) => {
      let score = 0;
      if (job.jobType === primary) score += 12;
      else if (job.jobType === secondary) score += 7;
      if (job.isVerified) score += 4;
      if (job.pickupEnabled) score += 2;
      if (job.benefits.includes("未経験者大歓迎")) score += 3;
      if (job.imageUrl) score += 1;
      return { job, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.job.shopName.localeCompare(b.job.shopName));

  return ranked.slice(0, limit).map(({ job }, index) => ({
    jobId: job.id,
    shopName: job.shopName,
    imageUrl: job.imageUrl ?? null,
    areaLabel: formatLocation(job),
    salary: job.salary,
    jobType: job.jobType,
    reason: buildShopReason(job, result, index),
    detailUrl: `/jobs/${job.id}`,
  }));
}
