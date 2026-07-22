import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getErrorMessage } from "@/lib/api-error";
import { getJstMonthBounds, percentChange } from "@/lib/jst-month-bounds";
import { createSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

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
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ message: "ログインしてください。" }, { status: 401 });
  }

  try {
    const thisMonth = getJstMonthBounds(0);
    const lastMonth = getJstMonthBounds(-1);

    const [
      viewsThisMonth,
      viewsLastMonth,
      applicationsThisMonth,
      applicationsLastMonth,
      publishedCount,
    ] = await Promise.all([
      countInRange("job_views", thisMonth.startIso, thisMonth.endIso),
      countInRange("job_views", lastMonth.startIso, lastMonth.endIso),
      countInRange("job_applications", thisMonth.startIso, thisMonth.endIso),
      countInRange("job_applications", lastMonth.startIso, lastMonth.endIso),
      (async () => {
        const supabase = createSupabaseAdmin();
        const { count, error } = await supabase
          .from("jobs")
          .select("id", { count: "exact", head: true })
          .eq("published", true);
        if (error) throw error;
        return count ?? 0;
      })(),
    ]);

    return NextResponse.json({
      periodLabel: thisMonth.label,
      previousPeriodLabel: lastMonth.label,
      publishedJobCount: publishedCount,
      views: {
        current: viewsThisMonth,
        previous: viewsLastMonth,
        changePercent: percentChange(viewsThisMonth, viewsLastMonth),
      },
      applications: {
        current: applicationsThisMonth,
        previous: applicationsLastMonth,
        changePercent: percentChange(applicationsThisMonth, applicationsLastMonth),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "月間集計の取得に失敗しました。") },
      { status: 500 },
    );
  }
}
