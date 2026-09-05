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

/** Filter chips on Susukino × girlsbar listing (label → jobs search). */
export const SEO_GIRLSBAR_FILTER_DEFS = [
  { match: "体験入店OK", label: "体入できる求人" },
  { match: "未経験者大歓迎", label: "未経験歓迎" },
  { match: "学生歓迎", label: "学生歓迎" },
  { match: "Wワーク歓迎", label: "Wワーク歓迎" },
  { match: "日払いOK", label: "日払い" },
  { match: "送迎あり", label: "送迎あり" },
  { match: "週1出勤OK", label: "週1日OK" },
  { match: "ノルマなし", label: "ノルマなし" },
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
  const benefits = Array.isArray(job.benefits) ? job.benefits : [];
  const otherBenefits = Array.isArray(job.otherBenefits)
    ? job.otherBenefits
    : [];
  const pool = new Set<string>([
    ...benefits.map((item) => String(item ?? "")),
    ...otherBenefits.map((item) => String(item ?? "")),
  ]);
  return SEO_COMPARISON_BENEFIT_DEFS.filter((def) => pool.has(def.match)).map(
    (def) => ({ match: def.match, label: def.label }),
  );
}

/** Which comparison benefit matches appear in a job set (exact DB strings only). */
export function collectPresentComparisonBenefits(
  jobs: Array<{
    benefits?: string[] | null;
    otherBenefits?: string[] | null;
  }>,
): string[] {
  const present = new Set<string>();
  for (const job of jobs) {
    for (const tag of getJobComparisonBenefitTags(job)) {
      present.add(tag.match);
    }
  }
  return SEO_COMPARISON_BENEFIT_DEFS.map((d) => d.match).filter((m) =>
    present.has(m),
  );
}

/**
 * 1–2 line feature blurb from DB only (benefits / intro / work hours).
 * Returns null when nothing usable exists.
 */
export function buildJobComparisonFeatureBlurb(job: {
  introductionText?: string | null;
  workHours?: string | null;
  benefits?: string[] | null;
  otherBenefits?: string[] | null;
}): string | null {
  const tags = getJobComparisonBenefitTags(job);
  if (tags.length > 0) {
    const labels = tags.slice(0, 4).map((t) => t.label);
    if (labels.length === 1) {
      return `${labels[0]}の記載がある求人です。`;
    }
    if (labels.length === 2) {
      return `${labels[0]}、${labels[1]}。掲載条件から比較できる求人です。`;
    }
    const head = labels.slice(0, -1).join("、");
    const tail = labels[labels.length - 1];
    return `${head}、${tail}など、条件を比較しやすい求人です。`;
  }

  const intro = job.introductionText?.trim().replace(/\s+/g, " ");
  if (intro) {
    return intro.length > 72 ? `${intro.slice(0, 70)}…` : intro;
  }

  const hours = job.workHours?.trim();
  if (hours) {
    return `勤務時間は${hours}です。`;
  }

  return null;
}

export function buildGirlsBarBenefitFilterHref(benefitMatch: string): string {
  return buildSeoBenefitFilterHref({
    district: "すすきの",
    jobType: "ガールズバー",
    benefit: benefitMatch,
  });
}

export function buildSeoBenefitFilterHref(params: {
  district: string;
  jobType: string;
  benefit: string;
}): string {
  const search = new URLSearchParams({
    district: params.district,
    jobType: params.jobType,
    benefit: params.benefit,
  });
  return `/jobs?${search.toString()}`;
}
