import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { SESSION_EXPIRED_MESSAGE } from "@/lib/auth-session-messages";
import { invalidateAdminCacheByPrefix } from "@/lib/admin-cache";
import { getErrorMessage } from "@/lib/api-error";
import {
  normalizeJobPayload,
  payloadToRow,
  rowToJob,
  validateDraftJobPayload,
  validatePublishJobPayload,
} from "@/lib/job-db";
import { createEncryptedShopCredentials } from "@/lib/shop-credentials";
import {
  isJobListingStatus,
  listingStatusToRow,
  type JobListingStatus,
} from "@/lib/job-listing-status";
import {
  chatRecommendToRow,
  parseChatRecommendFromBody,
} from "@/lib/chat-recommend-db";
import { parsePickupFromBody, pickupToRow } from "@/lib/pickup-db";
import {
  listingPriorityToRow,
  parseListingPriorityFromBody,
} from "@/lib/listing-priority";
import { parseJobPlan, parsePlanFromBody } from "@/lib/job-plan";
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
import { isNewListingJob, isNewlyOpenedShopJob, parseOpenDateFromBody, parsePostedAtFromBody } from "@/lib/job-listing";
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

function postedAtToRow(body: Record<string, unknown>): Record<string, unknown> {
  const postedAt = parsePostedAtFromBody(body);
  return postedAt ? { posted_at: postedAt } : {};
}

function openDateToRow(body: Record<string, unknown>): Record<string, unknown> {
  const openDate = parseOpenDateFromBody(body);
  if (openDate === undefined) return {};
  return { open_date: openDate };
}

