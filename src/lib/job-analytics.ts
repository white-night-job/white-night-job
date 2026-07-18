import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildLast12MonthKeys,
  formatMonthLabel,
  getJstMonthKey,
} from "@/lib/job-applications";

export const ANALYTICS_EVENT_TYPES = [
  "job_impression",
  "job_detail_click",
  "line_click",
  "phone_click",
] as const;

export type AnalyticsEventType = (typeof ANALYTICS_EVENT_TYPES)[number];

export type AnalyticsPeriod =
  | "this_month"
  | "last_month"
  | "last_3_months"
  | "last_6_months"
  | "last_12_months";

export type AnalyticsCounts = {
  impressions: number;
  detailClicks: number;
  lineClicks: number;
  phoneClicks: number;
  applyTotal: number;
};

export type MonthlyAnalyticsBucket = {
  monthKey: string;
  label: string;
  impressions: number;
  detailClicks: number;
  lineClicks: number;
  phoneClicks: number;
};

export type InsertAnalyticsEventInput = {
  jobId: string;
  eventType: AnalyticsEventType;
  sessionId?: string | null;
  referrer?: string | null;
  userAgent?: string | null;
  isInternal?: boolean;
};

const TOKYO = "Asia/Tokyo";

export function isAnalyticsEventType(value: unknown): value is AnalyticsEventType {
  return (
    typeof value === "string" &&
    (ANALYTICS_EVENT_TYPES as readonly string[]).includes(value)
  );
}

function jstParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TOKYO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value ?? "0");
  return { year: get("year"), month: get("month"), day: get("day") };
}

function jstMonthStartIso(year: number, month: number): string {
  const mm = String(month).padStart(2, "0");
  return new Date(`${year}-${mm}-01T00:00:00+09:00`).toISOString();
}

function addMonths(year: number, month: number, delta: number) {
  const index = year * 12 + (month - 1) + delta;
  return {
    year: Math.floor(index / 12),
    month: (index % 12) + 1,
  };
}

/** Inclusive start, exclusive end (ISO). */
export function getAnalyticsPeriodRange(
  period: AnalyticsPeriod,
  now = new Date(),
): { startIso: string; endIso: string; label: string } {
  const { year, month } = jstParts(now);
  const thisStart = jstMonthStartIso(year, month);
  const next = addMonths(year, month, 1);
  const nextStart = jstMonthStartIso(next.year, next.month);
  const last = addMonths(year, month, -1);
  const lastStart = jstMonthStartIso(last.year, last.month);

  switch (period) {
    case "this_month":
      return { startIso: thisStart, endIso: nextStart, label: "今月" };
    case "last_month":
      return { startIso: lastStart, endIso: thisStart, label: "先月" };
    case "last_3_months": {
      const from = addMonths(year, month, -2);
      return {
        startIso: jstMonthStartIso(from.year, from.month),
        endIso: nextStart,
        label: "直近3か月",
      };
    }
    case "last_6_months": {
      const from = addMonths(year, month, -5);
      return {
        startIso: jstMonthStartIso(from.year, from.month),
        endIso: nextStart,
        label: "直近6か月",
      };
    }
    case "last_12_months":
    default: {
      const from = addMonths(year, month, -11);
      return {
        startIso: jstMonthStartIso(from.year, from.month),
        endIso: nextStart,
        label: "直近12か月",
      };
    }
  }
}

export function getPreviousComparableRange(
  period: AnalyticsPeriod,
  now = new Date(),
): { startIso: string; endIso: string } | null {
  if (period !== "this_month") return null;
  const { year, month } = jstParts(now);
  const last = addMonths(year, month, -1);
  const thisStart = jstMonthStartIso(year, month);
  return {
    startIso: jstMonthStartIso(last.year, last.month),
    endIso: thisStart,
  };
}

