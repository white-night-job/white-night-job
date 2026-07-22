import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/api-error";
import { getAuthenticatedShopJobId } from "@/lib/shop-auth";
import {
  calculateDistrictRank,
  countTodayBoosts,
  DAILY_BOOST_LIMIT,
  fetchBoostStatsForJobs,
  insertShopBoost,
} from "@/lib/shop-boosts";
import { invalidateShopScopedCache } from "@/lib/shop-scoped-cache";
import { createSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const jobId = await getAuthenticatedShopJobId();
  if (!jobId) {
    return NextResponse.json({ message: "ログインしてください。" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    if (body && typeof body === "object" && "jobId" in body) {
      const requestedJobId = String((body as { jobId?: unknown }).jobId ?? "");
      if (requestedJobId && requestedJobId !== jobId) {
        return NextResponse.json(
          { message: "他店舗の上位表示は操作できません。" },
          { status: 403 },
        );
      }
    }

    const supabase = createSupabaseAdmin();
    const todayCount = await countTodayBoosts(supabase, jobId);
    if (todayCount >= DAILY_BOOST_LIMIT) {
      return NextResponse.json(
        {
          message: "本日の上位表示回数を使い切りました",
          boostRemaining: 0,
          boostLimit: DAILY_BOOST_LIMIT,
        },
        { status: 429 },
      );
    }

    await insertShopBoost(supabase, jobId);
    invalidateShopScopedCache(jobId);

    // Never mutate listing_priority / pickup / AI recommend / plan here.
    // Ranking within priority tier uses today's shop_boosts rows only.

    const { data: jobRow, error: jobError } = await supabase
      .from("jobs")
      .select("id, district, created_at")
      .eq("id", jobId)
      .maybeSingle();

    if (jobError) throw jobError;
    if (!jobRow) {
      return NextResponse.json({ message: "求人が見つかりません。" }, { status: 404 });
    }

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
    const { rank, total } = calculateDistrictRank(jobId, districtJobs, boostMap);
    const boostRemaining = DAILY_BOOST_LIMIT - todayCount - 1;

    return NextResponse.json({
      message: "上位表示を適用しました。",
      districtRank: rank,
      districtTotal: total,
      boostRemaining,
      boostLimit: DAILY_BOOST_LIMIT,
    });
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "上位表示の適用に失敗しました。") },
      { status: 500 },
    );
  }
}
