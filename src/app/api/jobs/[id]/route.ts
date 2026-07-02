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
import { createSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

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

    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("jobs")
      .update({
        ...payloadToRow(payload),
        ...credentialRow,
        ...chatRecommendRow,
        ...pickupRow,
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

    return NextResponse.json({
      job: rowToJob(data, { includeShopLoginPassword: true }),
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
