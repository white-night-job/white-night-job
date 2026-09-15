import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/api-error";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { fetchUniqueUserCounts } from "@/lib/site-visitors";
import { createSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ message: "ログインしてください。" }, { status: 401 });
  }

  try {
    const supabase = createSupabaseAdmin();
    const counts = await fetchUniqueUserCounts(supabase);
    return NextResponse.json({
      today: counts.today,
      last7Days: counts.last7Days,
      last30Days: counts.last30Days,
      total: counts.total,
      note: "同一visitor_idは期間内に何度アクセスしても1ユーザーとして集計しています。",
    });
  } catch (error) {
    console.error("[admin/unique-users]", error);
    return NextResponse.json(
      { message: getErrorMessage(error, "ユニークユーザー数の取得に失敗しました。") },
      { status: 500 },
    );
  }
}
