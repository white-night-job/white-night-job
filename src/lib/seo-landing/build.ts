import { SEO_BRAND_NAME, getSeoArea } from "@/lib/seo-landing/areas";
import { getSeoJobType } from "@/lib/seo-landing/job-types";
import {
  interpolateSeoLines,
  interpolateSeoText,
} from "@/lib/seo-landing/interpolate";
import { seoLandingPages } from "@/lib/seo-landing/landings";
import { getSeoCopyProfile } from "@/lib/seo-landing/profiles";
import type {
  BuiltSeoLandingPage,
  SeoCopyProfile,
  SeoCopyVars,
  SeoLandingPageDef,
} from "@/lib/seo-landing/types";

function buildVars(
  areaName: string,
  jobTypeName: string,
  jobTypeAlias: string,
  displayPattern: string,
): SeoCopyVars {
  const partial: SeoCopyVars = {
    areaName,
    jobTypeName,
    jobTypeAlias,
    jobTypeDisplay: "",
    brandName: SEO_BRAND_NAME,
  };
  partial.jobTypeDisplay = interpolateSeoText(displayPattern, partial);
  return partial;
}

function mergeProfile(
  base: SeoCopyProfile,
  overrides?: Partial<SeoCopyProfile>,
): SeoCopyProfile {
  if (!overrides) return base;
  return {
    ...base,
    ...overrides,
    intro: overrides.intro ?? base.intro,
    guide: overrides.guide ?? base.guide,
    contentSections: overrides.contentSections ?? base.contentSections,
    faqs: overrides.faqs ?? base.faqs,
  };
}

function applyProfile(
  profile: SeoCopyProfile,
  vars: SeoCopyVars,
): Omit<
  BuiltSeoLandingPage,
  | "area"
  | "jobType"
  | "path"
  | "pathname"
  | "dbDistrict"
  | "dbJobType"
  | "showInGlobalNav"
  | "globalNavLabel"
  | "footerNavLabel"
> {
  return {
    title: interpolateSeoText(profile.title, vars),
    description: interpolateSeoText(profile.description, vars),
    h1: interpolateSeoText(profile.h1, vars),
    displayName: interpolateSeoText(profile.displayName, vars),
    breadcrumbLabel: interpolateSeoText(profile.breadcrumbLabel, vars),
    intro: interpolateSeoLines(profile.intro, vars),
    guide: interpolateSeoLines(profile.guide, vars),
    contentSections: profile.contentSections.map((section) => ({
      heading: interpolateSeoText(section.heading, vars),
      paragraphs: interpolateSeoLines(section.paragraphs, vars),
    })),
    faqHeading: interpolateSeoText(profile.faqHeading, vars),
    faqs: profile.faqs.map((faq) => ({
      question: interpolateSeoText(faq.question, vars),
      answer: interpolateSeoText(faq.answer, vars),
    })),
    detailTitleSegment: interpolateSeoText(profile.detailTitleSegment, vars),
    detailDescriptionSegment: interpolateSeoText(
      profile.detailDescriptionSegment,
      vars,
    ),
    listLinkLabel: interpolateSeoText(profile.listLinkLabel, vars),
  };
}

export function buildSeoLandingPage(
  def: SeoLandingPageDef,
): BuiltSeoLandingPage | null {
  if (!def.published) return null;

  const area = getSeoArea(def.area);
  const jobType = getSeoJobType(def.jobType);
  const profileBase = getSeoCopyProfile(def.profile);
  if (!area || !jobType || !profileBase) return null;

  const profile = mergeProfile(profileBase, def.overrides);
  const vars = buildVars(
    area.name,
    jobType.name,
    jobType.alias,
    profile.jobTypeDisplayPattern,
  );
  const copy = applyProfile(profile, vars);
  const pathSlug = jobType.pathSlug ?? jobType.slug;
  const path = `${area.basePath}/${pathSlug}`;

  return {
    area,
    jobType,
    path,
    pathname: path,
    ...copy,
    dbDistrict: area.district,
    dbJobType: jobType.dbJobType,
    showInGlobalNav: Boolean(def.showInGlobalNav),
    globalNavLabel: interpolateSeoText(
      def.globalNavLabel ?? "{areaName}の{jobTypeName}求人",
      vars,
    ),
    footerNavLabel: interpolateSeoText(
      def.footerNavLabel ?? "{areaName}の{jobTypeAlias}求人",
      vars,
    ),
  };
}

export function listPublishedSeoLandings(): BuiltSeoLandingPage[] {
  return seoLandingPages
    .map((def) => buildSeoLandingPage(def))
    .filter((page): page is BuiltSeoLandingPage => page != null);
}

export function getPublishedSeoLanding(
  areaSlug: string,
  jobTypePathSlug: string,
): BuiltSeoLandingPage | undefined {
  return listPublishedSeoLandings().find(
    (page) =>
      page.area.slug === areaSlug &&
      (page.jobType.pathSlug ?? page.jobType.slug) === jobTypePathSlug,
  );
}

export function getPublishedSeoLandingByDistrictJobType(
  district: string,
  dbJobType: string,
): BuiltSeoLandingPage | undefined {
  return listPublishedSeoLandings().find(
    (page) =>
      page.dbDistrict === district && page.dbJobType === dbJobType,
  );
}

export function getSeoLandingPath(
  areaSlug: string,
  jobTypeSlug: string,
): string | null {
  const area = getSeoArea(areaSlug);
  const jobType = getSeoJobType(jobTypeSlug);
  if (!area || !jobType) return null;
  return `${area.basePath}/${jobType.pathSlug ?? jobType.slug}`;
}
