import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildLast12MonthKeys,
  formatMonthLabel,
  getDaysInMonth,
  getJstDay,
  getJstMonthKey,
} from "@/lib/job-applications";

export type ViewRow = {
  job_id: string;
  created_at: string;
};

export type MonthlyViewBucket = {
  monthKey: string;
  label: string;
  views: number;
};

export type DailyViewBucket = {
  day: number;
  label: string;
  views: number;
};

export function aggregateViewCounts(rows: ViewRow[]): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const row of rows) {
    counts[row.job_id] = (counts[row.job_id] ?? 0) + 1;
  }

  return counts;
}

export function fillViewCountsForJobs(
  jobs: { id: string }[],
  counts: Record<string, number>,
): Record<string, number> {
  return Object.fromEntries(jobs.map((job) => [job.id, counts[job.id] ?? 0]));
}

export function aggregateMonthlyViews(
  rows: ViewRow[],
  jobIds: Set<string> | null,
): MonthlyViewBucket[] {
  const monthKeys = buildLast12MonthKeys();
  const buckets = new Map<string, MonthlyViewBucket>(
    monthKeys.map((monthKey) => [
      monthKey,
      {
        monthKey,
        label: formatMonthLabel(monthKey),
        views: 0,
      },
    ]),
  );

  for (const row of rows) {
    if (jobIds && !jobIds.has(row.job_id)) continue;

    const bucket = buckets.get(getJstMonthKey(row.created_at));
    if (!bucket) continue;

    bucket.views += 1;
  }

  return monthKeys.map((monthKey) => buckets.get(monthKey)!);
}

export function aggregateMonthlyViewsForJob(
  rows: ViewRow[],
  jobId: string,
): MonthlyViewBucket[] {
  return aggregateMonthlyViews(
    rows.filter((row) => row.job_id === jobId),
    null,
  );
}

export function aggregateDailyViewsForJob(
  rows: ViewRow[],
  jobId: string,
  monthKey: string,
): DailyViewBucket[] {
  const daysInMonth = getDaysInMonth(monthKey);
  const buckets: DailyViewBucket[] = Array.from(
    { length: daysInMonth },
    (_, index) => {
      const day = index + 1;
      return {
        day,
        label: `${day}日`,
        views: 0,
      };
    },
  );

  for (const row of rows) {
    if (row.job_id !== jobId) continue;
    if (getJstMonthKey(row.created_at) !== monthKey) continue;

    const day = getJstDay(row.created_at);
    const bucket = buckets[day - 1];
    if (!bucket) continue;

    bucket.views += 1;
  }

  return buckets;
}

export function hasViewsInMonth(buckets: DailyViewBucket[]): boolean {
  return buckets.some((bucket) => bucket.views > 0);
}

export type FetchViewRowsResult = {
  rows: ViewRow[];
  error: string | null;
};

export async function fetchViewRowsWithStatus(
  supabase: SupabaseClient,
): Promise<FetchViewRowsResult> {
  const { data, error } = await supabase
    .from("job_views")
    .select("job_id, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("job_views fetch failed:", error.message);
    return { rows: [], error: error.message };
  }

  return { rows: data ?? [], error: null };
}

export async function fetchViewRows(
  supabase: SupabaseClient,
): Promise<ViewRow[]> {
  const { rows } = await fetchViewRowsWithStatus(supabase);
  return rows;
}
