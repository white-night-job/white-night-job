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

    return NextResponse.json({
      job: rowToJob(jobRow),
      applicationRows,
      viewRows,
      applicationDetail: detail,
      viewCount,
    });
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "ダッシュボードの取得に失敗しました。") },
      { status: 500 },
    );
  }
}
