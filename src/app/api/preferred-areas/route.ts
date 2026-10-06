import { NextResponse } from "next/server";
import { normalizePreferredAreas } from "@/lib/preferred-areas";
import { createSupabaseAdmin } from "@/lib/supabase";
import { getAuthenticatedUserId } from "@/lib/user-auth";

export const dynamic = "force-dynamic";

function isColumnMissing(error: { message?: string } | null): boolean {
  return /preferred_areas|schema cache|does not exist/i.test(error?.message ?? "");
}

export async function GET(request: Request) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ message: "LINEログインが必要です。" }, { status: 401 });
  }

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("users")
    .select("preferred_areas")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    if (isColumnMissing(error)) {
      return NextResponse.json({ areas: [], configured: false });
    }
    console.error("[preferred-areas] GET failed:", { userId, error });
    return NextResponse.json({ message: "取得に失敗しました。" }, { status: 500 });
  }

  const raw = (data as { preferred_areas?: unknown } | null)?.preferred_areas;
  const areas = normalizePreferredAreas(raw);
  return NextResponse.json({ areas, configured: areas.length > 0 });
}

export async function PUT(request: Request) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ message: "LINEログインが必要です。" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { areas?: unknown };
  // 許可されたエリア値のみ保存する。更新対象はセッションのユーザーに固定。
  const areas = normalizePreferredAreas(body.areas);

  const supabase = createSupabaseAdmin();
  const { error } = await supabase
    .from("users")
    .update({ preferred_areas: areas.length > 0 ? areas : null })
    .eq("id", userId);

  if (error) {
    if (isColumnMissing(error)) {
      return NextResponse.json(
        { message: "現在、希望エリアの保存は準備中です。" },
        { status: 503 },
      );
    }
    console.error("[preferred-areas] PUT failed:", { userId, error });
    return NextResponse.json({ message: "保存に失敗しました。" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, areas, configured: areas.length > 0 });
}
