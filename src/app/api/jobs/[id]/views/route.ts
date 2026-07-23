import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/api-error";
import {
  insertAnalyticsEvent,
  isInternalAnalyticsRequest,
} from "@/lib/job-analytics";
import { insertJobViewRow } from "@/lib/insert-job-view";
import { createSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { id: jobId } = await params;
    const body = (await request.json().catch(() => ({}))) as {
      referrer?: string | null;
      sessionId?: string | null;
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
      request.headers.get("referer") ?? (body.referrer?.trim() || null);
    const isInternal = isInternalAnalyticsRequest(request);

    // Parallel writes — must not block the detail page (client already deferred).
    const tasks: Promise<unknown>[] = [];

    if (!isInternal) {
      tasks.push(
        insertJobViewRow(supabase, {
          jobId,
          userAgent,
          referrer,
        }),
      );
    }

    tasks.push(
      insertAnalyticsEvent(supabase, {
        jobId,
        eventType: "job_detail_click",
        sessionId: body.sessionId,
        referrer,
        userAgent,
        isInternal,
      }).catch(() => {
        // Analytics table may be missing until SQL migration.
      }),
    );

    await Promise.all(tasks);

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("job views API error:", error);
    return NextResponse.json(
      { message: getErrorMessage(error, "表示回数の記録に失敗しました。") },
      { status: 500 },
    );
  }
}
