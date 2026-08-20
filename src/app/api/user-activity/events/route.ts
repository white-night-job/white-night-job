import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/api-error";
import { isInternalAnalyticsRequest } from "@/lib/job-analytics";
import {
  buildUserActivityMetadata,
  insertUserActivityEvent,
  isUserActivityEventType,
  type UserActivityAttribution,
} from "@/lib/user-activity-events";
import { createSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * Public endpoint for girl-side activity events (login not required).
 * Admin/shop cookie traffic is ignored. Aggregates are admin-only via
 * /api/admin/user-activity.
 */
export async function POST(request: Request) {
  try {
    if (isInternalAnalyticsRequest(request)) {
      return NextResponse.json({ ok: true, inserted: false, skipped: "internal" });
    }

    const body = (await request.json().catch(() => ({}))) as {
      eventType?: unknown;
      jobId?: string | null;
      shopId?: string | null;
      anonymousId?: string | null;
      userId?: string | null;
      pagePath?: string | null;
      attribution?: UserActivityAttribution | null;
      metadata?: Record<string, unknown> | null;
    };

    if (!isUserActivityEventType(body.eventType)) {
      return NextResponse.json(
        { message: "eventType が不正です。" },
        { status: 400 },
      );
    }

    const eventType = body.eventType;
    if (
      (eventType === "job_detail_view" ||
        eventType === "line_apply_click" ||
        eventType === "phone_apply_click") &&
      !body.jobId?.trim()
    ) {
      return NextResponse.json(
        { message: "jobId が必要です。" },
        { status: 400 },
      );
    }

    const supabase = createSupabaseAdmin();
    const result = await insertUserActivityEvent(supabase, {
      eventType,
      jobId: body.jobId,
      shopId: body.shopId,
      anonymousId: body.anonymousId,
      userId: body.userId,
      pagePath: body.pagePath,
      metadata: buildUserActivityMetadata({
        attribution: body.attribution,
        extra: body.metadata,
      }),
    });

    return NextResponse.json(
      { ok: true, inserted: result.inserted, skippedReason: result.skippedReason },
      { status: result.inserted ? 201 : 200 },
    );
  } catch (error) {
    console.error("[user-activity/events]", error);
    return NextResponse.json(
      {
        message: getErrorMessage(error, "行動ログの記録に失敗しました。"),
      },
      { status: 500 },
    );
  }
}
