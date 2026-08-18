import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getAdminCache, setAdminCache } from "@/lib/admin-cache";
import { getErrorMessage } from "@/lib/api-error";
import {
  buildApplicationDetails,
  emptyApplicationDetail,
  matchesRegionFilter,
  matchesShopSearch,
} from "@/lib/job-applications";
import { rowToJob } from "@/lib/job-db";
import { isJobPlan, type JobPlan } from "@/lib/job-plan";
import { aggregateViewCounts } from "@/lib/job-views";
import { migratePlaintextShopPasswordsInRows } from "@/lib/shop-credentials";
import { FIXED_AREA, type District } from "@/types/job";
import { createSupabaseAdmin } from "@/lib/supabase";
import { fetchListingRanksForJobs } from "@/lib/shop-boosts";

export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const SEARCH_CACHE_TTL_MS = 15_000;

function parsePlanFilters(searchParams: URLSearchParams): JobPlan[] {
  const raw = [
    ...searchParams.getAll("plan"),
    ...(searchParams.get("plans")?.split(",") ?? []),
  ];
  const unique: JobPlan[] = [];
  for (const value of raw) {
    const trimmed = value.trim();
    if (!isJobPlan(trimmed) || unique.includes(trimmed)) continue;
    unique.push(trimmed);
  }
  return unique;
}

export async function GET(request: Request) {
  const startedAt = Date.now();
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ message: "ログインしてください。" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() ?? "";
    const region = searchParams.get("region")?.trim() || "all";
    const statusFilter = searchParams.get("status")?.trim() || "all";
    const planFilters = parsePlanFilters(searchParams);
    const page = Math.max(1, Number(searchParams.get("page") ?? 1) || 1);
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, Number(searchParams.get("limit") ?? DEFAULT_LIMIT) || DEFAULT_LIMIT),
    );

    if (!q && region === "all" && statusFilter === "all" && planFilters.length === 0) {
      return NextResponse.json({
        jobs: [],
        total: 0,
        page: 1,
        limit,
        hasMore: false,
        details: {},
        viewCounts: {},
        searched: false,
        message: "店舗名・エリア・公開状態・掲載プランのいずれかで絞り込んでください",
      });
    }

    const planCacheKey =
      planFilters.length > 0 ? [...planFilters].sort().join(",") : "all";
    const cacheKey = `admin:jobs-search:listed:${region}:${statusFilter}:${planCacheKey}:${q}:${page}:${limit}`;
    const cached = getAdminCache<Record<string, unknown>>(cacheKey);
    if (cached) {
      console.info("[admin/jobs/search] cache-hit", {
        totalMs: Date.now() - startedAt,
      });
      return NextResponse.json({ ...cached, cache: "hit" });
    }

    const supabase = createSupabaseAdmin();

    // Listed search: published / paused only (drafts use /api/admin/jobs/drafts).
    let slimQuery = supabase
      .from("jobs")
      .select("id, shop_name, district, area, created_at, published, listing_status, plan")
      .order("created_at", { ascending: false });

    if (statusFilter === "published") {
      slimQuery = slimQuery.eq("listing_status", "published");
    } else if (statusFilter === "paused") {
      slimQuery = slimQuery.eq("listing_status", "paused");
    } else {
      // all (and any unknown value): exclude drafts
      slimQuery = slimQuery.in("listing_status", ["published", "paused"]);
    }

    if (planFilters.length > 0) {
      slimQuery = slimQuery.in("plan", planFilters);
    }

    if (region !== "all" && region !== FIXED_AREA) {
      slimQuery = slimQuery.eq("district", region as District);
    }

    const { data: slimRows, error: slimError } = await slimQuery;
    if (slimError) throw slimError;

    const matched = (slimRows ?? []).filter(
      (row) =>
        matchesRegionFilter(
          {
            area: FIXED_AREA,
            district: row.district as District,
          },
          region,
        ) && matchesShopSearch(row.shop_name ?? "", q),
    );

    const total = matched.length;
    const offset = (page - 1) * limit;
    const pageIds = matched.slice(offset, offset + limit).map((row) => row.id);

    let pageJobs: ReturnType<typeof rowToJob>[] = [];
    let details: Record<string, ReturnType<typeof emptyApplicationDetail>> = {};
    let viewCounts: Record<string, number> = {};

    if (pageIds.length > 0) {
      const [{ data: fullRows, error: fullError }, { data: appRows }, { data: viewRows }] =
        await Promise.all([
          // Page size is ≤20; full rows needed for edit form.
          supabase.from("jobs").select("*").in("id", pageIds),
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

      if (fullError) throw fullError;

      await migratePlaintextShopPasswordsInRows(supabase, fullRows ?? []);

      const byId = new Map(
        (fullRows ?? []).map((row) => [
          row.id as string,
          rowToJob(row, { includeShopLoginPassword: true }),
        ]),
      );
      pageJobs = pageIds
        .map((id) => byId.get(id))
        .filter((job): job is NonNullable<typeof job> => Boolean(job));

      details = buildApplicationDetails(appRows ?? []);
      for (const id of pageIds) {
        if (!details[id]) details[id] = emptyApplicationDetail();
      }
      viewCounts = aggregateViewCounts(viewRows ?? []);
      for (const id of pageIds) {
        if (viewCounts[id] == null) viewCounts[id] = 0;
      }
    }

    const listingRanks =
      pageJobs.length > 0
        ? await fetchListingRanksForJobs(
            supabase,
            pageJobs.map((job) => ({
              jobId: job.id,
              district: job.district,
            })),
          )
        : {};

    const payload = {
      jobs: pageJobs,
      total,
      page,
      limit,
      hasMore: offset + pageJobs.length < total,
      details,
      viewCounts,
      listingRanks,
      searched: true,
    };

    setAdminCache(cacheKey, payload, SEARCH_CACHE_TTL_MS);
    console.info("[admin/jobs/search]", {
      totalMs: Date.now() - startedAt,
      total,
      page,
      limit,
      cache: "miss",
    });

    return NextResponse.json({ ...payload, cache: "miss" });
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "検索に失敗しました。") },
      { status: 500 },
    );
  }
}
