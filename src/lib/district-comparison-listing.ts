import {
  SEO_GIRLSBAR_FILTER_DEFS,
  buildSeoBenefitFilterHref,
} from "@/lib/seo-comparison-tags";

export type DistrictComparisonListingCopy = {
  key: string;
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

const COUNT_NOTE =
  "表示条件は各店舗が登録した情報です。件数はDBの公開中求人から自動集計しています。";

function listing(input: {
  key: string;
  district: string;
  dbJobType: string;
  areaLabel: string;
  jobLabel: string;
  compareIntro: string;
  compareTips: readonly [string, string];
  beginnerHeading: string;
}): DistrictComparisonListingCopy {
  return {
    key: input.key,
    district: input.district,
    dbJobType: input.dbJobType,
    listHeading: (total) =>
      `公開中の${input.areaLabel}${input.jobLabel}求人 ${total}件`,
    countNote: COUNT_NOTE,
    compareIntro: input.compareIntro,
    filterAria: `${input.areaLabel}${input.jobLabel}求人の条件から探す`,
    benefitHint: `公開中の${input.areaLabel}${input.jobLabel}求人に実際にある待遇だけを表示しています。条件を選ぶと求人一覧へ絞り込めます。`,
    compareTipsId: `${input.key.replace("/", "-")}-compare-tips`,
    compareTipsH2: `${input.areaLabel}で${input.jobLabel}求人を比較するときのポイント`,
    compareTips: input.compareTips,
    beginnerHeading: input.beginnerHeading,
  };
}

const DISTRICT_COMPARISON_LISTINGS: Record<
  string,
  DistrictComparisonListingCopy
> = {
  "kotoni/girlsbar": listing({
    key: "kotoni/girlsbar",
    district: "琴似",
    dbJobType: "ガールズバー",
    areaLabel: "琴似",
    jobLabel: "ガールズバー",
    compareIntro:
      "琴似のガールズバー求人を、時給・体験入店・送迎・シフト・未経験歓迎などの条件から比較できます。気になる求人は詳細ページで勤務時間や待遇を確認してください。",
    compareTips: [
      "時給の高さだけで決めず、東西線やJRでの帰り道・終電・送迎の有無までセットで見ると、続けやすいお店を選びやすくなります。White Night Jobでは、掲載審査を通過した店舗の登録情報をもとに、琴似のガールズバー求人を並べて比較できます。",
      "体験入店では接客のテンポにくわえ、退勤後に自宅へ戻れるかも確認ポイントです。求人票の待遇タグと詳細の説明が一致しているか、応募前の質問で確かめるとミスマッチを減らせます。",
    ],
    beginnerHeading: "初めて琴似のガルバ求人を見る方へ",
  }),
  "kotoni/concept-cafe": listing({
    key: "kotoni/concept-cafe",
    district: "琴似",
    dbJobType: "コンカフェ",
    areaLabel: "琴似",
    jobLabel: "コンカフェ",
    compareIntro:
      "琴似のコンカフェ求人を、時給・衣装・世界観・体験入店・シフトなどの条件から比較できます。気になる求人は詳細ページで勤務時間や待遇を確認してください。",
    compareTips: [
      "世界観の好みだけで決めず、東西線の終電と衣装の準備時間まで見ておくと、続けやすい店舗を選びやすくなります。White Night Jobでは、掲載審査を通過した店舗の登録情報をもとに比較できます。",
      "体験入店では指定衣装の動きやすさも確認ポイントです。求人票の待遇と店側の説明が一致しているか、応募前に確かめてください。",
    ],
    beginnerHeading: "初めて琴似のコンカフェ求人を見る方へ",
  }),
  "kotoni/snack": listing({
    key: "kotoni/snack",
    district: "琴似",
    dbJobType: "スナック",
    areaLabel: "琴似",
    jobLabel: "スナック",
    compareIntro:
      "琴似のスナック求人を、時給・体験入店・送迎・シフト・未経験歓迎などの条件から比較できます。気になる求人は詳細ページで勤務時間や待遇を確認してください。",
    compareTips: [
      "時給だけでなく、少人数店の空気感と西区からの帰宅をセットで見ると続けやすい店を選びやすくなります。White Night Jobでは掲載審査を通過した店舗の登録情報をもとに比較できます。",
      "体験入店ではトーク力より、スタッフの話しやすさを確認するのがポイントです。",
    ],
    beginnerHeading: "初めて琴似のスナック求人を見る方へ",
  }),
  "kotoni/lounge": listing({
    key: "kotoni/lounge",
    district: "琴似",
    dbJobType: "ラウンジ",
    areaLabel: "琴似",
    jobLabel: "ラウンジ",
    compareIntro:
      "琴似のラウンジ求人を、時給・体験入店・送迎・シフト・未経験歓迎などの条件から比較できます。気になる求人は詳細ページで勤務時間や待遇を確認してください。",
    compareTips: [
      "時給だけでなく席での距離感と東西線の終電まで見ておくと、続けやすい店舗を選びやすくなります。White Night Jobでは掲載審査を通過した店舗の登録情報をもとに比較できます。",
      "体験入店では盛り上げ力より、客席のテンポを確認するのがポイントです。",
    ],
    beginnerHeading: "初めて琴似のラウンジ求人を見る方へ",
  }),
  "kotoni/new-club": listing({
    key: "kotoni/new-club",
    district: "琴似",
    dbJobType: "ニュークラ",
    areaLabel: "琴似",
    jobLabel: "ニュークラ",
    compareIntro:
      "琴似のニュークラ求人を、時給・各種バック・体験入店・ドレス・シフトなどの条件から比較できます。気になる求人は詳細ページで勤務時間や待遇を確認してください。",
    compareTips: [
      "時給だけでなくドレスの準備と東西線での帰宅まで見ておくと、続けやすい店舗を選びやすくなります。White Night Jobでは掲載審査を通過した店舗の登録情報をもとに比較できます。",
      "体験入店では席の空気や教え方を確認するのがポイントです。",
    ],
    beginnerHeading: "初めて琴似のニュークラ求人を見る方へ",
  }),
  "kita24jo/girlsbar": listing({
    key: "kita24jo/girlsbar",
    district: "24条",
    dbJobType: "ガールズバー",
    areaLabel: "北24条",
    jobLabel: "ガールズバー",
    compareIntro:
      "北24条のガールズバー求人を、時給・体験入店・送迎・シフト・未経験歓迎などの条件から比較できます。気になる求人は詳細ページで勤務時間や待遇を確認してください。",
    compareTips: [
      "時給だけでなく南北線での帰り道と終電までセットで見ると、続けやすいお店を選びやすくなります。White Night Jobでは掲載審査を通過した店舗の登録情報をもとに比較できます。",
      "学生の方は授業のある曜日を先に伝え、体入で店のテンポも確かめてください。",
    ],
    beginnerHeading: "初めて北24条のガルバ求人を見る方へ",
  }),
  "kita24jo/concept-cafe": listing({
    key: "kita24jo/concept-cafe",
    district: "24条",
    dbJobType: "コンカフェ",
    areaLabel: "北24条",
    jobLabel: "コンカフェ",
    compareIntro:
      "北24条のコンカフェ求人を、時給・衣装・世界観・体験入店・シフトなどの条件から比較できます。気になる求人は詳細ページで勤務時間や待遇を確認してください。",
    compareTips: [
      "世界観だけでなく、通学帰りに間に合う退勤と衣装の準備時間を見ておくと続けやすくなります。White Night Jobでは掲載審査を通過した店舗の登録情報をもとに比較できます。",
      "体験入店では指定衣装の動きやすさも確認ポイントです。",
    ],
    beginnerHeading: "初めて北24条のコンカフェ求人を見る方へ",
  }),
  "kita24jo/snack": listing({
    key: "kita24jo/snack",
    district: "24条",
    dbJobType: "スナック",
    areaLabel: "北24条",
    jobLabel: "スナック",
    compareIntro:
      "北24条のスナック求人を、時給・体験入店・送迎・シフト・未経験歓迎などの条件から比較できます。気になる求人は詳細ページで勤務時間や待遇を確認してください。",
    compareTips: [
      "時給だけでなく、北区の常連さんとの距離感と南北線での帰宅をセットで見てください。White Night Jobでは掲載審査を通過した店舗の登録情報をもとに比較できます。",
      "体験入店では話しやすさを確認するのがポイントです。",
    ],
    beginnerHeading: "初めて北24条のスナック求人を見る方へ",
  }),
  "kita24jo/lounge": listing({
    key: "kita24jo/lounge",
    district: "24条",
    dbJobType: "ラウンジ",
    areaLabel: "北24条",
    jobLabel: "ラウンジ",
    compareIntro:
      "北24条のラウンジ求人を、時給・体験入店・送迎・シフト・未経験歓迎などの条件から比較できます。気になる求人は詳細ページで勤務時間や待遇を確認してください。",
    compareTips: [
      "時給だけでなく席での距離感と南北線の終電まで見ておくと続けやすくなります。White Night Jobでは掲載審査を通過した店舗の登録情報をもとに比較できます。",
      "体験入店では客席のテンポを確認するのがポイントです。",
    ],
    beginnerHeading: "初めて北24条のラウンジ求人を見る方へ",
  }),
  "kita24jo/new-club": listing({
    key: "kita24jo/new-club",
    district: "24条",
    dbJobType: "ニュークラ",
    areaLabel: "北24条",
    jobLabel: "ニュークラ",
    compareIntro:
      "北24条のニュークラ求人を、時給・各種バック・体験入店・ドレス・シフトなどの条件から比較できます。気になる求人は詳細ページで勤務時間や待遇を確認してください。",
    compareTips: [
      "時給だけでなくドレス準備と南北線での帰宅まで見ておくと続けやすくなります。White Night Jobでは掲載審査を通過した店舗の登録情報をもとに比較できます。",
      "体験入店では席の空気や教え方を確認するのがポイントです。",
    ],
    beginnerHeading: "初めて北24条のニュークラ求人を見る方へ",
  }),
  "teine/girlsbar": listing({
    key: "teine/girlsbar",
    district: "手稲",
    dbJobType: "ガールズバー",
    areaLabel: "手稲",
    jobLabel: "ガールズバー",
    compareIntro:
      "手稲のガールズバー求人を、時給・体験入店・送迎・シフト・未経験歓迎などの条件から比較できます。気になる求人は詳細ページで勤務時間や待遇を確認してください。",
    compareTips: [
      "時給だけでなくJRや車での帰り道、送迎の有無までセットで見ると続けやすいお店を選びやすくなります。White Night Jobでは掲載審査を通過した店舗の登録情報をもとに比較できます。",
      "西部は退勤時刻が負担になりやすいので、体入で終業後の流れも確かめてください。",
    ],
    beginnerHeading: "初めて手稲のガルバ求人を見る方へ",
  }),
  "teine/concept-cafe": listing({
    key: "teine/concept-cafe",
    district: "手稲",
    dbJobType: "コンカフェ",
    areaLabel: "手稲",
    jobLabel: "コンカフェ",
    compareIntro:
      "手稲のコンカフェ求人を、時給・衣装・世界観・体験入店・シフトなどの条件から比較できます。気になる求人は詳細ページで勤務時間や待遇を確認してください。",
    compareTips: [
      "世界観だけでなく、衣装の準備とJRでの帰宅が両立するかを見ておくと続けやすくなります。White Night Jobでは掲載審査を通過した店舗の登録情報をもとに比較できます。",
      "体験入店では指定衣装の動きやすさも確認ポイントです。",
    ],
    beginnerHeading: "初めて手稲のコンカフェ求人を見る方へ",
  }),
  "teine/snack": listing({
    key: "teine/snack",
    district: "手稲",
    dbJobType: "スナック",
    areaLabel: "手稲",
    jobLabel: "スナック",
    compareIntro:
      "手稲のスナック求人を、時給・体験入店・送迎・シフト・未経験歓迎などの条件から比較できます。気になる求人は詳細ページで勤務時間や待遇を確認してください。",
    compareTips: [
      "時給だけでなく、地元の常連さんとの距離感と車・JRでの帰宅をセットで見てください。White Night Jobでは掲載審査を通過した店舗の登録情報をもとに比較できます。",
      "体験入店では話しやすさを確認するのがポイントです。",
    ],
    beginnerHeading: "初めて手稲のスナック求人を見る方へ",
  }),
  "teine/lounge": listing({
    key: "teine/lounge",
    district: "手稲",
    dbJobType: "ラウンジ",
    areaLabel: "手稲",
    jobLabel: "ラウンジ",
    compareIntro:
      "手稲のラウンジ求人を、時給・体験入店・送迎・シフト・未経験歓迎などの条件から比較できます。気になる求人は詳細ページで勤務時間や待遇を確認してください。",
    compareTips: [
      "時給だけでなく席での距離感と帰宅手段まで見ておくと続けやすくなります。White Night Jobでは掲載審査を通過した店舗の登録情報をもとに比較できます。",
      "体験入店では客席のテンポを確認するのがポイントです。",
    ],
    beginnerHeading: "初めて手稲のラウンジ求人を見る方へ",
  }),
  "teine/new-club": listing({
    key: "teine/new-club",
    district: "手稲",
    dbJobType: "ニュークラ",
    areaLabel: "手稲",
    jobLabel: "ニュークラ",
    compareIntro:
      "手稲のニュークラ求人を、時給・各種バック・体験入店・ドレス・シフトなどの条件から比較できます。気になる求人は詳細ページで勤務時間や待遇を確認してください。",
    compareTips: [
      "時給だけでなくドレス準備とJRでの帰宅まで見ておくと続けやすくなります。White Night Jobでは掲載審査を通過した店舗の登録情報をもとに比較できます。",
      "体験入店では席の空気や教え方を確認するのがポイントです。",
    ],
    beginnerHeading: "初めて手稲のニュークラ求人を見る方へ",
  }),
};

export function getDistrictComparisonListing(
  areaSlug?: string,
  jobTypeSlug?: string,
) {
  if (!areaSlug || !jobTypeSlug) return undefined;
  return DISTRICT_COMPARISON_LISTINGS[`${areaSlug}/${jobTypeSlug}`];
}

export function buildDistrictComparisonFilterLinks(
  listingCopy: DistrictComparisonListingCopy,
  presentComparisonBenefits: string[],
) {
  return SEO_GIRLSBAR_FILTER_DEFS.filter((def) =>
    presentComparisonBenefits.includes(def.match),
  ).map((def) => ({
    label: def.label,
    href: buildSeoBenefitFilterHref({
      district: listingCopy.district,
      jobType: listingCopy.dbJobType,
      benefit: def.match,
    }),
  }));
}
