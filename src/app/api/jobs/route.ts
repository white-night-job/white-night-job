import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getErrorMessage } from "@/lib/api-error";
import {
  normalizeJobPayload,
  parseShopCredentialsFromBody,
  payloadToRow,
  rowToJob,
  shopCredentialsToRow,
  validateJobPayload,
} from "@/lib/job-db";
import {
  chatRecommendToRow,
  parseChatRecommendFromBody,
} from "@/lib/chat-recommend-db";
import { parsePickupFromBody, pickupToRow } from "@/lib/pickup-db";
import {
  listingPriorityToRow,
  parseListingPriorityFromBody,
} from "@/lib/listing-priority";
import { parsePlanFromBody } from "@/lib/job-plan";
import { runAutoNotificationsAfterJobChange } from "@/lib/line-auto-notify";
import {
  emptyApplicationDetail,
  fetchApplicationDetails,
  fetchApplicationRows,
  fillApplicationDetailsForJobs,
  type ApplicationRow,
  type JobApplicationDetail,
} from "@/lib/job-applications";
import {
  aggregateViewCounts,
  fetchViewRows,
  fillViewCountsForJobs,
  type ViewRow,
} from "@/lib/job-views";
import {
  compareJobsForListing,
  fetchBoostStatsForJobs,
} from "@/lib/shop-boosts";
import {
  listingPriorityRank,
  parseListingPriority,
} from "@/lib/listing-priority";
import { isNewListingJob } from "@/lib/job-listing";
import { createSupabaseAdmin } from "@/lib/supabase";

/** Persist plan + related flags; ranking/pickup/AI come from form (admin may override). */
function planMetaToRow(body: Record<string, unknown>): Record<string, unknown> {
  const plan = parsePlanFromBody(body);
  if (!plan) return {};
  const lineNotifyRaw = body.line_recommend_notify ?? body.lineRecommendNotify;
  const newListingRaw = body.new_listing_enabled ?? body.newListingEnabled;
  return {
    plan,
    ...(typeof lineNotifyRaw === "boolean"
      ? { line_recommend_notify: lineNotifyRaw }
      : {}),
    ...(typeof newListingRaw === "boolean"
      ? { new_listing_enabled: newListingRaw }
      : {}),
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const district = searchParams.get("district");
    const jobType = searchParams.get("jobType");
    const keyword = searchParams.get("q")?.trim().toLowerCase() ?? "";
    const minSalary = Number(searchParams.get("minSalary") ?? 0);
    const selectedBenefits = searchParams.getAll("benefit").filter(Boolean);
    const listing = searchParams.get("listing");
    const supabase = createSupabaseAdmin();

    let query = supabase
      .from("jobs")
      .select("*")
      .eq("published", true)
      .order("created_at", { ascending: false });

    if (listing === "pickup") {
      query = query.eq("pickup_enabled", true);
    }

    if (district && district !== "all") query = query.eq("district", district);
    if (jobType && jobType !== "all") query = query.eq("job_type", jobType);

    const { data, error } = await query;
    if (error) throw error;

    let rows = data ?? [];

    if (listing === "new") {
      rows = rows.filter(
        (row) =>
          row.new_listing_enabled !== false &&
          isNewListingJob({
            postedAt: String(row.posted_at),
            createdAt: String(row.created_at),
          }),
      );
    }

    if (listing === "new" || listing === "pickup") {
      const jobs = rows.map((row) => rowToJob(row));
      return NextResponse.json({ jobs });
    }

    const createdAtMap = Object.fromEntries(
      rows.map((row) => [row.id, String(row.created_at)]),
    );
    const isAdmin = await isAdminAuthenticated();
    const jobs = rows.map((row) =>
      rowToJob(row, { includeShopLoginPassword: isAdmin }),
    );
    const filteredJobs = jobs.filter((job) => {
      const searchableText = [
        job.shopName,
        job.jobType,
        job.area,
        job.district,
        job.access,
        job.introductionText,
        job.descriptionText,
        ...job.benefits,
        ...(job.otherBenefits ?? []),
      ]
        .join(" ")
        .toLowerCase();
      const hourlySalary = getHourlySalary(job.salary);

      if (keyword && !searchableText.includes(keyword)) return false;
      if (minSalary > 0 && (hourlySalary === null || hourlySalary < minSalary)) {
        return false;
      }
      if (
        selectedBenefits.length > 0 &&
        !selectedBenefits.every((benefit) => job.benefits.includes(benefit))
      ) {
        return false;
      }

      return true;
    });

    const boostMap = await fetchBoostStatsForJobs(
      supabase,
      filteredJobs.map((job) => job.id),
    );
    const sortedJobs = [...filteredJobs].sort((a, b) =>
      compareJobsForListing(
        a.id,
        b.id,
        boostMap,
        createdAtMap[a.id] ?? a.postedAt,
        createdAtMap[b.id] ?? b.postedAt,
        listingPriorityRank(parseListingPriority(a.listingPriority)),
        listingPriorityRank(parseListingPriority(b.listingPriority)),
      ),
    );

    let applicationDetails: Record<string, JobApplicationDetail> | undefined;
    let applicationRows: ApplicationRow[] | undefined;
    let viewRows: ViewRow[] | undefined;
    let viewCounts: Record<string, number> | undefined;

    if (isAdmin) {
      try {
        const [rows, details] = await Promise.all([
          fetchApplicationRows(supabase),
          fetchApplicationDetails(supabase),
        ]);
        applicationDetails = fillApplicationDetailsForJobs(sortedJobs, details);
        applicationRows = rows;
      } catch {
        applicationDetails = Object.fromEntries(
          sortedJobs.map((job) => [job.id, emptyApplicationDetail()]),
        );
        applicationRows = [];
      }

      try {
        const views = await fetchViewRows(supabase);
        viewRows = views;
        viewCounts = fillViewCountsForJobs(
          sortedJobs,
          aggregateViewCounts(views),
        );
      } catch {
        viewRows = [];
        viewCounts = Object.fromEntries(
          sortedJobs.map((job) => [job.id, 0]),
        );
      }
    }

    return NextResponse.json({
      jobs: sortedJobs,
      ...(applicationDetails
        ? {
            applicationDetails,
            applicationStats: applicationDetails,
            applicationRows,
            viewRows,
            viewCounts,
          }
        : {}),
    });
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "求人の取得に失敗しました。") },
      { status: 500 },
    );
  }
}

