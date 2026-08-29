import type { District, JobType } from "@/types/job";

/** Area slug used in /sapporo/{area}/… */
export type SeoAreaSlug = "susukino" | "kotoni" | "kita24jo" | "teine";

/** Job-type slug used in /sapporo/{area}/{jobType} */
export type SeoJobTypeSlug =
  | "girlsbar"
  | "new-club"
  | "lounge"
  | "snack"
  | "concept-cafe"
  /** Future alias example — maps to concept-cafe path when published with pathSlug override */
  | "concafe";

export type SeoCopyVars = {
  areaName: string;
  jobTypeName: string;
  jobTypeAlias: string;
  /** Combined label used in H1/title when profile defines it */
  jobTypeDisplay: string;
  brandName: string;
};

export type SeoAreaDef = {
  slug: SeoAreaSlug;
  /** Display name: すすきの / 琴似 / 北24条 … */
  name: string;
  /** DB district value */
  district: District;
  basePath: string;
  /** Short flavor used by default templates (optional) */
  flavor?: string;
};

export type SeoJobTypeDef = {
  slug: SeoJobTypeSlug;
  /** Formal name (usually matches DB job_type for display) */
  name: string;
  /** Search-friendly alias (e.g. ガルバ). Falls back to name when unused. */
  alias: string;
  /** DB jobs.job_type filter value */
  dbJobType: JobType;
  /** Path segment under /sapporo/{area}/ — defaults to slug */
  pathSlug?: string;
  /** Legacy path segments that 301 to pathSlug */
  legacyPathSlugs?: string[];
  /** Key for shared column / body helpers */
  contentSlug:
    | "girls-bar"
    | "new-club"
    | "lounge"
    | "snack"
    | "concept-cafe";
};

export type SeoContentSectionTemplate = {
  heading: string;
  paragraphs: string[];
};

export type SeoFaqTemplate = {
  question: string;
  answer: string;
};

/** Named copy profile — templates may include {areaName} {jobTypeName} {jobTypeAlias} {jobTypeDisplay} {brandName} */
export type SeoCopyProfile = {
  id: string;
  title: string;
  description: string;
  h1: string;
  displayName: string;
  breadcrumbLabel: string;
  intro: string[];
  guide: string[];
  contentSections: SeoContentSectionTemplate[];
  faqHeading: string;
  faqs: SeoFaqTemplate[];
  detailTitleSegment: string;
  detailDescriptionSegment: string;
  listLinkLabel: string;
  /** How to build jobTypeDisplay before interpolation */
  jobTypeDisplayPattern: string;
};

export type SeoLandingPageDef = {
  area: SeoAreaSlug;
  jobType: SeoJobTypeSlug;
  /** When false/omitted from published list, page is not routed/sitemapped via this registry */
  published: boolean;
  /** Copy profile id */
  profile: string;
  /** Optional per-landing template overrides (still support {vars}) */
  overrides?: Partial<SeoCopyProfile>;
  /** Show in global area SEO link strips */
  showInGlobalNav?: boolean;
  /** Anchor label template for global nav (uses vars) */
  globalNavLabel?: string;
  /** Footer link label template */
  footerNavLabel?: string;
};

export type BuiltSeoLandingPage = {
  area: SeoAreaDef;
  jobType: SeoJobTypeDef;
  path: string;
  pathname: string;
  title: string;
  description: string;
  h1: string;
  displayName: string;
  breadcrumbLabel: string;
  intro: string[];
  guide: string[];
  contentSections: Array<{ heading: string; paragraphs: string[] }>;
  faqHeading: string;
  faqs: Array<{ question: string; answer: string }>;
  detailTitleSegment: string;
  detailDescriptionSegment: string;
  listLinkLabel: string;
  dbDistrict: District;
  dbJobType: JobType;
  showInGlobalNav: boolean;
  globalNavLabel: string;
  footerNavLabel: string;
};
