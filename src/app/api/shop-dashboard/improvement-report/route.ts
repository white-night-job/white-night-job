import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getErrorMessage } from "@/lib/api-error";
import { getPlanFeatures, parseJobPlan } from "@/lib/job-plan";
import { getAuthenticatedShopJobId } from "@/lib/shop-auth";
import {
  getShopScopedCache,
  setShopScopedCache,
} from "@/lib/shop-scoped-cache";
import {
  buildShopImprovementReport,
  buildShopLightAnalyticsSummary,
  getReportMonthRanges,
  type ShopImprovementReport,
  type ShopLightAnalyticsSummary,
} from "@/lib/shop-improvement-report";
import { createSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/** 当月データの再集計は数時間単位で十分。求人更新時はキャッシュが破棄される。 */
const REPORT_CACHE_TTL_MS = 3 * 60 * 60 * 1000;

const REPORT_LOAD_ERROR_MESSAGE =
  "レポートを読み込めませんでした。時間をおいて再度お試しください";

/**
 * アクセス・応募分析・レポート。
 * - 店舗は自店舗（Cookie の job_id）のみ取得可能
 * - 管理者は ?jobId= で全店舗を確認可能
 * - プラン判定はサーバー側で行う。ライトには簡易集計（light）のみを返し、
 *   改善レポート（report）は返さない
 */
async function isAdminSafe(): Promise<boolean> {
  // ADMIN_PASSWORD 未設定の環境では例外になるため、店舗判定を止めない。
  try {
    return await isAdminAuthenticated();
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const shopJobId = await getAuthenticatedShopJobId();
  const isAdmin = await isAdminSafe();

  const requestedJobId = new URL(request.url).searchParams.get("jobId")?.trim();
  const jobId = isAdmin && requestedJobId ? requestedJobId : shopJobId;

  if (!jobId) {
    return NextResponse.json({ message: "ログインしてください。" }, { status: 401 });
  }
  if (!isAdmin && jobId !== shopJobId) {
    return NextResponse.json({ message: "権限がありません。" }, { status: 403 });
  }

  try {
    const supabase = createSupabaseAdmin();
    const { data: jobRow, error: jobError } = await supabase
      .from("jobs")
      .select("plan")
      .eq("id", jobId)
      .maybeSingle();

    if (jobError) throw jobError;
    if (!jobRow) {
      return NextResponse.json({ message: "求人が見つかりません。" }, { status: 404 });
    }

    const plan = parseJobPlan(jobRow.plan);
    const { monthKey } = getReportMonthRanges();

    // ライトは簡易集計のみ。改善レポート（詳細クリック・率・改善判定）は
    // サーバー側で返さないため、APIを直接呼んでも取得できない。
    if (!getPlanFeatures(plan).analytics) {
      const cacheKey = `shop-light-analytics:${jobId}:${monthKey}`;
      const cached = getShopScopedCache<ShopLightAnalyticsSummary>(
        cacheKey,
        jobId,
      );
      if (cached) {
        return NextResponse.json({ light: cached, cache: "hit" });
      }

      const light = await buildShopLightAnalyticsSummary(supabase, jobId, plan);
      setShopScopedCache(cacheKey, jobId, light, REPORT_CACHE_TTL_MS);
      return NextResponse.json({ light, cache: "miss" });
    }

    const cacheKey = `shop-improvement-report:${jobId}:${monthKey}:${plan}`;
    const cached = getShopScopedCache<ShopImprovementReport>(cacheKey, jobId);
    if (cached) {
      return NextResponse.json({ report: cached, cache: "hit" });
    }

    const report = await buildShopImprovementReport(supabase, jobId, plan);
    setShopScopedCache(cacheKey, jobId, report, REPORT_CACHE_TTL_MS);

    return NextResponse.json({ report, cache: "miss" });
  } catch (error) {
    // DBエラー等の詳細はサーバーログのみ。店舗側には固定の日本語メッセージを返す。
    console.error("[shop-dashboard/improvement-report]", {
      jobId,
      message: getErrorMessage(error, "unknown error"),
      error,
    });
    return NextResponse.json(
      { message: REPORT_LOAD_ERROR_MESSAGE },
      { status: 500 },
    );
  }
}
