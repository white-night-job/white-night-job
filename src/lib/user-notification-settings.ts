import { createSupabaseAdmin } from "@/lib/supabase";

/**
 * 初回作成時のみ使う通知ONの初期値。
 * 既存レコードがある場合は絶対に上書きしないこと。
 */
export const DEFAULT_ON_NOTIFICATION_SETTINGS = {
  notify_new_jobs: true,
  notify_pickup_jobs: true,
  notify_favorite_updates: true,
  /** 毎日20時のPickUpおすすめ配信 */
  notify_daily_pickup: true,
  min_hourly_wage: 0,
} as const;

export type EnsureNotificationSettingsResult = {
  created: boolean;
  userId: string;
};

/**
 * 通知設定レコードが無いときだけ、全通知ONの初期行をINSERTする。
 * - 既存ON/OFFは維持（UPDATEしない）
 * - user_id 一意制約 + ignoreDuplicates で二重作成を防ぐ
 * - 友だち追加完了後のログイン完了時に呼ぶこと
 */
export async function ensureUserNotificationSettings(
  userId: string,
): Promise<EnsureNotificationSettingsResult> {
  const supabase = createSupabaseAdmin();

  const { data: existing, error: existingError } = await supabase
    .from("user_notification_settings")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existingError) {
    console.error("[notification-settings] ensure select failed", {
      userId,
      message: existingError.message,
      code: existingError.code,
    });
    throw existingError;
  }

  if (existing) {
    return { created: false, userId };
  }

  const { error: insertError } = await supabase
    .from("user_notification_settings")
    .upsert(
      {
        user_id: userId,
        ...DEFAULT_ON_NOTIFICATION_SETTINGS,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id", ignoreDuplicates: true },
    );

  if (insertError) {
    console.error("[notification-settings] ensure insert failed", {
      userId,
      message: insertError.message,
      code: insertError.code,
    });
    throw insertError;
  }

  // 競合で ignore された場合も含め、作成試行後に存在確認
  const { data: after } = await supabase
    .from("user_notification_settings")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  return { created: Boolean(after), userId };
}