function getHourlySalary(salary: string): number | null {
  if (/日給|月給|年収/.test(salary)) return null;

  const match = salary.replace(/,/g, "").match(/\d+/);
  return match ? Number(match[0]) : null;
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ message: "ログインしてください。" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const payload = normalizeJobPayload(body);
    const validationError = validateJobPayload(payload);
    if (validationError) {
      return NextResponse.json({ message: validationError }, { status: 400 });
    }

    const shopCredentials = parseShopCredentialsFromBody(body);
    const credentialRow = shopCredentialsToRow(shopCredentials);
    const chatRecommendRow = chatRecommendToRow(parseChatRecommendFromBody(body));
    const pickupRow = pickupToRow(parsePickupFromBody(body));
    const listingPriorityRow = listingPriorityToRow(
      parseListingPriorityFromBody(body),
    );
    const planRow = planMetaToRow(body);

    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("jobs")
      .insert({
        ...payloadToRow(payload),
        ...credentialRow,
        ...chatRecommendRow,
        ...pickupRow,
        ...listingPriorityRow,
        ...planRow,
      })
      .select("*")
      .single();

    if (error) {
      console.error("jobs insert failed:", error.message, {
        credentialKeys: Object.keys(credentialRow),
      });
      throw error;
    }

    const job = rowToJob(data, { includeShopLoginPassword: true });
    void runAutoNotificationsAfterJobChange({
      before: null,
      after: job,
      wasCreate: true,
    });

    return NextResponse.json({ job }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "求人の保存に失敗しました。") },
      { status: 500 },
    );
  }
}
