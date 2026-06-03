import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/api-error";
import type { JobApplicationType } from "@/lib/job-applications";
import { createSupabaseAdmin } from "@/lib/supabase";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function isApplicationType(value: unknown): value is JobApplicationType {
  return value === "line" || value === "phone";
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { id: jobId } = await params;
    const body = (await request.json()) as { type?: unknown };

    if (!isApplicationType(body.type)) {
      return NextResponse.json(
        { message: "応募種別が不正です。" },
        { status: 400 },
      );
    }

    const supabase = createSupabaseAdmin();
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id")
      .eq("id", jobId)
      .eq("published", true)
      .maybeSingle();

    if (jobError) throw jobError;
    if (!job) {
      return NextResponse.json({ message: "求人が見つかりません。" }, { status: 404 });
    }

    const { error } = await supabase.from("job_applications").insert({
      job_id: jobId,
      type: body.type,
    });

    if (error) throw error;

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "応募の記録に失敗しました。") },
      { status: 500 },
    );
  }
}
