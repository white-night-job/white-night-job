import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/api-error";
import { computeDiagnosisApplyTendency } from "@/lib/diagnosis-apply-tendency";
import { DIAGNOSIS_JOB_TYPES, type DiagnosisJobType } from "@/lib/job-type-diagnosis-types";

export const dynamic = "force-dynamic";

function isDiagnosisJobType(value: string): value is DiagnosisJobType {
  return (DIAGNOSIS_JOB_TYPES as readonly string[]).includes(value);
}

export async function GET(request: Request) {
  const firstJobType = new URL(request.url).searchParams.get("firstJobType")?.trim() ?? "";
  if (!isDiagnosisJobType(firstJobType)) {
    return NextResponse.json({ status: "insufficient" });
  }

  try {
    const tendency = await computeDiagnosisApplyTendency(firstJobType);
    return NextResponse.json(tendency);
  } catch (error) {
    console.error("[job-type-diagnosis/apply-tendency]", error);
    return NextResponse.json(
      {
        status: "insufficient",
        message: getErrorMessage(error, "利用傾向の集計に失敗しました。"),
      },
      { status: 200 },
    );
  }
}
