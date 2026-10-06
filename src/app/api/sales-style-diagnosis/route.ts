import { NextResponse } from "next/server";
import {
  calculateSalesStyleResult,
  isSalesStyleType,
  normalizeSalesStyleAnswers,
  type SavedSalesStyleResult,
} from "@/lib/sales-style-diagnosis";
import { isSalesStyleTableMissing } from "@/lib/sales-style-diagnosis-events";
import { createSupabaseAdmin } from "@/lib/supabase";
import { getAuthenticatedUserId } from "@/lib/user-auth";

export const dynamic = "force-dynamic";

const HISTORY_LIMIT = 5;
const TABLE = "user_sales_style_diagnoses";

function mapHistoryRow(row: {
  id: string;
  diagnosed_at: string;
  main_type: string;
  sub_type: string | null;
}): SavedSalesStyleResult | null {
  if (!isSalesStyleType(row.main_type)) return null;
  return {
    id: row.id,
    diagnosedAt: row.diagnosed_at,
    mainType: row.main_type,
    subType: isSalesStyleType(row.sub_type) ? row.sub_type : null,
  };
}

async function fetchUserHistory(userId: string) {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from(TABLE)
    .select("id, diagnosed_at, main_type, sub_type")
    .eq("user_id", userId)
    .order("diagnosed_at", { ascending: false })
    .limit(HISTORY_LIMIT);

  if (error) throw error;
  return (data ?? [])
    .map(mapHistoryRow)
    .filter((row): row is SavedSalesStyleResult => row !== null);
}

async function pruneHistory(userId: string) {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from(TABLE)
    .select("id")
    .eq("user_id", userId)
    .order("diagnosed_at", { ascending: false });

  if (error) throw error;
  if (!data || data.length <= HISTORY_LIMIT) return;

  const staleIds = data.slice(HISTORY_LIMIT).map((row) => row.id);
  const { error: deleteError } = await supabase.from(TABLE).delete().in("id", staleIds);
  if (deleteError) throw deleteError;
}

export async function GET(request: Request) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ message: "LINEログインが必要です。" }, { status: 401 });
  }

  try {
    const history = await fetchUserHistory(userId);
    return NextResponse.json({ history, latest: history[0] ?? null });
  } catch (error) {
    if (isSalesStyleTableMissing(error as { message?: string })) {
      return NextResponse.json({ history: [], latest: null });
    }
    console.error("[sales-style-diagnosis] GET failed:", { userId, error });
    return NextResponse.json({ message: "取得に失敗しました。" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ message: "LINEログインが必要です。" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    diagnosedAt?: string;
    answers?: unknown;
  };

  // 結果はクライアント値を信用せず、回答からサーバー側で再計算する
  const answers = normalizeSalesStyleAnswers(body.answers);
  const result = answers ? calculateSalesStyleResult(answers) : null;
  if (!answers || !result) {
    return NextResponse.json({ message: "診断結果が不正です。" }, { status: 400 });
  }

  const diagnosedAt =
    body.diagnosedAt && !Number.isNaN(Date.parse(body.diagnosedAt))
      ? body.diagnosedAt
      : new Date().toISOString();

  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from(TABLE).insert({
    user_id: userId,
    diagnosed_at: diagnosedAt,
    main_type: result.mainType,
    sub_type: result.subType,
    answers,
  });

  if (error) {
    if (isSalesStyleTableMissing(error)) {
      return NextResponse.json(
        { message: "現在、営業スタイル診断の保存は準備中です。" },
        { status: 503 },
      );
    }
    console.error("[sales-style-diagnosis] POST failed:", { userId, error });
    return NextResponse.json({ message: "保存に失敗しました。" }, { status: 500 });
  }

  try {
    await pruneHistory(userId);
    const history = await fetchUserHistory(userId);
    return NextResponse.json({ ok: true, history, latest: history[0] ?? null });
  } catch (pruneError) {
    console.error("[sales-style-diagnosis] prune failed:", { userId, pruneError });
    return NextResponse.json({ ok: true });
  }
}
