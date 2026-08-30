import {
  SEO_GIRLSBAR_FILTER_DEFS,
  buildSeoBenefitFilterHref,
} from "@/lib/seo-comparison-tags";

export type DistrictComparisonListingCopy = {
  key: "kotoni/girlsbar";
  district: string;
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

const DISTRICT_COMPARISON_LISTINGS: Record<
  string,
  DistrictComparisonListingCopy
> = {
  "kotoni/girlsbar": {
    key: "kotoni/girlsbar",
    district: "琴似",
    dbJobType: "ガールズバー",
    listHeading: (total) => `公開中の琴似ガールズバー求人 ${total}件`,
    countNote:
      "表示条件は各店舗が登録した情報です。件数はDBの公開中求人から自動集計しています。",
    compareIntro:
      "琴似のガールズバー求人を、時給・体験入店・送迎・シフト・未経験歓迎などの条件から比較できます。気になる求人は詳細ページで勤務時間や待遇を確認してください。",
    filterAria: "琴似ガールズバー求人の条件から探す",
    benefitHint:
      "公開中の琴似ガールズバー求人に実際にある待遇だけを表示しています。条件を選ぶと求人一覧へ絞り込めます。",
    compareTipsId: "kotoni-girlsbar-compare-tips",
    compareTipsH2: "琴似でガールズバー求人を比較するときのポイント",
    compareTips: [
      "時給の高さだけで決めず、東西線やJRでの帰り道・終電・送迎の有無までセットで見ると、続けやすいお店を選びやすくなります。White Night Jobでは、掲載審査を通過した店舗の登録情報をもとに、琴似のガールズバー求人を並べて比較できます。",
      "体験入店では接客のテンポにくわえ、退勤後に自宅へ戻れるかも確認ポイントです。求人票の待遇タグと詳細の説明が一致しているか、応募前の質問で確かめるとミスマッチを減らせます。",
    ],
    beginnerHeading: "初めて琴似のガルバ求人を見る方へ",
  },
};

export function getDistrictComparisonListing(
  areaSlug?: string,
  jobTypeSlug?: string,
) {
  if (!areaSlug || !jobTypeSlug) return undefined;
  return DISTRICT_COMPARISON_LISTINGS[`${areaSlug}/${jobTypeSlug}`];
}

export function buildDistrictComparisonFilterLinks(
  listing: DistrictComparisonListingCopy,
  presentComparisonBenefits: string[],
) {
  return SEO_GIRLSBAR_FILTER_DEFS.filter((def) =>
    presentComparisonBenefits.includes(def.match),
  ).map((def) => ({
    label: def.label,
    href: buildSeoBenefitFilterHref({
      district: listing.district,
      jobType: listing.dbJobType,
      benefit: def.match,
    }),
  }));
}
