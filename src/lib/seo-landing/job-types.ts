import type { SeoJobTypeDef, SeoJobTypeSlug } from "@/lib/seo-landing/types";

/**
 * Job-type master data. pathSlug defaults to slug when omitted.
 * Example future: publish jobType "concafe" with pathSlug "concafe"
 * without renaming the DB value コンカフェ.
 */
export const seoJobTypes: Record<SeoJobTypeSlug, SeoJobTypeDef> = {
  girlsbar: {
    slug: "girlsbar",
    name: "ガールズバー",
    alias: "ガルバ",
    dbJobType: "ガールズバー",
    pathSlug: "girlsbar",
    legacyPathSlugs: ["girls-bar"],
    contentSlug: "girls-bar",
  },
  "new-club": {
    slug: "new-club",
    name: "ニュークラブ",
    alias: "ニュークラ",
    dbJobType: "ニュークラ",
    contentSlug: "new-club",
  },
  lounge: {
    slug: "lounge",
    name: "ラウンジ",
    alias: "ラウンジ",
    dbJobType: "ラウンジ",
    contentSlug: "lounge",
  },
  snack: {
    slug: "snack",
    name: "スナック",
    alias: "スナック",
    dbJobType: "スナック",
    contentSlug: "snack",
  },
  "concept-cafe": {
    slug: "concept-cafe",
    name: "コンカフェ",
    alias: "コンカフェ",
    dbJobType: "コンカフェ",
    pathSlug: "concept-cafe",
    contentSlug: "concept-cafe",
  },
  /** Not published — reserved so /sapporo/{area}/concafe can be added later. */
  concafe: {
    slug: "concafe",
    name: "コンカフェ",
    alias: "コンカフェ",
    dbJobType: "コンカフェ",
    pathSlug: "concafe",
    contentSlug: "concept-cafe",
  },
};

export function getSeoJobType(slug: string): SeoJobTypeDef | undefined {
  return seoJobTypes[slug as SeoJobTypeSlug];
}

export function normalizeSeoJobTypePathSlug(slug: string): string {
  for (const def of Object.values(seoJobTypes)) {
    if (def.pathSlug === slug || def.slug === slug) return def.pathSlug ?? def.slug;
    if (def.legacyPathSlugs?.includes(slug)) return def.pathSlug ?? def.slug;
  }
  return slug;
}

export function resolveSeoJobTypeByPathSlug(
  pathSlug: string,
): SeoJobTypeDef | undefined {
  const normalized = normalizeSeoJobTypePathSlug(pathSlug);
  return Object.values(seoJobTypes).find(
    (def) => (def.pathSlug ?? def.slug) === normalized,
  );
}
