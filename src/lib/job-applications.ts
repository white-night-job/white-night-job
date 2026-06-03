import type { SupabaseClient } from "@supabase/supabase-js";
import { FIXED_AREA, type District, type Job } from "@/types/job";

export type JobApplicationType = "line" | "phone";

export type ApplicationRow = {
  job_id: string;
  type: string;
  created_at: string;
};

export type JobApplicationCounts = {
  line: number;
  phone: number;
  total: number;
};

export type JobApplicationHistoryItem = {
  type: JobApplicationType;
  createdAt: string;
};

export type JobApplicationDetail = JobApplicationCounts & {
  latestAt: string | null;
  history: JobApplicationHistoryItem[];
};

export type MonthlyApplicationBucket = {
  monthKey: string;
  label: string;
  line: number;
  phone: number;
  total: number;
};

export type DailyApplicationBucket = {
  day: number;
  label: string;
  line: number;
  phone: number;
  total: number;
};

export type MonthOption = {
  value: string;
  label: string;
};

export const REGION_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "すべて" },
  { value: FIXED_AREA, label: FIXED_AREA },
  { value: "すすきの", label: "すすきの" },
  { value: "琴似", label: "琴似" },
  { value: "24条", label: "24条" },
  { value: "手稲", label: "手稲" },
];

export function emptyApplicationCounts(): JobApplicationCounts {
  return { line: 0, phone: 0, total: 0 };
}

export function emptyApplicationDetail(): JobApplicationDetail {
  return { ...emptyApplicationCounts(), latestAt: null, history: [] };
}

export function getApplicationTypeLabel(type: JobApplicationType): string {
  return type === "line" ? "LINE応募" : "電話応募";
}

export function formatApplicationDateTime(iso: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

function katakanaToHiragana(text: string): string {
  return text.replace(/[\u30a1-\u30f6]/g, (char) =>
    String.fromCharCode(char.charCodeAt(0) - 0x60),
  );
}

export function normalizeForSearch(text: string): string {
  return katakanaToHiragana(text.normalize("NFKC").toLowerCase());
}

export function matchesShopSearch(shopName: string, query: string): boolean {
  const trimmed = query.trim();
  if (!trimmed) return true;
  return normalizeForSearch(shopName).includes(normalizeForSearch(trimmed));
}

export function matchesRegionFilter(
  job: Pick<Job, "area" | "district">,
  regionFilter: string,
): boolean {
  if (regionFilter === "all") return true;
  if (regionFilter === FIXED_AREA) return job.area === FIXED_AREA;
  return job.district === (regionFilter as District);
}

function getJstYearMonth(date: Date): { year: number; month: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "numeric",
  }).formatToParts(date);

  return {
    year: Number(parts.find((part) => part.type === "year")?.value ?? "0"),
    month: Number(parts.find((part) => part.type === "month")?.value ?? "0"),
  };
}

export function getJstMonthKey(iso: string): string {
  const { year, month } = getJstYearMonth(new Date(iso));
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-");
  return `${year}年${Number(month)}月`;
}

export function getCurrentJstMonthKey(referenceDate = new Date()): string {
  const { year, month } = getJstYearMonth(referenceDate);
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function getJstDay(iso: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    day: "numeric",
  }).formatToParts(new Date(iso));

  return Number(parts.find((part) => part.type === "day")?.value ?? "0");
}

export function getDaysInMonth(monthKey: string): number {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month, 0).getDate();
}

export function buildSelectableMonthOptions(
  referenceDate = new Date(),
): MonthOption[] {
  return buildLast12MonthKeys(referenceDate)
    .slice()
    .reverse()
    .map((monthKey) => ({
      value: monthKey,
      label: formatMonthLabel(monthKey),
    }));
}

export function aggregateDailyApplicationsForJob(
  rows: ApplicationRow[],
  jobId: string,
  monthKey: string,
): DailyApplicationBucket[] {
  const daysInMonth = getDaysInMonth(monthKey);
  const buckets: DailyApplicationBucket[] = Array.from(
    { length: daysInMonth },
    (_, index) => {
      const day = index + 1;
      return {
        day,
        label: `${day}日`,
        line: 0,
        phone: 0,
        total: 0,
      };
    },
  );

  for (const row of rows) {
    if (row.job_id !== jobId) continue;
    if (row.type !== "line" && row.type !== "phone") continue;
    if (getJstMonthKey(row.created_at) !== monthKey) continue;

    const day = getJstDay(row.created_at);
    const bucket = buckets[day - 1];
    if (!bucket) continue;

    if (row.type === "line") bucket.line += 1;
    else bucket.phone += 1;
    bucket.total = bucket.line + bucket.phone;
  }

  return buckets;
}

