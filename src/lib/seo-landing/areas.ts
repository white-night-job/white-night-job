import type { SeoAreaDef, SeoAreaSlug } from "@/lib/seo-landing/types";

export const SEO_BRAND_NAME = "White Night Job";

/**
 * Area master data. Defining an area here does NOT publish landing pages —
 * only entries in seoLandingPages with published:true are live.
 */
export const seoAreas: Record<SeoAreaSlug, SeoAreaDef> = {
  susukino: {
    slug: "susukino",
    name: "すすきの",
    district: "すすきの",
    basePath: "/sapporo/susukino",
    flavor:
      "札幌を代表する歓楽街で、店舗数・職種の幅が広く雰囲気の差も大きいエリアです。",
  },
  kotoni: {
    slug: "kotoni",
    name: "琴似",
    district: "琴似",
    basePath: "/sapporo/kotoni",
    flavor:
      "地下鉄やJRでのアクセスを活かしやすく、すすきのより落ち着いた雰囲気を検討しやすいエリアです。",
  },
  kita24jo: {
    slug: "kita24jo",
    name: "北24条",
    district: "24条",
    basePath: "/sapporo/kita24jo",
    flavor:
      "地下鉄南北線で通いやすく、学生やWワークの方が通いやすい立地として選ばれやすいエリアです。",
  },
  teine: {
    slug: "teine",
    name: "手稲",
    district: "手稲",
    basePath: "/sapporo/teine",
    flavor:
      "JR手稲駅周辺を中心に、通いやすさや生活圏を重視して求人を比較しやすいエリアです。",
  },
};

export function getSeoArea(slug: string): SeoAreaDef | undefined {
  return seoAreas[slug as SeoAreaSlug];
}
