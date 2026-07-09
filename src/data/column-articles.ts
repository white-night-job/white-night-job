import type { ColumnJobFilter } from "@/lib/column-jobs";

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
    sections: [
      {
        id: "overview",
        title: "体入ホワイトナイト（White Night Job）とは",
        paragraphs: [
          "体入ホワイトナイト（White Night Job）は、体験入店を含め、安心して働ける夜職求人だけを掲載する札幌エリアの求人サイトです。",
          "「とにかく数を集める」のではなく、求職者が比較しやすい情報設計と、審査済み店舗の掲載に力を入れています。",
        ],
      },
      {
        id: "features",
        title: "当サイトの特徴",
        paragraphs: [
          "通常審査に加え、独自の掲載基準で店舗を選定しています。待遇タグやキャストの声など、働くイメージが持ちやすい情報を掲載しています。",
          "ブラック店舗の報告機能や、相談窓口の整備など、初めての方でも不安を減らせる仕組みを用意しています。",
        ],
      },
      {
        id: "who",
        title: "こんな方におすすめ",
        paragraphs: [
          "夜職が初めてで、安心できるお店から探したい方",
          "体験入店（体入）で雰囲気を確かめてから決めたい方",
          "エリアや職種で条件を絞り込みながら求人を比較したい方",
        ],
      },
      {
        id: "start",
        title: "求人の探し方",
        paragraphs: [
          "まずは求人一覧からエリア・職種・待遇で検索してみてください。気になる店舗は詳細ページで条件を確認し、LINEや電話で相談できます。",
        ],
        links: [
          { label: "求人一覧を見る", href: "/jobs" },
          { label: "優良店掲載基準を確認する", href: "/listing-criteria" },
        ],
      },
    ],
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
    sections: [
      {
        id: "meaning",
        title: "体入（体験入店）とは",
        paragraphs: [
          "体入とは「体験入店」の略で、本入店の前に実際のお店で雰囲気や仕事内容を体験することです。",
          "体入ホワイトナイト（White Night Job）では、未経験歓迎の店舗を探しやすいよう、待遇情報をわかりやすく掲載しています。",
        ],
      },
      {
        id: "flow",
        title: "一般的な流れ",
        paragraphs: [
          "求人を見る → 応募・相談 → 面接または体験入店の日程調整 → 当日体験 → 条件確認のうえ入店を判断、という流れが一般的です。",
          "店舗によって体験入店の時間帯や時給の扱いが異なるため、事前に必ず確認しましょう。",
        ],
      },
      {
        id: "tips",
        title: "体入前に確認したいこと",
        paragraphs: [
          "時給・ノルマ・罰金の有無、送迎、衣装、お酒の扱いなどは、体験前に質問しておくと安心です。",
          "無理にその場で入店を決めなくて大丈夫です。自分のペースで比較することが大切です。",
        ],
        links: [
          {
            label: "未経験歓迎の求人を見る",
            href: "/jobs?benefit=未経験者大歓迎",
          },
        ],
      },
    ],
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
    sections: [
      {
        id: "area",
        title: "札幌の夜職エリア",
        paragraphs: [
          "札幌ではすすきのを中心に、琴似・24条・手稲など、エリアごとに店舗の雰囲気や客層が異なります。",
          "体入ホワイトナイト（White Night Job）ではエリア検索で、自分に合いそうな店舗を絞り込めます。",
        ],
      },
      {
        id: "how-to-search",
        title: "体験入店向けの探し方",
        paragraphs: [
          "「未経験者大歓迎」「週1出勤OK」などの待遇で絞り込むと、体験入店しやすい店舗が見つかりやすくなります。",
          "すすきのエリアの求人は、求人一覧のエリアフィルターから確認できます。",
        ],
        links: [
          { label: "すすきのの求人を見る", href: "/jobs?district=すすきの" },
        ],
      },
      {
        id: "pick-shops",
        title: "店舗選びのポイント",
        paragraphs: [
          "写真や紹介文だけでなく、営業時間・時給・相談窓口の有無もあわせて確認しましょう。",
          "気になる店舗はお気に入り登録して比較するのもおすすめです（LINEログイン後に利用可能）。",
        ],
      },
    ],
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
    sections: [
      {
        id: "job",
        title: "ガールズバーの仕事内容",
        paragraphs: [
          "ガールズバーは、カウンター越しにお客様と会話を楽しみながらお酒を提供するお店が多い職種です。",
          "お店によって雰囲気やドレスコードが異なるため、体入で実際の空気感を確かめるのがおすすめです。",
        ],
      },
      {
        id: "beginner",
        title: "未経験でも始めやすい理由",
        paragraphs: [
          "会話中心のお店が多く、未経験歓迎の求人も豊富です。体入ホワイトナイト（White Night Job）では「未経験者大歓迎」タグで絞り込めます。",
          "お酒が飲めなくても働ける店舗もあるため、待遇欄で確認してみてください。",
        ],
      },
      {
        id: "trial",
        title: "体入のすすめ方",
        paragraphs: [
          "まずはガールズバー求人一覧から気になる店舗を3店舗ほどピックアップし、条件を比較してから相談するとスムーズです。",
          "下記のおすすめ求人から、詳細ページへ進んでLINE相談も可能です。",
        ],
        links: [
          { label: "ガールズバー求人を見る", href: "/jobs?jobType=ガールズバー" },
        ],
      },
    ],
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
    sections: [
      {
        id: "overview",
        title: "コンカフェとは",
        paragraphs: [
          "コンカフェ（コンセプトカフェ）は、テーマや世界観を大切にしたお店で、接客や演出が仕事の中心になる職種です。",
          "ガールズバーと比べて、衣装や雰囲気に個性があるお店が多いのが特徴です。",
        ],
      },
      {
        id: "work",
        title: "具体的な仕事内容",
        paragraphs: [
          "お客様への接客、ドリンク提供、店内の雰囲気づくりなどが主な業務です。お店ごとにルールや演出が異なります。",
          "体入ホワイトナイト（White Night Job）の求人詳細では、店内写真やキャストの声も参考にできます。",
        ],
      },
      {
        id: "check",
        title: "体入前の確認事項",
        paragraphs: [
          "衣装はレンタルか私服か、ノルマの有無、営業時間帯などを事前に確認しましょう。",
          "コンカフェ求人は職種フィルターから一覧できます。気になる店舗は詳細ページから相談してみてください。",
        ],
        links: [
          { label: "コンカフェ求人を見る", href: "/jobs?jobType=コンカフェ" },
        ],
      },
    ],
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
    sections: [
      {
        id: "step1",
        title: "STEP1：不安を整理する",
        paragraphs: [
          "「未経験でも大丈夫か」「お酒は飲める必要があるか」「送迎はあるか」など、不安を書き出してから求人を探すと効率的です。",
          "体入ホワイトナイト（White Night Job）では待遇タグで条件を絞り込めます。",
        ],
      },
      {
        id: "step2",
        title: "STEP2：職種とエリアを決める",
        paragraphs: [
          "ガールズバー・コンカフェ・ラウンジなど、職種ごとに雰囲気が異なります。まずは興味のある職種から見てみましょう。",
          "札幌内でもエリアによって客層や店舗数が変わるため、エリア検索も活用してください。",
        ],
      },
      {
        id: "step3",
        title: "STEP3：体験入店で確認する",
        paragraphs: [
          "条件が合いそうな店舗が見つかったら、体験入店で実際の雰囲気を確かめましょう。",
          "その場で入店を迫られても、一度持ち帰って考えて問題ありません。",
        ],
      },
      {
        id: "step4",
        title: "STEP4：相談しながら進める",
        paragraphs: [
          "当サイト掲載店舗の多くは相談窓口を設けています。小さな疑問でも先に聞いてから体入に進むと安心です。",
          "おすすめ求人は下記から詳細ページへアクセスできます。",
        ],
        links: [
          { label: "求人一覧を見る", href: "/jobs" },
          { label: "よくある質問を見る", href: "/faq" },
        ],
      },
    ],
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
