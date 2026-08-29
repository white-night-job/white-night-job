/**
 * Comparison benefit labels on SEO listing cards (e.g. Susukino × girlsbar).
 * Only exact strings present on the job record are shown — never inferred.
 *
 * `match` = value stored in jobs.benefits / jobs.other_benefits
 * `label` = short UI label for scannability
 */
export const SEO_COMPARISON_BENEFIT_DEFS = [
  { match: "体験入店OK", label: "体入OK" },
  { match: "未経験者大歓迎", label: "未経験歓迎" },
  { match: "日払いOK", label: "日払い" },
  { match: "送迎あり", label: "送迎あり" },
  { match: "週1出勤OK", label: "週1日OK" },
  { match: "学生歓迎", label: "学生歓迎" },
  { match: "Wワーク歓迎", label: "Wワーク" },
  { match: "ノルマなし", label: "ノルマなし" },
  { match: "衣装レンタルあり", label: "衣装レンタルあり" },
  { match: "私服OK", label: "私服OK" },
] as const;

/** @deprecated Prefer SEO_COMPARISON_BENEFIT_DEFS; kept for any direct string checks. */
export const SEO_COMPARISON_BENEFIT_TAGS = SEO_COMPARISON_BENEFIT_DEFS.map(
  (d) => d.match,
);

export type JobComparisonBenefitTag = {
  match: string;
  label: string;
};

export function getJobComparisonBenefitTags(job: {
  benefits?: string[] | null;
  otherBenefits?: string[] | null;
}): JobComparisonBenefitTag[] {
  const pool = new Set([
    ...(job.benefits ?? []),
    ...(job.otherBenefits ?? []),
  ]);
  return SEO_COMPARISON_BENEFIT_DEFS.filter((def) => pool.has(def.match)).map(
    (def) => ({ match: def.match, label: def.label }),
  );
}