export function emptyAnalyticsCounts(): AnalyticsCounts {
  return {
    impressions: 0,
    detailClicks: 0,
    lineClicks: 0,
    phoneClicks: 0,
    applyTotal: 0,
  };
}

function countsFromRows(
  rows: Array<{ event_type: string }>,
): AnalyticsCounts {
  const counts = emptyAnalyticsCounts();
  for (const row of rows) {
    if (row.event_type === "job_impression") counts.impressions += 1;
    else if (row.event_type === "job_detail_click") counts.detailClicks += 1;
    else if (row.event_type === "line_click") counts.lineClicks += 1;
    else if (row.event_type === "phone_click") counts.phoneClicks += 1;
  }
  counts.applyTotal = counts.lineClicks + counts.phoneClicks;
  return counts;
}

export function percentChange(current: number, previous: number): number | null {
  if (previous <= 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 100);
}

export async function insertAnalyticsEvent(
  supabase: SupabaseClient,
  input: InsertAnalyticsEventInput,
): Promise<void> {
  const { error } = await supabase.from("job_analytics_events").insert({
    job_id: input.jobId,
    shop_id: input.jobId,
    event_type: input.eventType,
    session_id: input.sessionId?.trim() || null,
    referrer: input.referrer?.trim() || null,
    user_agent: input.userAgent?.trim() || null,
    is_internal: Boolean(input.isInternal),
  });

  if (error) {
    // Table may not exist yet before SQL migration — don't break UX.
    console.error("[analytics] insert failed:", {
      jobId: input.jobId,
      eventType: input.eventType,
      message: error.message,
      code: error.code,
    });
    throw error;
  }
}

export async function fetchJobAnalyticsCounts(
  supabase: SupabaseClient,
  jobId: string,
  startIso: string,
  endIso: string,
): Promise<AnalyticsCounts> {
  const { data, error } = await supabase
    .from("job_analytics_events")
    .select("event_type")
    .eq("job_id", jobId)
    .eq("is_internal", false)
    .gte("created_at", startIso)
    .lt("created_at", endIso);

  if (error) throw error;
  return countsFromRows((data ?? []) as Array<{ event_type: string }>);
}

export async function fetchJobMonthlyAnalytics(
  supabase: SupabaseClient,
  jobId: string,
): Promise<MonthlyAnalyticsBucket[]> {
  const monthKeys = buildLast12MonthKeys();
  const from = monthKeys[0];
  const startIso = `${from}-01T00:00:00+09:00`;

  const { data, error } = await supabase
    .from("job_analytics_events")
    .select("event_type, created_at")
    .eq("job_id", jobId)
    .eq("is_internal", false)
    .gte("created_at", new Date(startIso).toISOString());

  if (error) throw error;

  const buckets = new Map<string, MonthlyAnalyticsBucket>(
    monthKeys.map((monthKey) => [
      monthKey,
      {
        monthKey,
        label: formatMonthLabel(monthKey),
        impressions: 0,
        detailClicks: 0,
        lineClicks: 0,
        phoneClicks: 0,
      },
    ]),
  );

  for (const row of (data ?? []) as Array<{
    event_type: string;
    created_at: string;
  }>) {
    const bucket = buckets.get(getJstMonthKey(row.created_at));
    if (!bucket) continue;
    if (row.event_type === "job_impression") bucket.impressions += 1;
    else if (row.event_type === "job_detail_click") bucket.detailClicks += 1;
    else if (row.event_type === "line_click") bucket.lineClicks += 1;
    else if (row.event_type === "phone_click") bucket.phoneClicks += 1;
  }

  return monthKeys.map((key) => buckets.get(key)!);
}

/** Detect admin/shop dashboard sessions from Cookie header. */
export function isInternalAnalyticsRequest(request: Request): boolean {
  const cookie = request.headers.get("cookie") ?? "";
  return (
    /(?:^|;\s*)white-night-admin=/.test(cookie) ||
    /(?:^|;\s*)white-night-shop=/.test(cookie)
  );
}
