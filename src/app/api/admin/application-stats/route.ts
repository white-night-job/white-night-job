import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getErrorMessage } from "@/lib/api-error";
import {
  emptyApplicationDetail,
  fetchApplicationDetails,
  fetchApplicationRows,
  fillApplicationDetailsForJobs,
} from "@/lib/job-applications";
import { rowToJob } from "@/lib/job-db";
import {
  aggregateViewCounts,
  fetchViewRowsWithStatus,
  fillViewCountsForJobs,
} from "@/lib/job-views";
import { createSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

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

    let rows: Awaited<ReturnType<typeof fetchApplicationRows>> = [];
    let filled: ReturnType<typeof fillApplicationDetailsForJobs> = {};

    try {
      const [fetchedRows, details] = await Promise.all([
        fetchApplicationRows(supabase),
        fetchApplicationDetails(supabase),
      ]);
      rows = fetchedRows;
      filled = fillApplicationDetailsForJobs(jobList, details);
    } catch {
      filled = Object.fromEntries(
        jobList.map((job) => [job.id, emptyApplicationDetail()]),
      );
    }

    const { rows: views, error: viewsError } =
      await fetchViewRowsWithStatus(supabase);
    const counts = fillViewCountsForJobs(
      jobList,
      aggregateViewCounts(views),
    );

    return NextResponse.json({
      details: filled,
      stats: filled,
      applicationRows: rows,
      viewRows: views,
      viewCounts: counts,
      ...(viewsError ? { viewFetchError: viewsError } : {}),
    });
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "応募数の取得に失敗しました。") },
      { status: 500 },
    );
  }
}
