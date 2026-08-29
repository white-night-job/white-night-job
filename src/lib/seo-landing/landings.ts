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
    /** Top / area nav anchor: すすきののガールズバー求人 */
    globalNavLabel: "{areaName}の{jobTypeName}求人",
    footerNavLabel: "{areaName}の{jobTypeName}求人",
    overrides: {
      jobTypeDisplayPattern: "{jobTypeName}",
      title: "{areaName}の{jobTypeName}求人・{jobTypeAlias}求人｜{brandName}",
      h1: "{areaName}の{jobTypeName}求人",
      description:
        "{areaName}で{jobTypeName}求人を探すなら{brandName}。{areaName}のガルバ・ガールズバー求人を掲載。時給・各種バック・日払い・送迎・体入などの条件から、自分に合った{areaName}の{jobTypeName}求人を探せます。",
      displayName: "{jobTypeName}",
      breadcrumbLabel: "{jobTypeName}求人",
      intro: [
        "{areaName}で{jobTypeName}求人を探している方へ。{brandName}では、{areaName}エリアの{jobTypeName}（{jobTypeAlias}）求人を掲載しています。時給や各種バック、日払い、送迎、体入などの条件を比較しながら、自分に合ったお店を探せます。",
        "{areaName}は札幌を代表する歓楽街で、{jobTypeName}（通称{jobTypeAlias}）の店舗も多く、雰囲気や客層、働き方の幅が広いのが特徴です。公開中の求人はページ内に自動で表示され、新規公開・更新時も反映されます。",
      ],
      listLinkLabel: "{areaName}の{jobTypeName}求人一覧",
      detailTitleSegment: "{areaName}の{jobTypeName}・{jobTypeAlias}",
      detailDescriptionSegment: "{areaName}の{jobTypeName}・{jobTypeAlias}",
    },
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
