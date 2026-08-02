import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getErrorMessage } from "@/lib/api-error";
import { computeJobDraftProgress } from "@/lib/job-draft-progress";
import { rowToJob } from "@/lib/job-db";
import { migratePlaintextShopPasswordsInRows } from "@/lib/shop-credentials";
import { JOB_TYPES, type District, type JobType } from "@/types/job";
import { createSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

function isDistrict(value: string): value is District {
  return ["すすきの", "琴似", "24条", "手稲"].includes(value);
}

function isJobType(value: string): value is JobType {
  return (JOB_TYPES as string[]).includes(value);
}

function endOfDayIso(dateYmd: string): string {
  return `${dateYmd}T23:59:59.999+09:00`;
}

function startOfDayIso(dateYmd: string): string {
  return `${dateYmd}T00:00:00.000+09:00`;
}

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ message: "ログインしてください。" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const shopName = searchParams.get("shopName")?.trim() ?? "";
    const area = searchParams.get("area")?.trim() ?? "";
    const jobType = searchParams.get("jobType")?.trim() ?? "";
    const contactName = searchParams.get("contactName")?.trim() ?? "";
    const createdFrom = searchParams.get("createdFrom")?.trim() ?? "";
    const createdTo = searchParams.get("createdTo")?.trim() ?? "";
    const updatedFrom = searchParams.get("updatedFrom")?.trim() ?? "";
    const updatedTo = searchParams.get("updatedTo")?.trim() ?? "";
    const page = Math.max(1, Number(searchParams.get("page") ?? 1) || 1);
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, Number(searchParams.get("limit") ?? DEFAULT_LIMIT) || DEFAULT_LIMIT),
    );

    const supabase = createSupabaseAdmin();

    const { count: draftTotal, error: countError } = await supabase
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .eq("listing_status", "draft");
    if (countError) throw countError;

    let query = supabase
      .from("jobs")
      .select("*", { count: "exact" })
      .eq("listing_status", "draft")
      .order("updated_at", { ascending: false });

    if (shopName) {
      query = query.ilike("shop_name", `%${shopName}%`);
    }
    if (area && isDistrict(area)) {
      query = query.eq("district", area);
    }
    if (jobType && isJobType(jobType)) {
      query = query.eq("job_type", jobType);
    }
    if (contactName) {
      query = query.ilike("recruiter_name", `%${contactName}%`);
    }
    if (createdFrom) {
      query = query.gte("created_at", startOfDayIso(createdFrom));
    }
    if (createdTo) {
      query = query.lte("created_at", endOfDayIso(createdTo));
    }
    if (updatedFrom) {
      query = query.gte("updated_at", startOfDayIso(updatedFrom));
    }
    if (updatedTo) {
      query = query.lte("updated_at", endOfDayIso(updatedTo));
    }

    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    await migratePlaintextShopPasswordsInRows(supabase, data ?? []);

    const jobs = (data ?? []).map((row) =>
      rowToJob(row, { includeShopLoginPassword: true }),
    );

    const items = jobs.map((job) => {
      const progress = computeJobDraftProgress(job);
      return {
        job,
        progress,
      };
    });

    return NextResponse.json({
      items,
      jobs,
      total: count ?? items.length,
      draftTotal: draftTotal ?? 0,
      page,
      limit,
      hasMore: offset + items.length < (count ?? 0),
      searched: true,
    });
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "下書き検索に失敗しました。") },
      { status: 500 },
    );
  }
}
