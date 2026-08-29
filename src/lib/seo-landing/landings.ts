import type { SeoLandingPageDef } from "@/lib/seo-landing/types";

/**
 * Published area × jobType landings managed by the shared SEO template.
 *
 * To add 北24条 × ガールズバー later, append ONE object:
 *   { area: "kita24jo", jobType: "girlsbar", published: true, profile: "girlsbar-name-first", showInGlobalNav: true, globalNavLabel: "{areaName}の{jobTypeName}求人", footerNavLabel: "{areaName}の{jobTypeAlias}求人" }
 *
 * Do NOT set published:true until you intentionally launch the page.
 */
export const seoLandingPages: SeoLandingPageDef[] = [
  {
    area: "susukino",
    jobType: "girlsbar",
    published: true,
    profile: "girlsbar-alias-first",
    showInGlobalNav: true,
    globalNavLabel: "{areaName}の{jobTypeAlias}求人",
    footerNavLabel: "{areaName}の{jobTypeAlias}求人",
  },
  {
    area: "kotoni",
    jobType: "girlsbar",
    published: true,
    profile: "girlsbar-name-first",
    showInGlobalNav: true,
    globalNavLabel: "{areaName}の{jobTypeName}求人",
    footerNavLabel: "{areaName}の{jobTypeAlias}求人",
  },
  // Examples (unpublished — keep commented or published:false):
  // { area: "kita24jo", jobType: "girlsbar", published: false, profile: "girlsbar-name-first" },
  // { area: "teine", jobType: "girlsbar", published: false, profile: "girlsbar-name-first" },
  // { area: "susukino", jobType: "concafe", published: false, profile: "…" },
];
