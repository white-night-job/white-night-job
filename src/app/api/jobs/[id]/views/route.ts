import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/api-error";
import { createSupabaseAdmin } from "@/lib/supabase";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { id: jobId } = await params;
    const body = (await request.json().catch(() => ({}))) as {
      referrer?: string | null;
    };

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

    const userAgent = request.headers.get("user-agent");
    const referrer =
      request.headers.get("referer") ??
      (body.referrer?.trim() || null);

    const { error } = await supabase.from("job_views").insert({
      job_id: jobId,
      user_agent: userAgent,
      referrer,
    });

    if (error) throw error;

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "表示回数の記録に失敗しました。") },
      { status: 500 },
    );
  }
}
