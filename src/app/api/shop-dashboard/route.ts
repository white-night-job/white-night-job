import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/api-error";
import {
  emptyApplicationDetail,
  fetchApplicationCountsForJob,
} from "@/lib/job-applications";
import { rowToJob } from "@/lib/job-db";
import { getAuthenticatedShopJobId } from "@/lib/shop-auth";
import {
  calculateDistrictRank,
  DAILY_BOOST_LIMIT,
  fetchBoostStatsForJobs,
} from "@/lib/shop-boosts";
import {
  getShopScopedCache,
  invalidateShopScopedCache,
  setShopScopedCache,
  shopDashboardCoreCacheKey,
} from "@/lib/shop-scoped-cache";
import { countViewsForJob } from "@/lib/job-views";
import { createSupabaseAdmin } from "@/lib/supabase";
import type { Job } from "@/types/job";

export const dynamic = "force-dynamic";

const CORE_CACHE_TTL_MS = 12_000;

type CorePayload = {
  job: Job;
  applicationDetail: ReturnType<typeof emptyApplicationDetail>;
  viewCount: number;
  districtRank: number;
  districtTotal: number;
  boostRemaining: number;
  boostLimit: number;
  timings?: Record<string, number>;
};

export async function GET() {
  const startedAt = Date.now();
  const timings: Record<string, number> = {};
  const mark = (label: string, from: number) => {
    timings[label] = Date.now() - from;
  };

  const jobId = await getAuthenticatedShopJobId();
  if (!jobId) {
    return NextResponse.json({ message: "ログインしてください。" }, { status: 401 });
  }

  const cacheKey = shopDashboardCoreCacheKey(jobId);
  const cached = getShopScopedCache<CorePayload>(cacheKey, jobId);
  if (cached) {
    console.info("[shop-dashboard/core] cache-hit", {
      jobId,
      totalMs: Date.now() - startedAt,
    });
    return NextResponse.json({
      ...cached,
      applicationRows: [],
      viewRows: [],
      newJobNotifyCount: 0,
      pickupNotifyCount: 0,
      deferred: true,
      cache: "hit",
      timings: { totalMs: Date.now() - startedAt, cache: "hit" },
    });
  }

  try {
    const supabase = createSupabaseAdmin();

    const jobStarted = Date.now();
    const { data: jobRow, error: jobError } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .maybeSingle();
    mark("jobMs", jobStarted);

    if (jobError) throw jobError;
    if (!jobRow) {
      return NextResponse.json({ message: "求人が見つかりません。" }, { status: 404 });
    }

    const job = rowToJob(jobRow);

    const metricsStarted = Date.now();
    let applicationDetail = emptyApplicationDetail();
    let viewCount = 0;
    try {
      const [counts, views] = await Promise.all([
        fetchApplicationCountsForJob(supabase, jobId),
        countViewsForJob(supabase, jobId),
      ]);
      applicationDetail = {
        ...emptyApplicationDetail(),
        line: counts.line,
        phone: counts.phone,
        total: counts.total,
      };
      viewCount = views;
    } catch (error) {
      console.error("[shop-dashboard/core] metrics failed", error);
    }
    mark("metricsMs", metricsStarted);

    let districtRank = 1;
    let districtTotal = 1;
    let boostRemaining = DAILY_BOOST_LIMIT;
    const boostLimit = DAILY_BOOST_LIMIT;

    const rankStarted = Date.now();
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
      const todayBoostCount = boostMap[jobId]?.todayCount ?? 0;
      boostRemaining = Math.max(0, DAILY_BOOST_LIMIT - todayBoostCount);
    } catch (error) {
      console.error("[shop-dashboard/core] rank failed", error);
    }
    mark("rankMs", rankStarted);

    const payload: CorePayload = {
      job,
      applicationDetail,
      viewCount,
      districtRank,
      districtTotal,
      boostRemaining,
      boostLimit,
    };

    setShopScopedCache(cacheKey, jobId, payload, CORE_CACHE_TTL_MS);
    timings.totalMs = Date.now() - startedAt;
    console.info("[shop-dashboard/core]", { jobId, timings });

    return NextResponse.json({
      ...payload,
      applicationRows: [],
      viewRows: [],
      newJobNotifyCount: 0,
      pickupNotifyCount: 0,
      deferred: true,
      cache: "miss",
      timings,
    });
  } catch (error) {
    invalidateShopScopedCache(jobId);
    return NextResponse.json(
      { message: getErrorMessage(error, "ダッシュボードの取得に失敗しました。") },
      { status: 500 },
    );
  }
}
