import { NextResponse } from "next/server";
import type { DiagnosisAnswers, DiagnosisJobType } from "@/lib/job-type-diagnosis";
import { DIAGNOSIS_JOB_TYPES } from "@/lib/job-type-diagnosis";
import { createSupabaseAdmin } from "@/lib/supabase";
import { getAuthenticatedUserId } from "@/lib/user-auth";

export const dynamic = "force-dynamic";

const HISTORY_LIMIT = 5;

function isDiagnosisJobType(value: string): value is DiagnosisJobType {
  return DIAGNOSIS_JOB_TYPES.includes(value as DiagnosisJobType);
}

function mapHistoryRow(row: {
  id: string;
  diagnosed_at: string;
  first_job_type: string;
  first_percent: number;
  second_job_type: string;
  second_percent: number;
}) {
  return {
    id: row.id,
    diagnosedAt: row.diagnosed_at,
    firstJobType: row.first_job_type,
    firstPercent: row.first_percent,
    secondJobType: row.second_job_type,
    secondPercent: row.second_percent,
  };
}

async function fetchUserHistory(userId: string) {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("user_job_type_diagnoses")
    .select(
      "id, diagnosed_at, first_job_type, first_percent, second_job_type, second_percent",
    )
    .eq("user_id", userId)
    .order("diagnosed_at", { ascending: false })
    .limit(HISTORY_LIMIT);

  if (error) throw error;
  return (data ?? []).map(mapHistoryRow);
}

async function pruneHistory(userId: string) {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("user_job_type_diagnoses")
    .select("id")
    .eq("user_id", userId)
    .order("diagnosed_at", { ascending: false });

  if (error) throw error;
  if (!data || data.length <= HISTORY_LIMIT) return;

  const staleIds = data.slice(HISTORY_LIMIT).map((row) => row.id);
  const { error: deleteError } = await supabase
    .from("user_job_type_diagnoses")
    .delete()
    .in("id", staleIds);

  if (deleteError) throw deleteError;
}

export async function GET(request: Request) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ message: "LINEログインが必要です。" }, { status: 401 });
  }

  try {
    const history = await fetchUserHistory(userId);
    return NextResponse.json({
      history,
      latest: history[0] ?? null,
      diagnosis: history[0] ?? null,
    });
  } catch (error) {
    console.error("[job-type-diagnosis] GET failed:", { userId, error });
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "取得に失敗しました。" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ message: "LINEログインが必要です。" }, { status: 401 });
  }

  const body = (await request.json()) as {
    diagnosedAt?: string;
    firstJobType?: string;
    firstPercent?: number;
    secondJobType?: string;
    secondPercent?: number;
    answers?: DiagnosisAnswers;
    resultSignature?: string;
  };

  const firstJobType = body.firstJobType?.trim() ?? "";
  const secondJobType = body.secondJobType?.trim() ?? "";

  if (
    !isDiagnosisJobType(firstJobType) ||
    !isDiagnosisJobType(secondJobType) ||
    typeof body.firstPercent !== "number" ||
    typeof body.secondPercent !== "number"
  ) {
    return NextResponse.json({ message: "診断結果が不正です。" }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from("user_job_type_diagnoses").insert({
    user_id: userId,
    diagnosed_at: body.diagnosedAt ?? new Date().toISOString(),
    first_job_type: firstJobType,
    first_percent: body.firstPercent,
    second_job_type: secondJobType,
    second_percent: body.secondPercent,
    answers: body.answers ?? {},
    result_signature: body.resultSignature ?? `${firstJobType}|${secondJobType}`,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error("[job-type-diagnosis] POST failed:", { userId, error });
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  try {
    await pruneHistory(userId);
    const history = await fetchUserHistory(userId);
    return NextResponse.json({ ok: true, history, latest: history[0] ?? null });
  } catch (pruneError) {
    console.error("[job-type-diagnosis] prune failed:", { userId, pruneError });
    return NextResponse.json({ ok: true });
  }
}
