import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/api-error";
import {
  insertAnalyticsEvent,
  isAnalyticsEventType,
  isInternalAnalyticsRequest,
} from "@/lib/job-analytics";
import { createSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      jobId?: string;
      eventType?: string;
      sessionId?: string | null;
      referrer?: string | null;
    };

    const jobId = body.jobId?.trim();
    if (!jobId) {
      return NextResponse.json({ message: "jobId is required" }, { status: 400 });
    }
    if (!isAnalyticsEventType(body.eventType)) {
      return NextResponse.json({ message: "invalid eventType" }, { status: 400 });
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

    const isInternal = isInternalAnalyticsRequest(request);
    const userAgent = request.headers.get("user-agent");
    const referrer =
      request.headers.get("referer") ?? (body.referrer?.trim() || null);

    await insertAnalyticsEvent(supabase, {
      jobId,
      eventType: body.eventType,
      sessionId: body.sessionId,
      referrer,
      userAgent,
      isInternal,
    });

    return NextResponse.json({ ok: true, isInternal }, { status: 201 });
  } catch (error) {
    console.error("[analytics/events]", error);
    return NextResponse.json(
      { message: getErrorMessage(error, "イベントの記録に失敗しました。") },
      { status: 500 },
    );
  }
}
