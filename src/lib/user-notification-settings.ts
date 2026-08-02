import { NOTIFICATION_AREA_OPTIONS } from "@/lib/notification-areas";
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
 * 新規ユーザー向けに地域をすべて選択済みで保存する。
 * 既存エリア行がある場合は何もしない。
 */
async function seedDefaultNotificationAreas(userId: string): Promise<void> {
  const supabase = createSupabaseAdmin();
  const { data: existingAreas, error: selectError } = await supabase
    .from("user_notification_areas")
    .select("area")
    .eq("user_id", userId)
    .limit(1);

  if (selectError) {
    console.error("[notification-settings] default areas select failed", {
      userId,
      message: selectError.message,
      code: selectError.code,
    });
    throw selectError;
  }

  if ((existingAreas ?? []).length > 0) return;

  const { error: insertError } = await supabase
    .from("user_notification_areas")
    .upsert(
      NOTIFICATION_AREA_OPTIONS.map((area) => ({
        user_id: userId,
        area,
      })),
      { onConflict: "user_id,area", ignoreDuplicates: true },
    );

  if (insertError) {
    console.error("[notification-settings] default areas insert failed", {
      userId,
      message: insertError.message,
      code: insertError.code,
    });
    throw insertError;
  }
}

/**
 * 通知設定レコードが無いときだけ、全通知ON＋地域全選択の初期行をINSERTする。
 * - 既存ON/OFF・既存地域選択は維持（UPDATEしない）
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

  if (!after) {
    return { created: false, userId };
  }

  // このパスは「設定行が無かった新規ユーザー」専用。
  // 既存ユーザーには来ないので、地域未設定なら全選択を入れる。
  await seedDefaultNotificationAreas(userId);

  return { created: true, userId };
}
