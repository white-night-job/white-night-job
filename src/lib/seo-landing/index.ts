export { SEO_BRAND_NAME, getSeoArea, seoAreas } from "@/lib/seo-landing/areas";
export {
  getSeoJobType,
  normalizeSeoJobTypePathSlug,
  resolveSeoJobTypeByPathSlug,
  seoJobTypes,
} from "@/lib/seo-landing/job-types";
export { seoLandingPages } from "@/lib/seo-landing/landings";
export { seoCopyProfiles, getSeoCopyProfile } from "@/lib/seo-landing/profiles";
export {
  buildSeoLandingPage,
  getPublishedSeoLanding,
  getPublishedSeoLandingByDistrictJobType,
  getSeoLandingPath,
  listPublishedSeoLandings,
} from "@/lib/seo-landing/build";
export { assertSeoLandingParity, SEO_LANDING_PARITY } from "@/lib/seo-landing/parity";
export type {
  BuiltSeoLandingPage,
  SeoAreaDef,
  SeoAreaSlug,
  SeoCopyProfile,
  SeoCopyVars,
  SeoJobTypeDef,
  SeoJobTypeSlug,
  SeoLandingPageDef,
} from "@/lib/seo-landing/types";

/** Legacy path helpers kept for redirects / imports. */
export const GIRLSBAR_PATH_SLUG = "girlsbar" as const;
export const GIRLSBAR_LEGACY_PATH_SLUG = "girls-bar" as const;

export function normalizeGirlsBarPathSlug(slug: string): string {
  return slug === GIRLSBAR_LEGACY_PATH_SLUG ? GIRLSBAR_PATH_SLUG : slug;
}
