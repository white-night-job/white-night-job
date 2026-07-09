import type { ColumnJobFilter } from "@/lib/column-jobs";
import { conceptCafeJobSections } from "@/data/column-content/concept-cafe-job";
import { girlsBarBeginnerSections } from "@/data/column-content/girls-bar-beginner";
import { nightJobFirstGuideSections } from "@/data/column-content/night-job-first-guide";
import { sapporoTrialShopsSections } from "@/data/column-content/sapporo-trial-shops";
import { whatIsTaiinSections } from "@/data/column-content/what-is-taiin";
import { whatIsWhiteNightSections } from "@/data/column-content/what-is-white-night";

export type ColumnSectionLink = {
  label: string;
  href: string;
};

export type ColumnSection = {
  id: string;
  title: string;
  paragraphs: string[];
  links?: ColumnSectionLink[];
};

export type ColumnArticle = {
  slug: string;
  title: string;
  category: string;
  description: string;
  metaDescription: string;
  updatedAt: string;
  updatedAtIso: string;
  thumbnailTone: "gold" | "charcoal" | "champagne";
  sections: ColumnSection[];
  relatedSlugs: string[];
  jobFilter: ColumnJobFilter;
};

export const COLUMN_LIST_TITLE = "体入ホワイトナイト コラム";
export const COLUMN_LIST_DESCRIPTION =
  "夜職未経験の方や体験入店を考えている方に役立つ情報を掲載しています。";

export const COLUMN_TOP_FEATURED_SLUGS = [
  "what-is-white-night",
  "what-is-taiin",
  "sapporo-trial-shops",
] as const;

export const COLUMN_ARTICLES: ColumnArticle[] = [
  {
    slug: "what-is-white-night",
    title: "体入ホワイトナイトとは？",
    category: "はじめての方へ",
    description:
      "体入ホワイトナイト（White Night Job）の特徴や、安心してお店選びができる理由をわかりやすく解説します。",
    metaDescription:
      "体入ホワイトナイト（White Night Job）とは？審査済み店舗のみ掲載する夜職求人サイトの特徴や、体験入店前に知っておきたいポイントを解説します。",
    updatedAt: "2026年7月9日",
    updatedAtIso: "2026-07-09",
    thumbnailTone: "gold",
    relatedSlugs: ["what-is-taiin", "night-job-first-guide", "sapporo-trial-shops"],
    jobFilter: { pickup: true, limit: 3 },
    sections: whatIsWhiteNightSections,
  },
  {
    slug: "what-is-taiin",
    title: "体入とは？",
    category: "体入・体験入店",
    description:
      "体入（体験入店）の意味や流れ、初めての方向けの注意点を解説します。",
    metaDescription:
      "体入（体験入店）とは何かを解説。体入ホワイトナイト（White Night Job）で安心して体験入店を検討するための基本知識をまとめました。",
    updatedAt: "2026年7月9日",
    updatedAtIso: "2026-07-09",
    thumbnailTone: "champagne",
    relatedSlugs: ["what-is-white-night", "night-job-first-guide", "sapporo-trial-shops"],
    jobFilter: { benefit: "未経験者大歓迎", limit: 3 },
    sections: whatIsTaiinSections,
  },
  {
    slug: "sapporo-trial-shops",
    title: "札幌で体験入店できるお店特集",
    category: "エリア特集",
    description:
      "札幌エリアで体験入店を検討している方向けに、エリア別の探し方とおすすめの見方を紹介します。",
    metaDescription:
      "札幌で体験入店できるお店の探し方を特集。すすきの・琴似など、体入ホワイトナイト（White Night Job）掲載店舗の見方を解説します。",
    updatedAt: "2026年7月9日",
    updatedAtIso: "2026-07-09",
    thumbnailTone: "charcoal",
    relatedSlugs: ["what-is-taiin", "girls-bar-beginner", "concept-cafe-job"],
    jobFilter: { district: "すすきの", limit: 3 },
    sections: sapporoTrialShopsSections,
  },
  {
    slug: "girls-bar-beginner",
    title: "ガールズバー初心者ガイド",
    category: "職種ガイド",
    description:
      "ガールズバーが初めての方向けに、仕事内容・雰囲気・体入の進め方を解説します。",
    metaDescription:
      "ガールズバー初心者向けガイド。体入ホワイトナイト（White Night Job）掲載のガールズバー求人の見方と、初めてでも安心して体験入店するコツを紹介。",
    updatedAt: "2026年7月9日",
    updatedAtIso: "2026-07-09",
    thumbnailTone: "gold",
    relatedSlugs: ["concept-cafe-job", "night-job-first-guide", "what-is-taiin"],
    jobFilter: { jobType: "ガールズバー", limit: 3 },
    sections: girlsBarBeginnerSections,
  },
  {
    slug: "concept-cafe-job",
    title: "コンカフェの仕事内容",
    category: "職種ガイド",
    description:
      "コンカフェの仕事内容や向いている方の特徴、体験入店前のチェックポイントを解説します。",
    metaDescription:
      "コンカフェの仕事内容を解説。体入ホワイトナイト（White Night Job）でコンカフェ求人を探す際のポイントや体験入店の流れを紹介します。",
    updatedAt: "2026年7月9日",
    updatedAtIso: "2026-07-09",
    thumbnailTone: "champagne",
    relatedSlugs: ["girls-bar-beginner", "night-job-first-guide", "sapporo-trial-shops"],
    jobFilter: { jobType: "コンカフェ", limit: 3 },
    sections: conceptCafeJobSections,
  },
  {
    slug: "night-job-first-guide",
    title: "夜職が初めての方向け完全ガイド",
    category: "はじめての方へ",
    description:
      "夜職・ナイトワークが初めての方に向けて、お店選びから体験入店までの流れをまとめました。",
    metaDescription:
      "夜職が初めての方向け完全ガイド。体入ホワイトナイト（White Night Job）で安心して求人を探すためのステップをわかりやすく解説します。",
    updatedAt: "2026年7月9日",
    updatedAtIso: "2026-07-09",
    thumbnailTone: "charcoal",
    relatedSlugs: ["what-is-white-night", "what-is-taiin", "girls-bar-beginner"],
    jobFilter: { benefit: "未経験者大歓迎", limit: 3 },
    sections: nightJobFirstGuideSections,
  },
];

export function getColumnArticle(slug: string): ColumnArticle | undefined {
  return COLUMN_ARTICLES.find((article) => article.slug === slug);
}

export function getRelatedArticles(slugs: string[]): ColumnArticle[] {
  return slugs
    .map((slug) => getColumnArticle(slug))
    .filter((article): article is ColumnArticle => Boolean(article));
}

export function getJobsSearchPath(article: ColumnArticle): string {
  const params = new URLSearchParams();
  if (article.jobFilter.jobType) params.set("jobType", article.jobFilter.jobType);
  if (article.jobFilter.district) params.set("district", article.jobFilter.district);
  if (article.jobFilter.benefit) params.append("benefit", article.jobFilter.benefit);
  const query = params.toString();
  return query ? `/jobs?${query}` : "/jobs";
}
