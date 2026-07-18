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
import { parsePostedAtFromBody } from "@/lib/job-listing";
import { runAutoNotificationsAfterJobChange } from "@/lib/line-auto-notify";
import { createSupabaseAdmin } from "@/lib/supabase";

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

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", id)
      .eq("published", true)
      .single();

    if (error) {
      return NextResponse.json({ message: "求人が見つかりません。" }, { status: 404 });
    }

    return NextResponse.json({ job: rowToJob(data) });
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
    const postedAtRow = postedAtToRow(body);

    const supabase = createSupabaseAdmin();
    const { data: previous } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    const { data, error } = await supabase
      .from("jobs")
      .update({
        ...payloadToRow(payload),
        ...credentialRow,
        ...chatRecommendRow,
        ...pickupRow,
        ...listingPriorityRow,
        ...planRow,
        ...postedAtRow,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("jobs update failed:", error.message, {
        jobId: id,
        credentialKeys: Object.keys(credentialRow),
      });
      throw error;
    }

    const before = previous ? rowToJob(previous) : null;
    const after = rowToJob(data, { includeShopLoginPassword: true });
    void runAutoNotificationsAfterJobChange({ before, after });

    return NextResponse.json({ job: after });
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
    const { error } = await supabase.from("jobs").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "求人の削除に失敗しました。") },
      { status: 500 },
    );
  }
}
