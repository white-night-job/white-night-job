import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getErrorMessage } from "@/lib/api-error";
import {
  emptyApplicationDetail,
  fetchApplicationDetails,
  fillApplicationDetailsForJobs,
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
      const details = await fetchApplicationDetails(supabase);
      const filled = fillApplicationDetailsForJobs(jobList, details);
      return NextResponse.json({ details: filled, stats: filled });
    } catch {
      const empty = Object.fromEntries(
        jobList.map((job) => [job.id, emptyApplicationDetail()]),
      );
      return NextResponse.json({ details: empty, stats: empty });
    }
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "応募数の取得に失敗しました。") },
      { status: 500 },
    );
  }
}
