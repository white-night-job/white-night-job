import type { ColumnJobFilter } from "@/lib/column-jobs";
import { conceptCafeJobSections } from "@/data/column-content/concept-cafe-job";
import { girlsBarBeginnerSections } from "@/data/column-content/girls-bar-beginner";
import { girlsBarVsNewClubSections } from "@/data/column-content/girls-bar-vs-new-club";
import { nightJobFirstGuideSections } from "@/data/column-content/night-job-first-guide";
import { nightJobInterviewSections } from "@/data/column-content/night-job-interview";
import { noAlcoholNightJobSections } from "@/data/column-content/no-alcohol-night-job";
import { sapporoTrialShopsSections } from "@/data/column-content/sapporo-trial-shops";
import { susukinoGirlsbarBeginnerSections } from "@/data/column-content/susukino-girlsbar-beginner";
import { susukinoGirlsbarTrialSections } from "@/data/column-content/susukino-girlsbar-trial";
import { susukinoNightJobBeginnerSections } from "@/data/column-content/susukino-night-job-beginner";
import { trialWorkChecklistSections } from "@/data/column-content/trial-work-checklist";
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
  /** Optional shorter <title>; defaults to title. */
  seoTitle?: string;
  category: string;
  description: string;
  metaDescription: string;
  publishedAt: string;
  publishedAtIso: string;
  updatedAt: string;
  updatedAtIso: string;
  thumbnailTone: "gold" | "charcoal" | "champagne";
  sections: ColumnSection[];
  relatedSlugs: string[];
  jobFilter: ColumnJobFilter;
};

