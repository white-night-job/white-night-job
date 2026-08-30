import {
  SEO_GIRLSBAR_FILTER_DEFS,
  buildSeoBenefitFilterHref,
} from "@/lib/seo-comparison-tags";

export type SusukinoComparisonListingCopy = {
  slug: "girlsbar" | "concept-cafe";
  dbJobType: string;
  listHeading: (total: number) => string;
  countNote: string;
  compareIntro: string;
  filterAria: string;
  benefitHint: string;
  compareTipsId: string;
  compareTipsH2: string;
  compareTips: readonly [string, string];
  beginnerHeading: string;
};

export const SUSUKINO_COMPARISON_LISTINGS: Record<
  string,
  SusukinoComparisonListingCopy
> = {
  girlsbar: {
    slug: "girlsbar",
    dbJobType: "ガールズバー",
    listHeading: (total) => `公開中のすすきのガールズバー求人 ${total}件`,
    countNote:
      "表示条件は各店舗が登録した情報です。件数はDBの公開中求人から自動集計しています。",
    compareIntro:
      "すすきののガールズバー求人を、時給・体験入店・送迎・シフト・未経験歓迎などの条件から比較できます。気になる求人は詳細ページで勤務時間や待遇を確認してください。",
    filterAria: "すすきのガールズバー求人の条件から探す",
    benefitHint:
      "公開中のすすきのガールズバー求人に実際にある待遇だけを表示しています。条件を選ぶと求人一覧へ絞り込めます。",
    compareTipsId: "susukino-girlsbar-compare-tips",
    compareTipsH2: "すすきのでガールズバー求人を比較するときのポイント",
    compareTips: [
      "時給の高さだけで決めず、通いやすさ・シフトの入りやすさ・終業後の帰宅手段までセットで見ると、続けやすいお店を選びやすくなります。White Night Jobでは、掲載審査を通過した店舗の登録情報をもとに、すすきののガールズバー求人を並べて比較できます。",
      "体験入店（体入）の案内があるか、送迎や終業時間、週の出勤ペース、未経験者へのサポート（研修・フォローの記載）も確認ポイントです。求人票の待遇タグと詳細の説明が一致しているか、応募前の質問で確かめるとミスマッチを減らせます。",
    ],
    beginnerHeading: "初めてガルバ求人を見る方へ",
  },
  "concept-cafe": {
    slug: "concept-cafe",
    dbJobType: "コンカフェ",
    listHeading: (total) => `公開中のすすきのコンカフェ求人 ${total}件`,
    countNote:
      "表示条件は各店舗が登録した情報です。件数はDBの公開中求人から自動集計しています。",
    compareIntro:
      "すすきののコンカフェ求人を、時給・衣装・コンセプト・体験入店・シフトなどの条件から比較できます。気になる求人は詳細ページで勤務時間や待遇を確認してください。",
    filterAria: "すすきのコンカフェ求人の条件から探す",
    benefitHint:
      "公開中のすすきのコンカフェ求人に実際にある待遇だけを表示しています。条件を選ぶと求人一覧へ絞り込めます。",
    compareTipsId: "susukino-concept-cafe-compare-tips",
    compareTipsH2: "すすきのでコンカフェ求人を比較するときのポイント",
    compareTips: [
      "世界観や衣装の好みだけで決めず、シフトの現実感・衣装の準備負担・終業後の帰宅まで見ておくと、続けやすい店舗を選びやすくなります。White Night Jobでは、掲載審査を通過した店舗の登録情報をもとに、すすきののコンカフェ求人を並べて比較できます。",
      "体験入店では接客のテンポだけでなく、指定衣装の動きやすさやイベント準備の有無も確認ポイントです。求人票の待遇と店側の説明が一致しているか、応募前の質問で確かめるとミスマッチを減らせます。",
    ],
    beginnerHeading: "初めてコンカフェ求人を見る方へ",
  },
};

export function getSusukinoComparisonListing(slug?: string) {
  if (!slug) return undefined;
  return SUSUKINO_COMPARISON_LISTINGS[slug];
}

export function buildSusukinoComparisonFilterLinks(
  listing: SusukinoComparisonListingCopy,
  presentComparisonBenefits: string[],
) {
  return SEO_GIRLSBAR_FILTER_DEFS.filter((def) =>
    presentComparisonBenefits.includes(def.match),
  ).map((def) => ({
    label: def.label,
    href: buildSeoBenefitFilterHref({
      district: "すすきの",
      jobType: listing.dbJobType,
      benefit: def.match,
    }),
  }));
}
