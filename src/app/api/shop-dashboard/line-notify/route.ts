import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/api-error";
import { SESSION_EXPIRED_MESSAGE } from "@/lib/auth-session-messages";
import { getAuthenticatedShopJobId } from "@/lib/shop-auth";
import { getShopLineLink } from "@/lib/shop-line-link";
import { createSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/** 店舗側は表示のみ（設定は運営管理画面で行う）。LINE userId は返さない。 */
export async function GET() {
  const jobId = await getAuthenticatedShopJobId();
  if (!jobId) {
    return NextResponse.json({ message: SESSION_EXPIRED_MESSAGE }, { status: 401 });
  }

  try {
    const link = await getShopLineLink(createSupabaseAdmin(), jobId);
    return NextResponse.json(
      { linked: link.linked },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "LINE通知設定の取得に失敗しました。") },
      { status: 500 },
    );
  }
}
