import { NextResponse } from "next/server";
import type { DiagnosisAnswers, DiagnosisJobType } from "@/lib/job-type-diagnosis";
import { DIAGNOSIS_JOB_TYPES } from "@/lib/job-type-diagnosis";
import { createSupabaseAdmin } from "@/lib/supabase";
import { getAuthenticatedUserId } from "@/lib/user-auth";

export const dynamic = "force-dynamic";

function isDiagnosisJobType(value: string): value is DiagnosisJobType {
  return DIAGNOSIS_JOB_TYPES.includes(value as DiagnosisJobType);
}

export async function GET(request: Request) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ message: "LINEログインが必要です。" }, { status: 401 });
  }

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("user_job_type_diagnoses")
    .select(
      "diagnosed_at, first_job_type, first_percent, second_job_type, second_percent",
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[job-type-diagnosis] GET failed:", { userId, error });
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ diagnosis: null });
  }

  return NextResponse.json({
    diagnosis: {
      diagnosedAt: data.diagnosed_at,
      firstJobType: data.first_job_type,
      firstPercent: data.first_percent,
      secondJobType: data.second_job_type,
      secondPercent: data.second_percent,
    },
  });
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
  const { error } = await supabase.from("user_job_type_diagnoses").upsert(
    {
      user_id: userId,
      diagnosed_at: body.diagnosedAt ?? new Date().toISOString(),
      first_job_type: firstJobType,
      first_percent: body.firstPercent,
      second_job_type: secondJobType,
      second_percent: body.secondPercent,
      answers: body.answers ?? {},
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    console.error("[job-type-diagnosis] POST failed:", { userId, error });
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
