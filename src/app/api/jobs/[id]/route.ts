import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { invalidateAdminCacheByPrefix } from "@/lib/admin-cache";
import { getErrorMessage } from "@/lib/api-error";
import {
  normalizeJobPayload,
  payloadToRow,
  rowToJob,
  validateDraftJobPayload,
  validatePublishJobPayload,
} from "@/lib/job-db";
import {
  createEncryptedShopCredentials,
  encryptPasswordForStorage,
  generateShopLoginPassword,
} from "@/lib/shop-credentials";
import {
  isJobListingStatus,
  listingStatusToRow,
  resolveJobListingStatus,
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
import { parsePlanFromBody } from "@/lib/job-plan";
import { parseOpenDateFromBody, parsePostedAtFromBody } from "@/lib/job-listing";
import { PUBLIC_JOB_DETAIL_COLUMNS } from "@/lib/job-detail-data";
import { runAutoNotificationsAfterJobChange } from "@/lib/line-auto-notify";
import { createSupabaseAdmin } from "@/lib/supabase";
import { revalidateTag } from "next/cache";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

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

function resolveUpdateIntent(
  body: Record<string, unknown>,
  currentStatus: JobListingStatus,
): {
  intent: "draft" | "publish" | "pause" | "keep";
  targetStatus: JobListingStatus;
} {
  const intentRaw = String(body.saveIntent ?? body.intent ?? "").trim();
  if (intentRaw === "draft" || intentRaw === "save_draft") {
    // Draft jobs stay draft. Published/paused keep status (content-only save).
    if (currentStatus === "draft") {
      return { intent: "draft", targetStatus: "draft" };
    }
    return { intent: "keep", targetStatus: currentStatus };
  }
  if (intentRaw === "publish" || intentRaw === "republish") {
    return { intent: "publish", targetStatus: "published" };
  }
  if (intentRaw === "pause") {
    return { intent: "pause", targetStatus: "paused" };
  }
  if (intentRaw === "set_draft") {
    return { intent: "draft", targetStatus: "draft" };
  }
  const status = body.listingStatus ?? body.listing_status;
  if (isJobListingStatus(status)) {
    return {
      intent:
        status === "published"
          ? "publish"
          : status === "paused"
            ? "pause"
            : "draft",
      targetStatus: status,
    };
  }
  return { intent: "keep", targetStatus: currentStatus };
}

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("jobs")
      .select(PUBLIC_JOB_DETAIL_COLUMNS)
      .eq("id", id)
      .eq("published", true)
      .maybeSingle();

    if (error) {
      console.error("[api/jobs/[id]] supabase select failed", {
        jobId: id,
        code: (error as { code?: string }).code,
        message: getErrorMessage(error, "unknown supabase error"),
      });
      return NextResponse.json(
        { message: "求人の取得に失敗しました。" },
        { status: 500 },
      );
    }

    if (!data) {
      return NextResponse.json({ message: "求人が見つかりません。" }, { status: 404 });
    }

    return NextResponse.json(
      { job: rowToJob(data as unknown as Parameters<typeof rowToJob>[0]) },
      {
        headers: {
          // Client prefetch / revisit: short private cache, must revalidate after edits.
          "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "求人の取得に失敗しました。") },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request, { params }: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ message: "ログインしてください。" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    const payload = normalizeJobPayload(body);

    // ログインID/PWの変更は通常更新では受け付けない（PWは再発行APIのみ）
    const chatRecommendRow = chatRecommendToRow(parseChatRecommendFromBody(body));
    const pickupRow = pickupToRow(parsePickupFromBody(body));
    const listingPriorityRow = listingPriorityToRow(
      parseListingPriorityFromBody(body),
    );
    const planRow = planMetaToRow(body);
    const postedAtRow = postedAtToRow(body);
    const openDateRow = openDateToRow(body);

    const supabase = createSupabaseAdmin();
    const { data: previous } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (!previous) {
      return NextResponse.json({ message: "求人が見つかりません。" }, { status: 404 });
    }

    const currentStatus = resolveJobListingStatus(previous);
    const { intent, targetStatus } = resolveUpdateIntent(body, currentStatus);

    if (intent === "publish" || targetStatus === "published") {
      const publishError = validatePublishJobPayload(payload);
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

    const statusRow = listingStatusToRow(targetStatus);
    const forDraft = targetStatus !== "published";

    // 既存で未発行の場合のみ自動発行（移行起点）。PW変更は再発行APIを使う。
    let credentialBackfill: Record<string, unknown> = {};
    let issuedCredentials:
      | { shopLoginId: string; shopLoginPassword: string }
      | undefined;
    if (!previous.shop_login_id?.trim() || !previous.shop_login_password) {
      if (previous.shop_login_id?.trim() && !previous.shop_login_password) {
        const plain = generateShopLoginPassword();
        credentialBackfill = {
          shop_login_password: encryptPasswordForStorage(plain),
          shop_login_failed_attempts: 0,
          shop_login_locked_until: null,
        };
        issuedCredentials = {
          shopLoginId: String(previous.shop_login_id),
          shopLoginPassword: plain,
        };
      } else {
        const credentials = await createEncryptedShopCredentials(supabase);
        credentialBackfill = {
          shop_login_id: credentials.shop_login_id,
          shop_login_password: credentials.shop_login_password,
          shop_login_failed_attempts: 0,
          shop_login_locked_until: null,
        };
        issuedCredentials = {
          shopLoginId: credentials.shopLoginId,
          shopLoginPassword: credentials.shopLoginPasswordPlain,
        };
      }
    }

    const { data, error } = await supabase
      .from("jobs")
      .update({
        ...payloadToRow(payload, { forDraft }),
        ...credentialBackfill,
        ...chatRecommendRow,
        ...pickupRow,
        ...listingPriorityRow,
        ...planRow,
        ...postedAtRow,
        ...openDateRow,
        ...statusRow,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("jobs update failed:", error.message, {
        jobId: id,
        credentialKeys: Object.keys(credentialBackfill),
      });
      throw error;
    }

    const before = previous ? rowToJob(previous) : null;
    const after = rowToJob(data, { includeShopLoginPassword: true });
    if (issuedCredentials) {
      after.shopLoginId = issuedCredentials.shopLoginId;
      after.shopLoginPassword = issuedCredentials.shopLoginPassword;
    }
    if (targetStatus === "published") {
      void runAutoNotificationsAfterJobChange({ before, after });
    }

    invalidateAdminCacheByPrefix("admin:");
    revalidateTag(`job-detail:${id}`);
    return NextResponse.json({
      job: after,
      ...(issuedCredentials ? { issuedCredentials } : {}),
    });
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "求人の更新に失敗しました。") },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ message: "ログインしてください。" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const supabase = createSupabaseAdmin();
    const { data: existing, error: loadError } = await supabase
      .from("jobs")
      .select("id, listing_status, published")
      .eq("id", id)
      .maybeSingle();
    if (loadError) throw loadError;
    if (!existing) {
      return NextResponse.json({ message: "求人が見つかりません。" }, { status: 404 });
    }
    if (resolveJobListingStatus(existing) !== "draft") {
      return NextResponse.json(
        {
          message:
            "公開中・掲載停止の求人はこの画面から削除できません。下書きのみ削除できます。",
        },
        { status: 403 },
      );
    }

    const { error } = await supabase.from("jobs").delete().eq("id", id);
    if (error) throw error;

    invalidateAdminCacheByPrefix("admin:");
    revalidateTag(`job-detail:${id}`);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "求人の削除に失敗しました。") },
      { status: 500 },
    );
  }
}
