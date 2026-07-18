import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/api-error";
import { rowToJob } from "@/lib/job-db";
import { runAutoNotificationsAfterJobChange } from "@/lib/line-auto-notify";
import { getAuthenticatedShopJobId } from "@/lib/shop-auth";
import {
  normalizeShopJobPayload,
  shopPayloadToRow,
  validateShopJobPayload,
} from "@/lib/shop-job-db";
import { createSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/** Admin-only job columns — never accept from shop PATCH. */
const ADMIN_ONLY_BODY_KEYS = [
  "listing_priority",
  "listingPriority",
  "pickup_enabled",
  "pickupEnabled",
  "chat_recommend_enabled",
  "chatRecommendEnabled",
  "chat_recommend_priority",
  "chatRecommendPriority",
  "chat_recommend_comment",
  "chatRecommendComment",
  "chat_recommend_beginner",
  "chatRecommendBeginner",
  "chat_recommend_no_alcohol_ok",
  "chatRecommendNoAlcoholOk",
  "chat_recommend_shuttle",
  "chatRecommendShuttle",
  "chat_recommend_privacy",
  "chatRecommendPrivacy",
  "chat_recommend_high_salary",
  "chatRecommendHighSalary",
  "chat_recommend_relaxed",
  "chatRecommendRelaxed",
  "chat_recommend_high_earning",
  "chatRecommendHighEarning",
  "listing_plan",
  "listingPlan",
  "plan",
  "line_recommend_notify",
  "lineRecommendNotify",
  "new_listing_enabled",
  "newListingEnabled",
  "posted_at",
  "postedAt",
  "published",
] as const;

function stripAdminOnlyFields(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== "object") return {};
  const next = { ...(body as Record<string, unknown>) };
  for (const key of ADMIN_ONLY_BODY_KEYS) {
    delete next[key];
  }
  return next;
}

export async function PATCH(request: Request) {
  const jobId = await getAuthenticatedShopJobId();
  if (!jobId) {
    return NextResponse.json({ message: "ログインしてください。" }, { status: 401 });
  }

  try {
    const rawBody = await request.json();
    const body = stripAdminOnlyFields(rawBody);

    if ("jobId" in body) {
      const requestedJobId = String(body.jobId ?? "");
      if (requestedJobId && requestedJobId !== jobId) {
        return NextResponse.json(
          { message: "他店舗の情報は編集できません。" },
          { status: 403 },
        );
      }
    }

    const payload = normalizeShopJobPayload(body);
    const validationError = validateShopJobPayload(payload);
    if (validationError) {
      return NextResponse.json({ message: validationError }, { status: 400 });
    }

    // Shop updates must never touch listing_priority / pickup / AI priority / plan.
    const row = shopPayloadToRow(payload);

    const supabase = createSupabaseAdmin();
    const { data: previous } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .maybeSingle();

    const { data, error } = await supabase
      .from("jobs")
      .update(row)
      .eq("id", jobId)
      .select("*")
      .single();

    if (error) throw error;

    const before = previous ? rowToJob(previous) : null;
    const after = rowToJob(data);
    void runAutoNotificationsAfterJobChange({ before, after });

    return NextResponse.json({ job: after });
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "求人の更新に失敗しました。") },
      { status: 500 },
    );
  }
}
