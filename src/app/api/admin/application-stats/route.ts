import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getErrorMessage } from "@/lib/api-error";
import {
  emptyApplicationCounts,
  fetchApplicationStats,
  fillApplicationStatsForJobs,
} from "@/lib/job-applications";
import { rowToJob } from "@/lib/job-db";
import { createSupabaseAdmin } from "@/lib/supabase";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ message: "ログインしてください。" }, { status: 401 });
  }

  try {
    const supabase = createSupabaseAdmin();
    const { data: jobs, error: jobsError } = await supabase
      .from("jobs")
      .select("*")
      .eq("published", true)
      .order("created_at", { ascending: false });

    if (jobsError) throw jobsError;

    const jobList = (jobs ?? []).map(rowToJob);

    try {
      const stats = await fetchApplicationStats(supabase);
      return NextResponse.json({
        stats: fillApplicationStatsForJobs(jobList, stats),
      });
    } catch {
      return NextResponse.json({
        stats: Object.fromEntries(
          jobList.map((job) => [job.id, emptyApplicationCounts()]),
        ),
      });
    }
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "応募数の取得に失敗しました。") },
      { status: 500 },
    );
  }
}
