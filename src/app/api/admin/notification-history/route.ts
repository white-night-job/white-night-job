import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getErrorMessage } from "@/lib/api-error";
import { createSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<string, string> = {
  auto_new_job: "新着求人通知",
  auto_favorite_update: "お気に入り店舗通知",
  auto_pickup_top: "PickUp店舗通知",
};

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ message: "ログインしてください。" }, { status: 401 });
  }

  try {
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("line_notification_batches")
      .select("*")
      .order("sent_at", { ascending: false })
      .limit(100);

    if (error) throw error;

    const history = (data ?? []).map((row) => ({
      id: row.id,
      sentAt: row.sent_at,
      shopName: row.shop_name ?? "—",
      jobId: row.job_id,
      notifyType: row.notify_type,
      notifyTypeLabel: TYPE_LABELS[row.notify_type] ?? row.notify_type,
      targetCount: row.target_count ?? 0,
      successCount: row.success_count ?? 0,
      failCount: row.fail_count ?? 0,
      detail: row.detail ?? null,
    }));

    return NextResponse.json({ history });
  } catch (error) {
    return NextResponse.json(
      {
        message: getErrorMessage(error, "LINE通知履歴の取得に失敗しました。"),
        history: [],
      },
      { status: 500 },
    );
  }
}
