import { NextResponse } from "next/server";
import {
  availableMetric,
  deviceTypeFromUserAgent,
  featureLabelFromEventType,
  getUserActivityPeriodRange,
  parseUserActivityPeriod,
  unavailableMetric,
  type UserActivityEvent,
  type UserActivityShopStat,
} from "@/lib/admin-user-activity";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getErrorMessage } from "@/lib/api-error";
import { createSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const RECENT_LIMIT = 80;
const SHOP_STATS_LIMIT = 50;

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
      viewsCountResult,
      lineCountResult,
      phoneCountResult,
      diagnosisCountResult,
      reportsCountResult,
      allViewsResult,
      allAppsResult,
      analyticsRowsResult,
      recentViewsResult,
      recentAppsResult,
      diagnosisRowsResult,
      reportRowsResult,
    ] = await Promise.all([
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
        .from("user_job_type_diagnoses")
        .select("id", { count: "exact", head: true })
        .gte("diagnosed_at", startIso)
        .lt("diagnosed_at", endIso),
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
      supabase
        .from("job_analytics_events")
        .select("id, job_id, event_type, created_at, user_agent, is_internal")
        .eq("is_internal", false)
        .gte("created_at", startIso)
        .lt("created_at", endIso)
        .order("created_at", { ascending: false })
        .limit(RECENT_LIMIT),
      supabase
        .from("job_views")
        .select("id, job_id, created_at, user_agent")
        .gte("created_at", startIso)
        .lt("created_at", endIso)
        .order("created_at", { ascending: false })
        .limit(RECENT_LIMIT),
      supabase
        .from("job_applications")
        .select("id, job_id, type, created_at")
        .gte("created_at", startIso)
        .lt("created_at", endIso)
        .order("created_at", { ascending: false })
        .limit(RECENT_LIMIT),
      supabase
        .from("user_job_type_diagnoses")
        .select("id, diagnosed_at")
        .gte("diagnosed_at", startIso)
        .lt("diagnosed_at", endIso)
        .order("diagnosed_at", { ascending: false })
        .limit(30),
      supabase
        .from("reports")
        .select("id, shop_name, area, created_at")
        .gte("created_at", startIso)
        .lt("created_at", endIso)
        .order("created_at", { ascending: false })
        .limit(30),
    ]);

    if (viewsCountResult.error) throw viewsCountResult.error;
    if (lineCountResult.error) throw lineCountResult.error;
    if (phoneCountResult.error) throw phoneCountResult.error;
    if (diagnosisCountResult.error) throw diagnosisCountResult.error;
    if (reportsCountResult.error) throw reportsCountResult.error;
    if (allViewsResult.error) throw allViewsResult.error;
    if (allAppsResult.error) throw allAppsResult.error;

    const allViews = allViewsResult.data ?? [];
    const allApps = allAppsResult.data ?? [];
    const analyticsAvailable = !analyticsRowsResult.error;
    const analyticsRows = analyticsAvailable ? analyticsRowsResult.data ?? [] : [];
    const recentViews = recentViewsResult.error
      ? []
      : recentViewsResult.data ?? [];
    const recentApps = recentAppsResult.error
      ? []
      : recentAppsResult.data ?? [];
    const diagnosisRows = diagnosisRowsResult.error
      ? []
      : diagnosisRowsResult.data ?? [];
    const reportRows = reportRowsResult.error ? [] : reportRowsResult.data ?? [];

    const jobIds = new Set<string>();
    for (const row of allViews) {
      if (row.job_id) jobIds.add(row.job_id as string);
    }
    for (const row of allApps) {
      if (row.job_id) jobIds.add(row.job_id as string);
    }
    for (const row of analyticsRows) {
      if (row.job_id) jobIds.add(row.job_id as string);
    }
    for (const row of recentViews) {
      if (row.job_id) jobIds.add(row.job_id as string);
    }
    for (const row of recentApps) {
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

    const recentEvents: UserActivityEvent[] = [];

    if (analyticsAvailable && analyticsRows.length > 0) {
      for (const row of analyticsRows) {
        const meta = jobMeta.get(row.job_id as string);
        recentEvents.push({
          id: `analytics-${row.id}`,
          at: row.created_at as string,
          feature: featureLabelFromEventType(String(row.event_type)),
          shopName: meta?.shop_name ?? null,
          district: meta?.district ?? null,
          area: meta?.area ?? null,
          deviceType: deviceTypeFromUserAgent(row.user_agent as string | null),
        });
      }
    } else {
      for (const row of recentViews) {
        const meta = jobMeta.get(row.job_id as string);
        recentEvents.push({
          id: `view-${row.id}`,
          at: row.created_at as string,
          feature: featureLabelFromEventType("job_view"),
          shopName: meta?.shop_name ?? null,
          district: meta?.district ?? null,
          area: meta?.area ?? null,
          deviceType: deviceTypeFromUserAgent(row.user_agent as string | null),
        });
      }
      for (const row of recentApps) {
        const meta = jobMeta.get(row.job_id as string);
        recentEvents.push({
          id: `app-${row.id}`,
          at: row.created_at as string,
          feature: featureLabelFromEventType(String(row.type)),
          shopName: meta?.shop_name ?? null,
          district: meta?.district ?? null,
          area: meta?.area ?? null,
          deviceType: null,
        });
      }
    }

    for (const row of diagnosisRows) {
      recentEvents.push({
        id: `diagnosis-${row.id}`,
        at: row.diagnosed_at as string,
        feature: featureLabelFromEventType("diagnosis"),
        shopName: null,
        district: null,
        area: null,
        deviceType: null,
      });
    }

    for (const row of reportRows) {
      recentEvents.push({
        id: `report-${row.id}`,
        at: row.created_at as string,
        feature: featureLabelFromEventType("black_report"),
        shopName: (row.shop_name as string | null) ?? null,
        district: null,
        area: (row.area as string | null) ?? null,
        deviceType: null,
      });
    }

    recentEvents.sort(
      (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
    );

    return NextResponse.json({
      period: {
        key: period,
        label,
        startIso,
        endIso,
      },
      summary: {
        siteVisits: unavailableMetric("現在取得していません"),
        jobDetailViews: availableMetric(viewsCountResult.count ?? 0),
        lineClicks: availableMetric(lineCountResult.count ?? 0),
        phoneClicks: availableMetric(phoneCountResult.count ?? 0),
        diagnosisUses: availableMetric(
          diagnosisCountResult.count ?? 0,
          "マイページに保存された診断結果の件数です。診断利用の全件ではありません。",
        ),
        aiChatUses: unavailableMetric("現在取得していません"),
        blackReports: availableMetric(reportsCountResult.count ?? 0),
      },
      shopStats,
      recentEvents: recentEvents.slice(0, RECENT_LIMIT),
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "女の子利用状況の取得に失敗しました。",
        ),
      },
      { status: 500 },
    );
  }
}
