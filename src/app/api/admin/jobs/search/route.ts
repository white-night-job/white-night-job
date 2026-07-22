import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getErrorMessage } from "@/lib/api-error";
import {
  buildApplicationDetails,
  emptyApplicationDetail,
  matchesRegionFilter,
  matchesShopSearch,
} from "@/lib/job-applications";
import { rowToJob } from "@/lib/job-db";
import { aggregateViewCounts } from "@/lib/job-views";
import { FIXED_AREA, type District } from "@/types/job";
import { createSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ message: "ログインしてください。" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() ?? "";
    const region = searchParams.get("region")?.trim() || "all";
    const page = Math.max(1, Number(searchParams.get("page") ?? 1) || 1);
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, Number(searchParams.get("limit") ?? DEFAULT_LIMIT) || DEFAULT_LIMIT),
    );

    if (!q && region === "all") {
      return NextResponse.json({
        jobs: [],
        total: 0,
        page: 1,
        limit,
        hasMore: false,
        details: {},
        viewCounts: {},
        searched: false,
        message: "店舗名やエリアを入力して検索してください",
      });
    }

    const supabase = createSupabaseAdmin();
    let query = supabase
      .from("jobs")
      .select("*")
      .eq("published", true)
      .order("created_at", { ascending: false });

    if (region !== "all" && region !== FIXED_AREA) {
      query = query.eq("district", region as District);
    }

    const { data, error } = await query;
    if (error) throw error;

    let jobs = (data ?? []).map((row) =>
      rowToJob(row, { includeShopLoginPassword: true }),
    );

    jobs = jobs.filter(
      (job) =>
        matchesRegionFilter(job, region) && matchesShopSearch(job.shopName, q),
    );

    const total = jobs.length;
    const offset = (page - 1) * limit;
    const pageJobs = jobs.slice(offset, offset + limit);
    const pageIds = pageJobs.map((job) => job.id);

    let details: Record<string, ReturnType<typeof emptyApplicationDetail>> = {};
    let viewCounts: Record<string, number> = {};

    if (pageIds.length > 0) {
      const [{ data: appRows }, { data: viewRows }] = await Promise.all([
        supabase
          .from("job_applications")
          .select("job_id, type, created_at")
          .in("job_id", pageIds)
          .order("created_at", { ascending: false }),
        supabase
          .from("job_views")
          .select("job_id, created_at")
          .in("job_id", pageIds),
      ]);

      details = buildApplicationDetails(appRows ?? []);
      for (const id of pageIds) {
        if (!details[id]) details[id] = emptyApplicationDetail();
      }
      viewCounts = aggregateViewCounts(viewRows ?? []);
      for (const id of pageIds) {
        if (viewCounts[id] == null) viewCounts[id] = 0;
      }
    }

    return NextResponse.json({
      jobs: pageJobs,
      total,
      page,
      limit,
      hasMore: offset + pageJobs.length < total,
      details,
      viewCounts,
      searched: true,
    });
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "店舗検索に失敗しました。") },
      { status: 500 },
    );
  }
}
