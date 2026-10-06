import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/api-error";
import { recordSalesStyleDiagnosisCompleted } from "@/lib/sales-style-diagnosis-events";

export const dynamic = "force-dynamic";

/**
 * 営業スタイル診断の結果画面到達を匿名で記録する。
 * 個人を特定する情報は受け取らない。DB 書き込みは service_role。
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      sessionId?: string;
      completionKey?: string;
      mainType?: string;
      subType?: string | null;
    };

    const sessionId = body.sessionId?.trim();
    const completionKey = body.completionKey?.trim();
    if (!sessionId || !completionKey) {
      return NextResponse.json(
        { message: "sessionId and completionKey are required" },
        { status: 400 },
      );
    }

    const result = await recordSalesStyleDiagnosisCompleted({
      sessionId,
      completionKey,
      mainType: body.mainType ?? null,
      subType: body.subType ?? null,
      userAgent: request.headers.get("user-agent"),
    });

    return NextResponse.json({ ok: true, inserted: result.inserted });
  } catch (error) {
    console.error("[sales-style-diagnosis/complete]", error);
    return NextResponse.json(
      { message: getErrorMessage(error, "診断完了の記録に失敗しました。") },
      { status: 500 },
    );
  }
}
