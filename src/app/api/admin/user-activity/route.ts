import { NextResponse } from "next/server";
import {
  availableMetric,
  getUserActivityPeriodRange,
  parseUserActivityPeriod,
  unavailableMetric,
  type UserActivityShopStat,
} from "@/lib/admin-user-activity";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getErrorMessage } from "@/lib/api-error";
import { JOB_DIAGNOSIS_COMPLETED } from "@/lib/job-diagnosis-events";
import { isUserActivityTableMissing } from "@/lib/user-activity-events";
import { createSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const SHOP_STATS_LIMIT = 50;
const FETCH_ERROR_NOTE = "データを取得できませんでした";

type JobMeta = {
  shop_name: string | null;
  district: string | null;
  area: string | null;
};

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ message: "ログインしてください。" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const period = parseUserActivityPeriod(searchParams.get("period"));
    const range = getUserActivityPeriodRange(period, {
      from: searchParams.get("from"),
      to: searchParams.get("to"),
    });
    const { startIso, endIso, label } = range;
    const supabase = createSupabaseAdmin();

    const [
      siteVisitsResult,
      viewsCountResult,
      lineCountResult,
      phoneCountResult,
      diagnosisCountResult,
      reportsCountResult,
      allViewsResult,
      allAppsResult,
    ] = await Promise.all([
      supabase
        .from("user_activity_events")
        .select("id", { count: "exact", head: true })
        .eq("event_type", "site_visit")
        .gte("created_at", startIso)
        .lt("created_at", endIso),
      supabase
        .from("job_views")
        .select("id", { count: "exact", head: true })
        .gte("created_at", startIso)
        .lt("created_at", endIso),
      supabase
        .from("job_applications")
        .select("id", { count: "exact", head: true })
        .eq("type", "line")
        .gte("created_at", startIso)
        .lt("created_at", endIso),
      supabase
        .from("job_applications")
        .select("id", { count: "exact", head: true })
        .eq("type", "phone")
        .gte("created_at", startIso)
        .lt("created_at", endIso),
      supabase
        .from("job_diagnosis_events")
        .select("id", { count: "exact", head: true })
        .eq("event_type", JOB_DIAGNOSIS_COMPLETED)
        .gte("occurred_at", startIso)
        .lt("occurred_at", endIso),
      supabase
        .from("reports")
        .select("id", { count: "exact", head: true })
        .gte("created_at", startIso)
        .lt("created_at", endIso),
      supabase
        .from("job_views")
        .select("job_id")
        .gte("created_at", startIso)
        .lt("created_at", endIso),
      supabase
        .from("job_applications")
        .select("job_id, type")
        .gte("created_at", startIso)
        .lt("created_at", endIso),
    ]);

    const siteVisitsTableMissing =
      Boolean(siteVisitsResult.error) &&
      isUserActivityTableMissing(siteVisitsResult.error);
    if (siteVisitsResult.error && !siteVisitsTableMissing) {
      throw siteVisitsResult.error;
    }

    if (viewsCountResult.error) throw viewsCountResult.error;
    if (lineCountResult.error) throw lineCountResult.error;
    if (phoneCountResult.error) throw phoneCountResult.error;
    if (reportsCountResult.error) throw reportsCountResult.error;
    if (allViewsResult.error) throw allViewsResult.error;
    if (allAppsResult.error) throw allAppsResult.error;

    const diagnosisTableMissing =
      Boolean(diagnosisCountResult.error) &&
      /job_diagnosis_events|schema cache|does not exist/i.test(
        diagnosisCountResult.error?.message ?? "",
      );
    if (diagnosisCountResult.error && !diagnosisTableMissing) {
      throw diagnosisCountResult.error;
    }

    const allViews = allViewsResult.data ?? [];
    const allApps = allAppsResult.data ?? [];

    const jobIds = new Set<string>();
    for (const row of allViews) {
      if (row.job_id) jobIds.add(row.job_id as string);
    }
    for (const row of allApps) {
      if (row.job_id) jobIds.add(row.job_id as string);
    }

    const jobIdList = [...jobIds];
    const jobMeta = new Map<string, JobMeta>();
    if (jobIdList.length > 0) {
      const { data: jobs, error: jobsError } = await supabase
        .from("jobs")
        .select("id, shop_name, district, area")
        .in("id", jobIdList);
      if (jobsError) throw jobsError;
      for (const job of jobs ?? []) {
        jobMeta.set(job.id as string, {
          shop_name: (job.shop_name as string | null) ?? null,
          district: (job.district as string | null) ?? null,
          area: (job.area as string | null) ?? null,
        });
      }
    }

    const viewsByJob = new Map<string, number>();
    for (const row of allViews) {
      const id = row.job_id as string;
      viewsByJob.set(id, (viewsByJob.get(id) ?? 0) + 1);
    }
    const appliesByJob = new Map<string, number>();
    for (const row of allApps) {
      const id = row.job_id as string;
      appliesByJob.set(id, (appliesByJob.get(id) ?? 0) + 1);
    }

    const shopStats: UserActivityShopStat[] = jobIdList
      .map((jobId) => {
        const meta = jobMeta.get(jobId);
        return {
          jobId,
          shopName: meta?.shop_name?.trim() || "（店舗名不明）",
          district: meta?.district ?? null,
          area: meta?.area ?? null,
          views: viewsByJob.get(jobId) ?? 0,
          applyClicks: appliesByJob.get(jobId) ?? 0,
        };
      })
      .filter((row) => row.views > 0 || row.applyClicks > 0)
      .sort(
        (a, b) =>
          b.views + b.applyClicks - (a.views + a.applyClicks) ||
          b.views - a.views,
      )
      .slice(0, SHOP_STATS_LIMIT);

    return NextResponse.json({
      period: {
        key: period,
        label,
        startIso,
        endIso,
      },
      summary: {
        siteVisits: siteVisitsTableMissing
          ? unavailableMetric(
              "サイト訪問の集計準備中です（マイグレーション後に反映）",
            )
          : availableMetric(
              siteVisitsResult.count ?? 0,
              "同一ユーザーの30分以内の再訪問は1回として集計",
            ),
        jobDetailViews: availableMetric(viewsCountResult.count ?? 0),
        lineClicks: availableMetric(lineCountResult.count ?? 0),
        phoneClicks: availableMetric(phoneCountResult.count ?? 0),
        diagnosisUses: diagnosisTableMissing
          ? unavailableMetric(
              "診断完了イベントの集計準備中です（マイグレーション後に反映）",
            )
          : availableMetric(
              diagnosisCountResult.count ?? 0,
              "職種診断を最後まで利用し、結果が表示された回数",
            ),
        aiChatUses: unavailableMetric("現在取得していません"),
        blackReports: availableMetric(reportsCountResult.count ?? 0),
      },
      shopStats,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: getErrorMessage(error, FETCH_ERROR_NOTE),
      },
      { status: 500 },
    );
  }
}
