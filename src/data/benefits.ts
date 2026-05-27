export const BENEFIT_CATEGORIES = [
  {
    title: "お給料",
    items: ["日払いOK", "バックあり", "罰金なし", "ノルマなし", "手渡しOK"],
  },
  {
    title: "身なり",
    items: [
      "衣装レンタルあり",
      "私服OK",
      "派手な髪色OK",
      "ピアスOK",
      "タトゥーOK",
      "ネイルOK",
    ],
  },
  {
    title: "環境",
    items: [
      "未経験者大歓迎",
      "経験者優遇",
      "友達と一緒に応募OK",
      "3時間以内の勤務OK",
      "週1出勤OK",
      "月1出勤OK",
      "日曜日営業",
      "終電上がりOK",
      "送迎あり",
      "交通費支給",
      "寮完備",
      "ロッカー完備",
      "お酒飲めなくてもOK",
      "Wワーク歓迎",
    ],
  },
] as const;

export function getBenefitCategoryGroups(benefits: string[]) {
  const categoryGroups: Array<{ title: string; items: string[] }> =
    BENEFIT_CATEGORIES.map((category) => ({
    title: category.title,
    items: category.items.filter((item) => benefits.includes(item)),
  })).filter((category) => category.items.length > 0);

  return categoryGroups;
}

export function getKnownBenefits(benefits: string[]) {
  const knownBenefits = new Set<string>(
    BENEFIT_CATEGORIES.flatMap((category) => [...category.items]),
  );

  return benefits.filter((benefit) => knownBenefits.has(benefit));
}

export function getUncategorizedBenefits(benefits: string[]) {
  const knownBenefits = new Set<string>(
    BENEFIT_CATEGORIES.flatMap((category) => [...category.items]),
  );

  return benefits.filter((benefit) => !knownBenefits.has(benefit));
}