export const COLUMN_LIST_TITLE = "体入ホワイトナイト コラム｜夜職・体験入店ガイド";
export const COLUMN_LIST_H1 = "夜職・体験入店のコラム";
export const COLUMN_LIST_DESCRIPTION =
  "夜職未経験の方や体験入店を考えている方向けのコラムです。職種の違い、面接の準備、体入の進め方など、札幌で安心して働くための実践情報をわかりやすく解説。記事を読んだあと、関連求人や職種ページへもスムーズに移動できます。初めての方でも、応募前に確認すべき点を落ち着いて整理できるようにまとめています。";

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
      "体入ホワイトナイト（White Night Job）とは？札幌の審査済み夜職求人だけを掲載する理由、体験入店前に確認したいポイント、安心なお店選びのコツを、初めての方向けにわかりやすく解説します。",
    publishedAt: "2026年7月9日",
    publishedAtIso: "2026-07-09",
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
      "体入（体験入店）とは何かを解説。当日の流れ・持ち物・確認事項まで、体入ホワイトナイトで安心して体験入店を検討するための基本知識を、初めての方向けにわかりやすくまとめました。",
    publishedAt: "2026年7月9日",
    publishedAtIso: "2026-07-09",
    updatedAt: "2026年7月9日",
    updatedAtIso: "2026-07-09",
    thumbnailTone: "champagne",
    relatedSlugs: [
      "trial-work-checklist",
      "what-is-white-night",
      "night-job-first-guide",
    ],
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
      "札幌で体験入店できるお店の探し方を特集。すすきの・琴似などエリア別の見方と、体入ホワイトナイト掲載店舗を比較するときのチェックポイントを、応募前に確認しやすい形で解説します。",
    publishedAt: "2026年7月9日",
    publishedAtIso: "2026-07-09",
    updatedAt: "2026年8月1日",
    updatedAtIso: "2026-08-01",
    thumbnailTone: "charcoal",
    relatedSlugs: [
      "susukino-night-job-beginner",
      "trial-work-checklist",
      "girls-bar-beginner",
    ],
    jobFilter: { district: "すすきの", limit: 3 },
    sections: sapporoTrialShopsSections,
  },
  {
    slug: "susukino-girlsbar-beginner",
    title:
      "すすきのでガールズバー求人を探す女性向け｜未経験・体入・お店選びを解説",
    seoTitle:
      "すすきのでガールズバー求人を探す女性向け｜未経験・体入・選び方",
    category: "エリア特集",
    description:
      "すすきのでガールズバー求人を探す女性向けに、未経験・体験入店・給与待遇の確認・お店の選び方を解説します。",
    metaDescription:
      "すすきのでガールズバー求人を探している女性向けに、未経験からの働き方、体験入店、給与・待遇の確認ポイント、自分に合ったお店の選び方を解説。求人比較はすすきののガールズバー求人一覧へ誘導します。",
    publishedAt: "2026年8月29日",
    publishedAtIso: "2026-08-29",
    updatedAt: "2026年8月29日",
    updatedAtIso: "2026-08-29",
    thumbnailTone: "gold",
    relatedSlugs: [
      "susukino-girlsbar-trial",
      "girls-bar-beginner",
      "susukino-night-job-beginner",
      "trial-work-checklist",
    ],
    jobFilter: { district: "すすきの", jobType: "ガールズバー", limit: 3 },
    sections: susukinoGirlsbarBeginnerSections,
  },
  {
    slug: "susukino-girlsbar-trial",
    title:
      "すすきののガールズバーで体入するには？体験入店の流れ・確認ポイントを解説",
    seoTitle:
      "すすきののガールズバーで体入するには？体験入店の流れ・確認点",
    category: "体入・体験入店",
    description:
      "すすきののガールズバーで体入（体験入店）を考える方向けに、流れ・求人の確認点・当日のチェック・合うお店の判断を解説します。",
    metaDescription:
      "すすきののガールズバーで体入するには？体験入店の流れ、求人情報で確認したいこと、当日のポイント、未経験で気をつけたいこと、合うお店の判断軸を解説。求人比較はすすきののガールズバー求人一覧へ。",
    publishedAt: "2026年8月29日",
    publishedAtIso: "2026-08-29",
    updatedAt: "2026年8月29日",
    updatedAtIso: "2026-08-29",
    thumbnailTone: "champagne",
    relatedSlugs: [
      "susukino-girlsbar-beginner",
      "what-is-taiin",
      "trial-work-checklist",
    ],
    jobFilter: { district: "すすきの", jobType: "ガールズバー", limit: 3 },
    sections: susukinoGirlsbarTrialSections,
  },
  {
    slug: "girls-bar-beginner",
    title: "ガールズバー初心者ガイド",
    category: "職種ガイド",
    description:
      "ガールズバーが初めての方向けに、仕事内容・雰囲気・体入の進め方を解説します。",
    metaDescription:
      "ガールズバー初心者向けガイド。仕事内容・雰囲気・体入の進め方に加え、体入ホワイトナイト掲載求人の見方と、初めてでも安心して体験入店するコツを実践しやすい順に紹介します。",
    publishedAt: "2026年7月9日",
    publishedAtIso: "2026-07-09",
    updatedAt: "2026年7月9日",
    updatedAtIso: "2026-07-09",
    thumbnailTone: "gold",
    relatedSlugs: ["girls-bar-vs-new-club", "concept-cafe-job", "what-is-taiin"],
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
      "コンカフェの仕事内容を解説。向いている人の特徴、ノルマや衣装の確認点、体入ホワイトナイトでコンカフェ求人を探すときのポイントと体験入店の流れを応募前チェック用に紹介します。",
    publishedAt: "2026年7月9日",
    publishedAtIso: "2026-07-09",
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
      "夜職が初めての方向け完全ガイド。お店選びから体験入店までの流れ、確認すべき条件、体入ホワイトナイトで安心して求人を探すステップを、失敗しにくい順番でわかりやすく解説します。",
    publishedAt: "2026年7月9日",
    publishedAtIso: "2026-07-09",
    updatedAt: "2026年7月9日",
    updatedAtIso: "2026-07-09",
    thumbnailTone: "charcoal",
    relatedSlugs: [
      "susukino-night-job-beginner",
      "night-job-interview",
      "what-is-taiin",
    ],
    jobFilter: { benefit: "未経験者大歓迎", limit: 3 },
    sections: nightJobFirstGuideSections,
  },
  {
    slug: "susukino-night-job-beginner",
    title: "すすきので未経験から夜職を始める方法",
    category: "エリア特集",
    description:
      "すすきので夜職を未経験から始める方向けに、職種の違い・体験入店・面接時の確認・注意点を整理します。",
    metaDescription:
      "すすきので未経験から夜職を始める方法。職種の違い、体験入店、面接の確認項目、ノルマや罰金への注意、体入ホワイトナイトで安心できる求人を探すポイントを実践的に解説します。",
    publishedAt: "2026年8月1日",
    publishedAtIso: "2026-08-01",
    updatedAt: "2026年8月1日",
    updatedAtIso: "2026-08-01",
    thumbnailTone: "gold",
    relatedSlugs: [
      "trial-work-checklist",
      "girls-bar-vs-new-club",
      "night-job-interview",
    ],
    jobFilter: { district: "すすきの", benefit: "未経験者大歓迎", limit: 3 },
    sections: susukinoNightJobBeginnerSections,
  },
  {
    slug: "girls-bar-vs-new-club",
    title: "ガールズバーとニュークラの違い",
    category: "職種ガイド",
    description:
      "ガールズバーとニュークラ（ニュークラブ）の仕事内容・接客・給与・衣装・客層の違いと、未経験者の選び方を解説します。",
    metaDescription:
      "ガールズバーとニュークラの違いを比較。仕事内容・接客・給与・衣装・客層の違いから、向いている人・未経験者が札幌で職種を選ぶポイントまで、迷いやすい点を整理して解説します。",
    publishedAt: "2026年8月1日",
    publishedAtIso: "2026-08-01",
    updatedAt: "2026年8月1日",
    updatedAtIso: "2026-08-01",
    thumbnailTone: "champagne",
    relatedSlugs: [
      "girls-bar-beginner",
      "susukino-night-job-beginner",
      "night-job-interview",
    ],
    jobFilter: { jobType: "ガールズバー", limit: 3 },
    sections: girlsBarVsNewClubSections,
  },
  {
    slug: "trial-work-checklist",
    title: "夜職の体験入店で確認するポイント",
    category: "体入・体験入店",
    description:
      "体験入店（体入）の前後で確認したい給与・費用・客層・スタッフ対応・ノルマ・送迎などのチェックポイントをまとめます。",
    metaDescription:
      "夜職の体験入店で確認するポイント。給与とバック、引かれる費用、客層、スタッフ対応、ノルマ・罰金、送迎、本入店を断れるか、求人内容との相違など重要項目をチェックリスト形式で解説します。",
    publishedAt: "2026年8月1日",
    publishedAtIso: "2026-08-01",
    updatedAt: "2026年8月1日",
    updatedAtIso: "2026-08-01",
    thumbnailTone: "charcoal",
    relatedSlugs: ["what-is-taiin", "night-job-interview", "no-alcohol-night-job"],
    jobFilter: { benefit: "未経験者大歓迎", limit: 3 },
    sections: trialWorkChecklistSections,
  },
  {
    slug: "night-job-interview",
    title: "夜職の面接で聞かれることと準備",
    category: "はじめての方へ",
    description:
      "夜職の面接でよく聞かれる質問、服装、身分証明書、希望勤務日数の伝え方、店舗側への確認事項を整理します。",
    metaDescription:
      "夜職の面接で聞かれることと準備。よくある質問、服装、身分証、希望勤務日数、経験の有無に加え、面接で店舗側へ確認すべき条件・不安の伝え方まで実践向けに解説します。",
    publishedAt: "2026年8月1日",
    publishedAtIso: "2026-08-01",
    updatedAt: "2026年8月1日",
    updatedAtIso: "2026-08-01",
    thumbnailTone: "gold",
    relatedSlugs: [
      "trial-work-checklist",
      "night-job-first-guide",
      "no-alcohol-night-job",
    ],
    jobFilter: { benefit: "未経験者大歓迎", limit: 3 },
    sections: nightJobInterviewSections,
  },
  {
    slug: "no-alcohol-night-job",
    title: "お酒が飲めなくても働ける夜職はある？",
    category: "はじめての方へ",
    description:
      "お酒が飲めない方向けに、飲酒を強制されない求人の見方、確認すべきこと、無理をしない店舗の選び方を解説します。",
    metaDescription:
      "お酒が飲めなくても働ける夜職はある？ソフトドリンク対応の見つけ方、応募前の確認事項、面接前相談の使い方、無理をしない店舗選びのコツを初めての方向けにわかりやすく解説します。",
    publishedAt: "2026年8月1日",
    publishedAtIso: "2026-08-01",
    updatedAt: "2026年8月1日",
    updatedAtIso: "2026-08-01",
    thumbnailTone: "champagne",
    relatedSlugs: [
      "trial-work-checklist",
      "night-job-interview",
      "susukino-night-job-beginner",
    ],
    jobFilter: { benefit: "お酒飲めなくてもOK", limit: 3 },
    sections: noAlcoholNightJobSections,
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
