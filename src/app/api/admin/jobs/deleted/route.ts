import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getErrorMessage } from "@/lib/api-error";
import {
  matchesRegionFilter,
  matchesShopSearch,
} from "@/lib/job-applications";
import { rowToJob } from "@/lib/job-db";
import {
  JOB_LISTING_STATUS_LABELS,
  type JobListingStatus,
} from "@/lib/job-listing-status";
import { isJobPlan, type JobPlan } from "@/lib/job-plan";
import {
  onlySoftDeletedJobs,
  parseDeletedFromListingStatus,
} from "@/lib/job-soft-delete";
import { FIXED_AREA, type District } from "@/types/job";
import { createSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

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

export type DeletedShopListItem = {
  job: ReturnType<typeof rowToJob>;
  deletedAt: string;
  deletedFromListingStatus: JobListingStatus | null;
  deletedFromListingStatusLabel: string | null;
};

/** 管理者のみ: 論理削除済み店舗一覧 */
export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ message: "ログインしてください。" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() ?? "";
    const region = searchParams.get("region")?.trim() || "all";
    const planFilters = parsePlanFilters(searchParams);
    const page = Math.max(1, Number(searchParams.get("page") ?? 1) || 1);
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, Number(searchParams.get("limit") ?? DEFAULT_LIMIT) || DEFAULT_LIMIT),
    );

    const supabase = createSupabaseAdmin();

    let slimQuery = onlySoftDeletedJobs(
      supabase
        .from("jobs")
        .select("id, shop_name, district, area, created_at, plan, deleted_at")
        .order("deleted_at", { ascending: false }),
    );

    if (planFilters.length > 0) {
      slimQuery = slimQuery.in("plan", planFilters);
    }
    if (region !== "all" && region !== FIXED_AREA) {
      slimQuery = slimQuery.eq("district", region as District);
    }

    const { data: slimRows, error: slimError } = await slimQuery;
    if (slimError) throw slimError;

    const matched = ((slimRows ?? []) as Array<{
      id: string;
      shop_name: string | null;
      district: District;
      area?: string | null;
      plan?: string | null;
      deleted_at?: string | null;
    }>).filter(
      (row) =>
        matchesRegionFilter(
          {
            area: FIXED_AREA,
            district: row.district,
          },
          region,
        ) && matchesShopSearch(row.shop_name ?? "", q),
    );

    const total = matched.length;
    const offset = (page - 1) * limit;
    const pageIds = matched.slice(offset, offset + limit).map((row) => row.id);

    let items: DeletedShopListItem[] = [];
    if (pageIds.length > 0) {
      const { data: fullRows, error: fullError } = await supabase
        .from("jobs")
        .select("*")
        .in("id", pageIds);
      if (fullError) throw fullError;

      const byId = new Map(
        (fullRows ?? []).map((row) => [row.id as string, row]),
      );

      items = pageIds
        .map((id) => {
          const row = byId.get(id);
          if (!row) return null;
          const deletedAt = String(row.deleted_at ?? "").trim();
          if (!deletedAt) return null;
          const deletedFromListingStatus = parseDeletedFromListingStatus(
            row.deleted_from_listing_status,
          );
          return {
            job: rowToJob(row, { includeShopLoginPassword: true }),
            deletedAt,
            deletedFromListingStatus,
            deletedFromListingStatusLabel: deletedFromListingStatus
              ? JOB_LISTING_STATUS_LABELS[deletedFromListingStatus]
              : null,
          };
        })
        .filter((item): item is DeletedShopListItem => item !== null);
    }

    return NextResponse.json({
      items,
      total,
      page,
      limit,
      hasMore: offset + items.length < total,
      searched: true,
    });
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "削除済み店舗の取得に失敗しました。") },
      { status: 500 },
    );
  }
}
