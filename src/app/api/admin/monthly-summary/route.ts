import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getAdminCache, setAdminCache } from "@/lib/admin-cache";
import { getErrorMessage } from "@/lib/api-error";
import { getJstMonthBounds, percentChange } from "@/lib/jst-month-bounds";
import { createSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const CACHE_TTL_MS = 20_000;
const CACHE_KEY = "admin:monthly-summary:v1";

async function countInRange(
  table: "job_views" | "job_applications",
  startIso: string,
  endIso: string,
): Promise<number> {
  const supabase = createSupabaseAdmin();
  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .gte("created_at", startIso)
    .lt("created_at", endIso);

  if (error) throw error;
  return count ?? 0;
}

export async function GET() {
  const startedAt = Date.now();
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ message: "ログインしてください。" }, { status: 401 });
  }

  const cached = getAdminCache<Record<string, unknown>>(CACHE_KEY);
  if (cached) {
    console.info("[admin/monthly-summary] cache-hit", {
      totalMs: Date.now() - startedAt,
    });
    return NextResponse.json({ ...cached, cache: "hit" });
  }

  try {
    const thisMonth = getJstMonthBounds(0);
    const lastMonth = getJstMonthBounds(-1);
    const supabase = createSupabaseAdmin();

    const [
      viewsThisMonth,
      viewsLastMonth,
      applicationsThisMonth,
      applicationsLastMonth,
      publishedResult,
    ] = await Promise.all([
      countInRange("job_views", thisMonth.startIso, thisMonth.endIso),
      countInRange("job_views", lastMonth.startIso, lastMonth.endIso),
      countInRange("job_applications", thisMonth.startIso, thisMonth.endIso),
      countInRange("job_applications", lastMonth.startIso, lastMonth.endIso),
      supabase
        .from("jobs")
        .select("id", { count: "exact", head: true })
        .eq("published", true),
    ]);

    if (publishedResult.error) throw publishedResult.error;

    const payload = {
      periodLabel: thisMonth.label,
      previousPeriodLabel: lastMonth.label,
      publishedJobCount: publishedResult.count ?? 0,
      views: {
        current: viewsThisMonth,
        previous: viewsLastMonth,
        changePercent: percentChange(viewsThisMonth, viewsLastMonth),
      },
      applications: {
        current: applicationsThisMonth,
        previous: applicationsLastMonth,
        changePercent: percentChange(
          applicationsThisMonth,
          applicationsLastMonth,
        ),
      },
    };

    setAdminCache(CACHE_KEY, payload, CACHE_TTL_MS);
    console.info("[admin/monthly-summary]", {
      totalMs: Date.now() - startedAt,
      cache: "miss",
    });

    return NextResponse.json({ ...payload, cache: "miss" });
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "月間集計の取得に失敗しました。") },
      { status: 500 },
    );
  }
}
