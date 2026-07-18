import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/api-error";
import {
  fetchJobAnalyticsCounts,
  fetchJobMonthlyAnalytics,
  getAnalyticsPeriodRange,
  getPreviousComparableRange,
  percentChange,
  type AnalyticsPeriod,
} from "@/lib/job-analytics";
import { getAuthenticatedShopJobId } from "@/lib/shop-auth";
import { createSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const PERIODS: AnalyticsPeriod[] = [
  "this_month",
  "last_month",
  "last_3_months",
  "last_6_months",
  "last_12_months",
];

function parsePeriod(raw: string | null): AnalyticsPeriod {
  if (raw && (PERIODS as string[]).includes(raw)) {
    return raw as AnalyticsPeriod;
  }
  return "this_month";
}

/**
 * Shop-only analytics. Always scoped to the authenticated shop's job_id.
 */
export async function GET(request: Request) {
  const jobId = await getAuthenticatedShopJobId();
  if (!jobId) {
    return NextResponse.json({ message: "ログインしてください。" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const period = parsePeriod(url.searchParams.get("period"));
    const range = getAnalyticsPeriodRange(period);
    const previousRange = getPreviousComparableRange(period);
    const supabase = createSupabaseAdmin();

    const [current, monthly] = await Promise.all([
      fetchJobAnalyticsCounts(supabase, jobId, range.startIso, range.endIso),
      fetchJobMonthlyAnalytics(supabase, jobId),
    ]);

    let previous = null;
    let changes = null;
    if (previousRange) {
      previous = await fetchJobAnalyticsCounts(
        supabase,
        jobId,
        previousRange.startIso,
        previousRange.endIso,
      );
      changes = {
        impressions: percentChange(current.impressions, previous.impressions),
        detailClicks: percentChange(current.detailClicks, previous.detailClicks),
        lineClicks: percentChange(current.lineClicks, previous.lineClicks),
        phoneClicks: percentChange(current.phoneClicks, previous.phoneClicks),
        applyTotal: percentChange(current.applyTotal, previous.applyTotal),
      };
    }

    return NextResponse.json({
      jobId,
      period,
      periodLabel: range.label,
      current,
      previous,
      changes,
      monthly,
    });
  } catch (error) {
    console.error("[shop-dashboard/analytics]", error);
    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "分析データの取得に失敗しました。テーブル未作成の場合は add-job-analytics-events.sql を実行してください。",
        ),
      },
      { status: 500 },
    );
  }
}
