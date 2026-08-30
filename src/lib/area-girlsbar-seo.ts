/**
 * @deprecated Import from `@/lib/seo-landing` instead.
 * Compatibility shims for girlsbar SEO helpers.
 */
import {
  GIRLSBAR_LEGACY_PATH_SLUG,
  GIRLSBAR_PATH_SLUG,
  getPublishedSeoLandingByDistrictJobType,
  normalizeGirlsBarPathSlug,
} from "@/lib/seo-landing";
import { getJobComparisonBenefitTags } from "@/lib/seo-comparison-tags";
import type { Job } from "@/types/job";

export {
  GIRLSBAR_LEGACY_PATH_SLUG,
  GIRLSBAR_PATH_SLUG,
  normalizeGirlsBarPathSlug,
};

export function isSusukinoGirlsBarDetailJob(job: {
  district: string;
  jobType: string;
}): boolean {
  return job.district === "すすきの" && job.jobType === "ガールズバー";
}

/** Document title base (site name appended by finalizeDocumentTitle). */
export function buildSusukinoGirlsBarDetailTitleBase(job: {
  shopName: string;
}): string {
  return `${job.shopName}の求人｜すすきののガールズバー・ガルバ`;
}

/**
 * Meta description from DB fields only — no invented pay / benefits.
 */
export function buildSusukinoGirlsBarMetaDescription(job: Job): string {
  const chunks: string[] = [
    `${job.shopName}のすすきのガールズバー求人。`,
  ];

  if (job.salary?.trim()) {
    chunks.push(`給与は${job.salary.trim()}。`);
  }
  if (job.workHours?.trim()) {
    chunks.push(`勤務条件は${job.workHours.trim()}。`);
  }

  const tags = getJobComparisonBenefitTags(job);
  if (tags.length > 0) {
    chunks.push(`待遇：${tags.map((t) => t.label).join("、")}。`);
  }

  chunks.push(
    "White Night Jobは札幌・すすきのの審査済みガールズバー求人を掲載しています。",
  );

  return chunks.join("").slice(0, 320);
}

export function getGirlsBarDetailSeo(job: {
  district: string;
  jobType: string;
  shopName: string;
}): {
  titleBase: string;
  descriptionLead: string;
} | null {
  if (job.jobType !== "ガールズバー") return null;
  const landing = getPublishedSeoLandingByDistrictJobType(
    job.district,
    job.jobType,
  );
  if (!landing) return null;

  // Susukino uses dedicated title/description builders in buildJobDetailMetadata.
  if (isSusukinoGirlsBarDetailJob(job)) {
    return {
      titleBase: buildSusukinoGirlsBarDetailTitleBase(job),
      descriptionLead: `${job.shopName}のすすきのガールズバー求人。`,
    };
  }

  return {
    titleBase: `${job.shopName}の求人｜${landing.detailTitleSegment}`,
    descriptionLead: `${job.shopName}（${landing.detailDescriptionSegment}）の求人情報。時給・勤務時間・待遇・アクセス・体験入店の有無を掲載。札幌の審査済み店舗から安心して応募できます。`,
  };
}

export function isAreaGirlsBarJob(job: {
  jobType: string;
}): boolean {
  return job.jobType === "ガールズバー";
}
