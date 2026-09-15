import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/api-error";
import { isInternalAnalyticsRequest } from "@/lib/job-analytics";
import { upsertSiteVisitor } from "@/lib/site-visitors";
import { createSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * Public ping for unique-visitor counting (not pageviews).
 * Admin / shop cookie traffic is ignored.
 */
export async function POST(request: Request) {
  try {
    if (isInternalAnalyticsRequest(request)) {
      return NextResponse.json({ ok: true, skipped: "internal" });
    }

    const body = (await request.json().catch(() => ({}))) as {
      visitorId?: unknown;
      userId?: unknown;
      pagePath?: unknown;
    };

    const visitorId = String(body.visitorId ?? "").trim();
    if (!visitorId || visitorId.length > 80) {
      return NextResponse.json(
        { message: "visitorId が不正です。" },
        { status: 400 },
      );
    }

    const userIdRaw = String(body.userId ?? "").trim();
    const userId =
      userIdRaw &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        userIdRaw,
      )
        ? userIdRaw
        : null;

    const supabase = createSupabaseAdmin();
    await upsertSiteVisitor(supabase, { visitorId, userId });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[site-visitors/ping]", error);
    return NextResponse.json(
      { message: getErrorMessage(error, "訪問記録に失敗しました。") },
      { status: 500 },
    );
  }
}