function resolveSaveIntent(body: Record<string, unknown>): {
  intent: "draft" | "publish" | "pause" | "keep";
  targetStatus: JobListingStatus | null;
} {
  const intentRaw = String(body.saveIntent ?? body.intent ?? "").trim();
  if (intentRaw === "draft" || intentRaw === "save_draft") {
    return { intent: "draft", targetStatus: "draft" };
  }
  if (intentRaw === "publish") {
    return { intent: "publish", targetStatus: "published" };
  }
  if (intentRaw === "pause") {
    return { intent: "pause", targetStatus: "paused" };
  }
  if (intentRaw === "republish") {
    return { intent: "publish", targetStatus: "published" };
  }
  const status = body.listingStatus ?? body.listing_status;
  if (isJobListingStatus(status)) {
    return {
      intent: status === "published" ? "publish" : status === "paused" ? "pause" : "draft",
      targetStatus: status,
    };
  }
  // Default for create: draft (never auto-publish)
  return { intent: "draft", targetStatus: "draft" };
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

    if (listing === "new-open") {
      query = query.not("open_date", "is", null);
    }

    if (district && district !== "all") query = query.eq("district", district);
    if (jobType && jobType !== "all") query = query.eq("job_type", jobType);

    const { data, error } = await query;
    if (error) throw error;

    let rows = data ?? [];

    if (listing === "new") {
      rows = rows.filter((row) =>
        isNewListingJob({
          postedAt: String(row.posted_at),
          plan: row.plan,
          newListingEnabled: row.new_listing_enabled,
        }),
      );
    }

    if (listing === "new-open") {
      rows = rows
        .filter((row) =>
          isNewlyOpenedShopJob({
            openDate: row.open_date ? String(row.open_date) : null,
          }),
        )
        .sort((a, b) =>
          String(b.open_date ?? "").localeCompare(String(a.open_date ?? "")),
        );
    }

    if (listing === "new" || listing === "pickup") {
      const boostMap = await fetchBoostStatsForJobs(
        supabase,
        rows.map((row) => row.id as string),
      );
      const jobs = [...rows]
        .sort((a, b) =>
          compareJobsForListing(
            {
              id: String(a.id),
              plan: a.plan,
              createdAt: String(a.created_at),
              updatedAt: a.updated_at ? String(a.updated_at) : null,
            },
            {
              id: String(b.id),
              plan: b.plan,
              createdAt: String(b.created_at),
              updatedAt: b.updated_at ? String(b.updated_at) : null,
            },
            boostMap,
          ),
        )
        .map((row) => rowToJob(row));
      return NextResponse.json({ jobs });
    }

    if (listing === "new-open") {
      const jobs = rows.map((row) => rowToJob(row));
      return NextResponse.json({ jobs });
    }

    const createdAtMap = Object.fromEntries(
      rows.map((row) => [row.id, String(row.created_at)]),
    );
    const updatedAtMap = Object.fromEntries(
      rows.map((row) => [
        row.id,
        row.updated_at ? String(row.updated_at) : null,
      ]),
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
        {
          id: a.id,
          plan: parseJobPlan(a.plan),
          createdAt: createdAtMap[a.id] ?? a.postedAt,
          updatedAt: updatedAtMap[a.id] ?? a.updatedAt ?? null,
        },
        {
          id: b.id,
          plan: parseJobPlan(b.plan),
          createdAt: createdAtMap[b.id] ?? b.postedAt,
          updatedAt: updatedAtMap[b.id] ?? b.updatedAt ?? null,
        },
        boostMap,
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
    return NextResponse.json(
      { message: SESSION_EXPIRED_MESSAGE },
      { status: 401 },
    );
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const payload = normalizeJobPayload(body);
    const { intent, targetStatus } = resolveSaveIntent(body);
    const status: JobListingStatus = targetStatus ?? "draft";

    if (intent === "publish") {
      const plan = parsePlanFromBody(body);
      const publishError = validatePublishJobPayload(payload, { plan });
      if (publishError) {
        return NextResponse.json(
          {
            message: publishError.message,
            field: publishError.field,
            validation: publishError,
          },
          { status: 400 },
        );
      }
    } else {
      const draftError = validateDraftJobPayload(payload);
      if (draftError) {
        return NextResponse.json({ message: draftError }, { status: 400 });
      }
    }

    const chatRecommendRow = chatRecommendToRow(parseChatRecommendFromBody(body));
    const pickupRow = pickupToRow(parsePickupFromBody(body));
    const listingPriorityRow = listingPriorityToRow(
      parseListingPriorityFromBody(body),
    );
    const planRow = planMetaToRow(body);
    const postedAtRow = postedAtToRow(body);
    const openDateRow = openDateToRow(body);
    const statusRow = listingStatusToRow(status);

    const supabase = createSupabaseAdmin();
    // 店舗作成時にログインID・PWを自動発行し、PWは暗号化して保存
    const credentials = await createEncryptedShopCredentials(supabase);
    const resolvedPlan =
      parsePlanFromBody(body) ??
      (typeof payload.plan === "string" ? parseJobPlan(payload.plan) : "light");
    const { data, error } = await supabase
      .from("jobs")
      .insert({
        ...payloadToRow(payload, {
          forDraft: status !== "published",
          plan: resolvedPlan,
        }),
        shop_login_id: credentials.shop_login_id,
        shop_login_password: credentials.shop_login_password,
        shop_login_failed_attempts: 0,
        shop_login_locked_until: null,
        ...chatRecommendRow,
        ...pickupRow,
        ...listingPriorityRow,
        ...planRow,
        ...postedAtRow,
        ...openDateRow,
        ...statusRow,
      })
      .select("*")
      .single();

    if (error) {
      console.error("jobs insert failed:", error.message, {
        credentialKeys: ["shop_login_id", "shop_login_password"],
      });
      throw error;
    }

    const job = rowToJob(data, { includeShopLoginPassword: true });
    // 復号失敗時フォールバック（通常は発行した平文を返す）
    job.shopLoginPassword = credentials.shopLoginPasswordPlain;
    job.shopLoginId = credentials.shopLoginId;
    if (status === "published") {
      void runAutoNotificationsAfterJobChange({
        before: null,
        after: job,
        wasCreate: true,
      });
    }

    invalidateAdminCacheByPrefix("admin:");
    return NextResponse.json(
      {
        job,
        issuedCredentials: {
          shopLoginId: credentials.shopLoginId,
          shopLoginPassword: credentials.shopLoginPasswordPlain,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "求人の保存に失敗しました。") },
      { status: 500 },
    );
  }
}
