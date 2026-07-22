import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/api-error";
import {
  emptyApplicationDetail,
  fetchApplicationCountsForJob,
} from "@/lib/job-applications";
import { countViewsForJob } from "@/lib/job-views";
import { getAuthenticatedShopJobId } from "@/lib/shop-auth";
import {
  calculateDistrictRank,
  DAILY_BOOST_LIMIT,
  fetchBoostStatsForJobs,
} from "@/lib/shop-boosts";
import {
  getShopScopedCache,
  setShopScopedCache,
  shopDashboardMetricsCacheKey,
} from "@/lib/shop-scoped-cache";
import { createSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const METRICS_CACHE_TTL_MS = 12_000;

type MetricsPayload = {
  applicationDetail: ReturnType<typeof emptyApplicationDetail>;
  viewCount: number;
  districtRank: number;
  districtTotal: number;
  boostRemaining: number;
  boostLimit: number;
  district: string;
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

  const cacheKey = shopDashboardMetricsCacheKey(jobId);
  const cached = getShopScopedCache<MetricsPayload>(cacheKey, jobId);
  if (cached) {
    console.info("[shop-dashboard/metrics] cache-hit", {
      jobId,
      totalMs: Date.now() - startedAt,
    });
    return NextResponse.json({
      ...cached,
      cache: "hit",
      timings: { totalMs: Date.now() - startedAt, cache: "hit" },
    });
  }

  try {
    const supabase = createSupabaseAdmin();

    const districtStarted = Date.now();
    const { data: jobRow, error: jobError } = await supabase
      .from("jobs")
      .select("id, district")
      .eq("id", jobId)
      .maybeSingle();
    mark("jobMs", districtStarted);

    if (jobError) throw jobError;
    if (!jobRow) {
      return NextResponse.json({ message: "求人が見つかりません。" }, { status: 404 });
    }

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
      console.error("[shop-dashboard/metrics] counts failed", error);
    }
    mark("countsMs", metricsStarted);

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
        .eq("district", jobRow.district);

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
      console.error("[shop-dashboard/metrics] rank failed", error);
    }
    mark("rankMs", rankStarted);

    const payload: MetricsPayload = {
      applicationDetail,
      viewCount,
      districtRank,
      districtTotal,
      boostRemaining,
      boostLimit,
      district: jobRow.district,
    };

    setShopScopedCache(cacheKey, jobId, payload, METRICS_CACHE_TTL_MS);
    timings.totalMs = Date.now() - startedAt;
    console.info("[shop-dashboard/metrics]", { jobId, timings });

    return NextResponse.json({ ...payload, cache: "miss", timings });
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "数値の取得に失敗しました。") },
      { status: 500 },
    );
  }
}
