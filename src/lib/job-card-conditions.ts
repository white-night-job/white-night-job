import { getJobComparisonBenefitTags } from "@/lib/seo-comparison-tags";
import type { Job } from "@/types/job";

export type JobCardConditionRow = {
  label: string;
  value: string;
  /** Highlight pay fields */
  emphasize?: boolean;
  /** Full-width exclusive trial-pay banner on listing cards */
  variant?: "trialExclusive";
  /** Prominent amount only, e.g. ¥2,000〜 */
  amountDisplay?: string;
};

export type JobCardConditionTag = {
  key: string;
  label: string;
};

function trimText(value: unknown): string {
  if (value == null) return "";
  return String(value).trim();
}

/** Card-only display parts for trial hourly pay. */
function formatTrialHourlyPayForCard(raw: string): {
  value: string;
  amountDisplay: string;
} {
  const match = raw.match(/(\d[\d,]*)/);
  if (!match) {
    const cleaned = raw.replace(/^体入時給\s*/, "").trim();
    if (!cleaned) {
      return { value: "体入時給", amountDisplay: "" };
    }
    if (cleaned.startsWith("¥") || cleaned.startsWith("￥")) {
      return {
        value: `体入時給 ${cleaned}`,
        amountDisplay: cleaned,
      };
    }
    return {
      value: `体入時給 ¥${cleaned}`,
      amountDisplay: `¥${cleaned}`,
    };
  }

  const amount = Number(match[1].replace(/,/g, ""));
  const formatted = Number.isFinite(amount)
    ? amount.toLocaleString("ja-JP")
    : match[1];
  const amountDisplay = `¥${formatted}〜`;

  return {
    value: `体入時給 ${amountDisplay}`,
    amountDisplay,
  };
}

/**
 * Compact condition rows + tags for public JobCard.
 * Area / job type agnostic. Only real DB values — never invent placeholders.
 * Safe for null/undefined benefits and new optional columns.
 */
export function buildJobCardConditions(job: Job): {
  priorityRows: JobCardConditionRow[];
  tags: JobCardConditionTag[];
} {
  try {
    const priorityRows: JobCardConditionRow[] = [];

    // Listing cards: hide 本入時給. Keep generic 時給 only when 本入時給 is unset.
    const regular = trimText(job.regularHourlyPay);
    const salary = trimText(job.salary);
    if (!regular && salary) {
      priorityRows.push({
        label: "時給",
        value: salary,
        emphasize: true,
      });
    }

    const trial = trimText(job.trialHourlyPay);
    if (trial) {
      const trialDisplay = formatTrialHourlyPayForCard(trial);
      priorityRows.push({
        label: "体入ホワイトナイト限定！",
        value: trialDisplay.value,
        amountDisplay: trialDisplay.amountDisplay,
        emphasize: true,
        variant: "trialExclusive",
      });
    }

    const workHours = trimText(job.businessHours) || trimText(job.workHours);
    if (workHours) {
      priorityRows.push({ label: "勤務時間", value: workHours });
    }

    const minDays = trimText(job.minWorkDays);
    if (minDays) {
      priorityRows.push({ label: "最低勤務日数", value: minDays });
    }

    const benefitTags = getJobComparisonBenefitTags({
      benefits: Array.isArray(job.benefits) ? job.benefits : [],
      otherBenefits: Array.isArray(job.otherBenefits) ? job.otherBenefits : [],
    });
    const tags: JobCardConditionTag[] = [];
    const usedKeys = new Set<string>();

    const pushTag = (key: string, label: string) => {
      if (usedKeys.has(key) || usedKeys.has(label)) return;
      usedKeys.add(key);
      usedKeys.add(label);
      tags.push({ key, label });
    };

    for (const tag of benefitTags) {
      if (
        tag.match === "体験入店OK" &&
        typeof job.trialVisitAvailable === "boolean"
      ) {
        continue;
      }
      if (tag.match === "衣装レンタルあり" && trimText(job.costumeUniform)) {
        continue;
      }
      pushTag(tag.match, tag.label);
    }

    if (job.trialVisitAvailable === true) {
      pushTag("trial_visit_available:true", "体験入店可能");
    } else if (job.trialVisitAvailable === false) {
      pushTag("trial_visit_available:false", "体験入店不可");
    }

    const costume = trimText(job.costumeUniform);
    if (costume) {
      const short =
        costume.length > 18 ? `${costume.slice(0, 16)}…` : costume;
      pushTag("costume_uniform", `衣装：${short}`);
    }

    return { priorityRows, tags };
  } catch {
    return { priorityRows: [], tags: [] };
  }
}

export function hasJobCardConditions(job: Job): boolean {
  const { priorityRows, tags } = buildJobCardConditions(job);
  return priorityRows.length > 0 || tags.length > 0;
}
