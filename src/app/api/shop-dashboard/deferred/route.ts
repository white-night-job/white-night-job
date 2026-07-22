import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/api-error";
import {
  fetchApplicationRowsForJob,
  type ApplicationRow,
} from "@/lib/job-applications";
import { rowToJob } from "@/lib/job-db";
import { countMatchingNotifyRecipients } from "@/lib/line-auto-notify";
import { getAuthenticatedShopJobId } from "@/lib/shop-auth";
import { createSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function twelveMonthsAgoIso(): string {
  const date = new Date();
  date.setMonth(date.getMonth() - 12);
  return date.toISOString();
}

export async function GET() {
  const startedAt = Date.now();
  const timings: Record<string, number> = {};
  const jobId = await getAuthenticatedShopJobId();
  if (!jobId) {
    return NextResponse.json({ message: "ログインしてください。" }, { status: 401 });
  }

  try {
    const supabase = createSupabaseAdmin();

    const jobStarted = Date.now();
    const { data: jobRow, error: jobError } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .maybeSingle();
    timings.jobMs = Date.now() - jobStarted;

    if (jobError) throw jobError;
    if (!jobRow) {
      return NextResponse.json({ message: "求人が見つかりません。" }, { status: 404 });
    }

    const job = rowToJob(jobRow);

    let applicationRows: ApplicationRow[] = [];
    const appsStarted = Date.now();
    try {
      applicationRows = await fetchApplicationRowsForJob(supabase, jobId, {
        sinceIso: twelveMonthsAgoIso(),
      });
    } catch (error) {
      console.error("[shop-dashboard/deferred] applications failed", error);
      applicationRows = [];
    }
    timings.applicationsMs = Date.now() - appsStarted;

    let newJobNotifyCount = 0;
    let pickupNotifyCount = 0;
    const notifyStarted = Date.now();
    try {
      const counts = await countMatchingNotifyRecipients(job);
      newJobNotifyCount = counts.newJobNotifyCount;
      pickupNotifyCount = counts.pickupNotifyCount;
    } catch (error) {
      console.error("[shop-dashboard/deferred] notify count failed", error);
    }
    timings.notifyMs = Date.now() - notifyStarted;
    timings.totalMs = Date.now() - startedAt;
    console.info("[shop-dashboard/deferred]", { jobId, timings });

    return NextResponse.json({
      applicationRows,
      newJobNotifyCount,
      pickupNotifyCount,
      timings,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "追加データの取得に失敗しました。",
        ),
      },
      { status: 500 },
    );
  }
}
