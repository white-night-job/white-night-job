import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/api-error";
import { recordJobDiagnosisCompleted } from "@/lib/job-diagnosis-events";

export const dynamic = "force-dynamic";

/**
 * 職種診断の結果画面到達を匿名で記録する。
 * ログイン不要。個人を特定する情報は受け取らない。
 * DB 書き込みは service_role（RLS バイパス）。event_type はサーバー固定。
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      sessionId?: string;
      completionKey?: string;
      resultJobType?: string;
      area?: string;
      anonymousId?: string;
      pagePath?: string;
      // クライアントからの event_type 指定は無視する
      event_type?: unknown;
      eventType?: unknown;
    };

    const sessionId = body.sessionId?.trim();
    const completionKey = body.completionKey?.trim();
    if (!sessionId || !completionKey) {
      return NextResponse.json(
        { message: "sessionId and completionKey are required" },
        { status: 400 },
      );
    }

    const result = await recordJobDiagnosisCompleted({
      sessionId,
      completionKey,
      resultJobType: body.resultJobType ?? null,
      area: body.area ?? null,
      userAgent: request.headers.get("user-agent"),
      anonymousId: body.anonymousId ?? null,
      pagePath: body.pagePath ?? null,
    });

    return NextResponse.json({ ok: true, inserted: result.inserted });
  } catch (error) {
    console.error("[job-type-diagnosis/complete]", error);
    return NextResponse.json(
      {
        message: getErrorMessage(error, "診断完了の記録に失敗しました。"),
      },
      { status: 500 },
    );
  }
}
