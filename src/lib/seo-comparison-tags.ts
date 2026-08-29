/**
 * Comparison benefit labels shown on SEO listing cards.
 * Only tags that exist on the job record are displayed — never inferred.
 */
export const SEO_COMPARISON_BENEFIT_TAGS = [
  "未経験者大歓迎",
  "体験入店OK",
  "日払いOK",
  "送迎あり",
  "週1出勤OK",
  "衣装レンタルあり",
  "私服OK",
  "バックあり",
  "Wワーク歓迎",
  "ノルマなし",
] as const;

export function getJobComparisonBenefitTags(job: {
  benefits?: string[] | null;
  otherBenefits?: string[] | null;
}): string[] {
  const pool = new Set([
    ...(job.benefits ?? []),
    ...(job.otherBenefits ?? []),
  ]);
  return SEO_COMPARISON_BENEFIT_TAGS.filter((tag) => pool.has(tag));
}
