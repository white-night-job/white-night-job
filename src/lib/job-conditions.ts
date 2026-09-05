import type { Job } from "@/types/job";

/** Benefit tags reused for condition display (no new DB columns). */
export const JOB_CONDITION_BENEFIT_MAP = [
  { benefit: "日払いOK", label: "日払い", display: "可能" },
  { benefit: "週1出勤OK", label: "週1日OK", display: "OK" },
  { benefit: "終電上がりOK", label: "終電上がり", display: "可能" },
  { benefit: "送迎あり", label: "送迎", display: "あり" },
  { benefit: "未経験者大歓迎", label: "未経験", display: "歓迎" },
  { benefit: "学生歓迎", label: "学生", display: "歓迎" },
  { benefit: "Wワーク歓迎", label: "Wワーク", display: "歓迎" },
  { benefit: "お酒飲めなくてもOK", label: "お酒NG", display: "OK" },
  { benefit: "ノルマなし", label: "ノルマ", display: "なし" },
  { benefit: "衣装レンタルあり", label: "衣装貸与", display: "あり" },
  { benefit: "バックあり", label: "バック", display: "あり" },
] as const;

export type JobConditionRow = {
  label: string;
  value: string;
};

function trimText(value: unknown): string {
  if (value == null) return "";
  return String(value).trim();
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item ?? "").trim()).filter(Boolean);
}

/** Build detail rows from dedicated columns + known benefit tags. Empty values omitted. */
export function buildJobConditionRows(job: Job): JobConditionRow[] {
  const rows: JobConditionRow[] = [];
  const benefits = new Set(asStringArray(job.benefits));

  const regular = trimText(job.regularHourlyPay);
  if (regular) rows.push({ label: "本入時給", value: regular });

  const trial = trimText(job.trialHourlyPay);
  if (trial) rows.push({ label: "体入時給", value: trial });

  const backDetails = trimText(job.backPayDetails);
  if (backDetails) {
    rows.push({ label: "各種バック", value: backDetails });
  } else if (benefits.has("バックあり")) {
    rows.push({ label: "各種バック", value: "あり" });
  }

  const payment = trimText(job.salaryPaymentMethod);
  if (payment) rows.push({ label: "給与支払方法", value: payment });

  const minDays = trimText(job.minWorkDays);
  if (minDays) rows.push({ label: "最低勤務日数", value: minDays });

  // Prefer shop-edited businessHours; fall back to work_hours.
  const workHours = trimText(job.businessHours) || trimText(job.workHours);
  if (workHours) rows.push({ label: "勤務時間", value: workHours });

  for (const item of JOB_CONDITION_BENEFIT_MAP) {
    if (item.benefit === "バックあり") continue; // handled above
    if (!benefits.has(item.benefit)) continue;
    rows.push({ label: item.label, value: item.display });
  }

  const costume = trimText(job.costumeUniform);
  if (costume) rows.push({ label: "衣装／制服", value: costume });

  const requirements = asStringArray(job.requirements);
  if (requirements.length > 0) {
    rows.push({ label: "応募資格", value: requirements.join("、") });
  }

  if (job.trialVisitAvailable === true) {
    rows.push({ label: "体験入店", value: "可能" });
  } else if (job.trialVisitAvailable === false) {
    rows.push({ label: "体験入店", value: "不可" });
  }

  const trialNotes = trimText(job.trialVisitNotes);
  if (trialNotes) {
    rows.push({ label: "体験入店の条件・注意事項", value: trialNotes });
  }

  return rows;
}

export function hasJobConditionRows(job: Job): boolean {
  return buildJobConditionRows(job).length > 0;
}