export function hasApplicationsInMonth(
  buckets: DailyApplicationBucket[],
): boolean {
  return buckets.some((bucket) => bucket.total > 0);
}

export function buildLast12MonthKeys(referenceDate = new Date()): string[] {
  const { year, month } = getJstYearMonth(referenceDate);
  const keys: string[] = [];

  for (let offset = 11; offset >= 0; offset -= 1) {
    let targetMonth = month - offset;
    let targetYear = year;

    while (targetMonth < 1) {
      targetMonth += 12;
      targetYear -= 1;
    }

    keys.push(`${targetYear}-${String(targetMonth).padStart(2, "0")}`);
  }

  return keys;
}

export function aggregateMonthlyApplications(
  rows: ApplicationRow[],
  jobIds: Set<string> | null,
): MonthlyApplicationBucket[] {
  const monthKeys = buildLast12MonthKeys();
  const buckets = new Map<string, MonthlyApplicationBucket>(
    monthKeys.map((monthKey) => [
      monthKey,
      {
        monthKey,
        label: formatMonthLabel(monthKey),
        line: 0,
        phone: 0,
        total: 0,
      },
    ]),
  );

  for (const row of rows) {
    if (jobIds && !jobIds.has(row.job_id)) continue;
    if (row.type !== "line" && row.type !== "phone") continue;

    const bucket = buckets.get(getJstMonthKey(row.created_at));
    if (!bucket) continue;

    if (row.type === "line") bucket.line += 1;
    else bucket.phone += 1;
    bucket.total = bucket.line + bucket.phone;
  }

  return monthKeys.map((monthKey) => buckets.get(monthKey)!);
}

export function buildApplicationDetails(
  rows: ApplicationRow[],
): Record<string, JobApplicationDetail> {
  const details: Record<string, JobApplicationDetail> = {};

  for (const row of rows) {
    if (row.type !== "line" && row.type !== "phone") continue;
    const current = details[row.job_id] ?? emptyApplicationDetail();

    if (row.type === "line") current.line += 1;
    else current.phone += 1;
    current.total = current.line + current.phone;

    current.history.push({
      type: row.type,
      createdAt: row.created_at,
    });

    if (!current.latestAt || row.created_at > current.latestAt) {
      current.latestAt = row.created_at;
    }

    details[row.job_id] = current;
  }

  for (const detail of Object.values(details)) {
    detail.history.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  return details;
}

export function aggregateApplicationCounts(
  rows: Pick<ApplicationRow, "job_id" | "type">[],
): Record<string, JobApplicationCounts> {
  const stats: Record<string, JobApplicationCounts> = {};

  for (const row of rows) {
    if (row.type !== "line" && row.type !== "phone") continue;
    const current = stats[row.job_id] ?? emptyApplicationCounts();
    if (row.type === "line") current.line += 1;
    else current.phone += 1;
    current.total = current.line + current.phone;
    stats[row.job_id] = current;
  }

  return stats;
}

export async function fetchApplicationRows(
  supabase: SupabaseClient,
): Promise<ApplicationRow[]> {
  const { data, error } = await supabase
    .from("job_applications")
    .select("job_id, type, created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function fetchApplicationStats(
  supabase: SupabaseClient,
): Promise<Record<string, JobApplicationCounts>> {
  const rows = await fetchApplicationRows(supabase);
  return aggregateApplicationCounts(rows);
}

export async function fetchApplicationDetails(
  supabase: SupabaseClient,
): Promise<Record<string, JobApplicationDetail>> {
  const rows = await fetchApplicationRows(supabase);
  return buildApplicationDetails(rows);
}

export function fillApplicationStatsForJobs(
  jobs: { id: string }[],
  stats: Record<string, JobApplicationCounts>,
): Record<string, JobApplicationCounts> {
  const filled = { ...stats };
  for (const job of jobs) {
    if (!filled[job.id]) {
      filled[job.id] = emptyApplicationCounts();
    }
  }
  return filled;
}

export function fillApplicationDetailsForJobs(
  jobs: { id: string }[],
  details: Record<string, JobApplicationDetail>,
): Record<string, JobApplicationDetail> {
  const filled = { ...details };
  for (const job of jobs) {
    if (!filled[job.id]) {
      filled[job.id] = emptyApplicationDetail();
    }
  }
  return filled;
}

export async function recordJobApplication(
  jobId: string,
  type: JobApplicationType,
): Promise<void> {
  try {
    await fetch(`/api/jobs/${jobId}/applications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    });
  } catch {
    // 記録失敗時も応募導線は継続する
  }
}
