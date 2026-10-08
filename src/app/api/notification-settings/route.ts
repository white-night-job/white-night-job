import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { getAuthenticatedUserId } from "@/lib/user-auth";
import { ensureUserNotificationSettings } from "@/lib/user-notification-settings";

export const dynamic = "force-dynamic";

/**
 * 通知のON/OFFのみを扱う。対象エリアはマイページの希望エリア（/api/preferred-areas）を使う。
 * 旧クライアントから地域・職種・最低時給が送られてきても無視する。
 */
type SettingsPayload = {
  notifyNewJobs?: boolean;
  notifyPickupJobs?: boolean;
  notifyFavoriteUpdates?: boolean;
  notifyDailyPickup?: boolean;
};

async function getOrCreateSettingsRow(userId: string) {
  await ensureUserNotificationSettings(userId);
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("user_notification_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    throw new Error("通知設定の初期化に失敗しました。");
  }
  return data;
}

export async function GET(request: Request) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ message: "LINEログインが必要です。" }, { status: 401 });
  }
  try {
    const row = await getOrCreateSettingsRow(userId);
    return NextResponse.json({
      notifyNewJobs: row.notify_new_jobs,
      notifyPickupJobs: row.notify_pickup_jobs,
      notifyFavoriteUpdates: row.notify_favorite_updates,
      notifyDailyPickup: row.notify_daily_pickup ?? false,
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "設定取得に失敗しました。" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ message: "LINEログインが必要です。" }, { status: 401 });
  }
  const payload = (await request.json().catch(() => ({}))) as SettingsPayload;
  const supabase = createSupabaseAdmin();

  const { data, error } = await supabase
    .from("user_notification_settings")
    .upsert(
      {
        user_id: userId,
        notify_new_jobs: payload.notifyNewJobs ?? true,
        notify_pickup_jobs: payload.notifyPickupJobs ?? true,
        notify_favorite_updates: payload.notifyFavoriteUpdates ?? true,
        notify_daily_pickup: payload.notifyDailyPickup ?? false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )
    .select("*")
    .single();
  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    notifyNewJobs: data.notify_new_jobs,
    notifyPickupJobs: data.notify_pickup_jobs,
    notifyFavoriteUpdates: data.notify_favorite_updates,
    notifyDailyPickup: data.notify_daily_pickup ?? false,
  });
}
