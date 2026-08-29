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

export {
  GIRLSBAR_LEGACY_PATH_SLUG,
  GIRLSBAR_PATH_SLUG,
  normalizeGirlsBarPathSlug,
};

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
