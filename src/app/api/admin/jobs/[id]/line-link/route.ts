import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getErrorMessage } from "@/lib/api-error";
import {
  getShopLineLink,
  linkShopLine,
  ShopLineLinkError,
  unlinkShopLine,
} from "@/lib/shop-line-link";
import { createSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const LINE_USER_ID_PATTERN = /^U[0-9a-f]{32}$/;

function unauthorized() {
  return NextResponse.json({ message: "ログインしてください。" }, { status: 401 });
}

export async function GET(_request: Request, { params }: RouteContext) {
  if (!(await isAdminAuthenticated())) return unauthorized();

  try {
    const { id } = await params;
    const link = await getShopLineLink(createSupabaseAdmin(), id);
    return NextResponse.json(link, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "LINE通知設定の取得に失敗しました。") },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request, { params }: RouteContext) {
  if (!(await isAdminAuthenticated())) return unauthorized();

  try {
    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as {
      lineUserId?: unknown;
    };
    const lineUserId =
      typeof body.lineUserId === "string" ? body.lineUserId.trim() : "";
    if (!LINE_USER_ID_PATTERN.test(lineUserId)) {
      return NextResponse.json(
        { message: "LINEユーザーを選択してください。" },
        { status: 400 },
      );
    }

    const supabase = createSupabaseAdmin();
    await linkShopLine(supabase, id, lineUserId);
    const link = await getShopLineLink(supabase, id);
    return NextResponse.json(link);
  } catch (error) {
    if (error instanceof ShopLineLinkError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { message: getErrorMessage(error, "LINEユーザーの紐付けに失敗しました。") },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  if (!(await isAdminAuthenticated())) return unauthorized();

  try {
    const { id } = await params;
    const supabase = createSupabaseAdmin();
    await unlinkShopLine(supabase, id);
    const link = await getShopLineLink(supabase, id);
    return NextResponse.json(link);
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "LINE連携の解除に失敗しました。") },
      { status: 500 },
    );
  }
}
