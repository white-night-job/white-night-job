import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/api-error";
import {
  buildApplicationDetails,
  fetchApplicationRows,
  type ApplicationRow,
} from "@/lib/job-applications";
import { rowToJob } from "@/lib/job-db";
import { getAuthenticatedShopJobId } from "@/lib/shop-auth";
import {
  calculateDistrictRank,
  countTodayBoosts,
  DAILY_BOOST_LIMIT,
  fetchBoostStatsForJobs,
} from "@/lib/shop-boosts";
import {
  countMatchingNewJobRecipients,
  countMatchingPickupRecipients,
} from "@/lib/line-auto-notify";
import {
  aggregateViewCounts,
  fetchViewRows,
  type ViewRow,
} from "@/lib/job-views";
import { createSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const jobId = await getAuthenticatedShopJobId();
  if (!jobId) {
    return NextResponse.json({ message: "ログインしてください。" }, { status: 401 });
  }

  try {
    const supabase = createSupabaseAdmin();
    const { data: jobRow, error: jobError } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .maybeSingle();

    if (jobError) throw jobError;
    if (!jobRow) {
      return NextResponse.json({ message: "求人が見つかりません。" }, { status: 404 });
    }

    let applicationRows: ApplicationRow[] = [];
    let viewRows: ViewRow[] = [];

    try {
      const [allApplications, allViews] = await Promise.all([
        fetchApplicationRows(supabase),
        fetchViewRows(supabase),
      ]);
      applicationRows = allApplications.filter((row) => row.job_id === jobId);
      viewRows = allViews.filter((row) => row.job_id === jobId);
    } catch {
      applicationRows = [];
      viewRows = [];
    }

    const details = buildApplicationDetails(applicationRows);
    const detail = details[jobId] ?? {
      line: 0,
      phone: 0,
      total: 0,
      latestAt: null,
      history: [],
    };
    const viewCount = aggregateViewCounts(viewRows)[jobId] ?? 0;
    const job = rowToJob(jobRow);

    let districtRank = 1;
    let districtTotal = 1;
    let boostRemaining = DAILY_BOOST_LIMIT;
    const boostLimit = DAILY_BOOST_LIMIT;

    try {
      const { data: districtRows, error: districtError } = await supabase
        .from("jobs")
        .select("id, created_at")
        .eq("published", true)
        .eq("district", job.district);

      if (districtError) throw districtError;

      const districtJobs = districtRows ?? [];
      const boostMap = await fetchBoostStatsForJobs(
        supabase,
        districtJobs.map((row) => row.id),
      );
      const rankInfo = calculateDistrictRank(jobId, districtJobs, boostMap);
      districtRank = rankInfo.rank;
      districtTotal = rankInfo.total;

      const todayBoostCount = await countTodayBoosts(supabase, jobId);
      boostRemaining = Math.max(0, DAILY_BOOST_LIMIT - todayBoostCount);
    } catch {
      districtRank = 1;
      districtTotal = 1;
      boostRemaining = DAILY_BOOST_LIMIT;
    }

    let newJobNotifyCount = 0;
    let pickupNotifyCount = 0;
    try {
      [newJobNotifyCount, pickupNotifyCount] = await Promise.all([
        countMatchingNewJobRecipients(job),
        countMatchingPickupRecipients(job),
      ]);
    } catch (error) {
      console.error("[shop-dashboard] notify count failed", error);
    }

    return NextResponse.json({
      job,
      applicationRows,
      viewRows,
      applicationDetail: detail,
      viewCount,
      districtRank,
      districtTotal,
      boostRemaining,
      boostLimit,
      newJobNotifyCount,
      pickupNotifyCount,
    });
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "ダッシュボードの取得に失敗しました。") },
      { status: 500 },
    );
  }
}
