import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getErrorMessage } from "@/lib/api-error";
import { listLineContactsWithShops } from "@/lib/shop-line-link";
import { createSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/** 公式LINEの Webhook で取得した連絡先一覧（店舗紐付けの候補）。 */
export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ message: "ログインしてください。" }, { status: 401 });
  }

  try {
    const result = await listLineContactsWithShops(createSupabaseAdmin());
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "LINEユーザー一覧の取得に失敗しました。") },
      { status: 500 },
    );
  }
}
