import { DISTRICTS } from "@/data/districts";
import { normalizePreferredAreas } from "@/lib/preferred-areas";
import { createSupabaseAdmin } from "@/lib/supabase";
import type { District } from "@/types/job";

/**
 * 通知の対象エリアは、マイページ上部の「希望エリア」（users.preferred_areas）を使う。
 * 希望エリア未設定のユーザーは全エリアが対象。
 * 旧通知設定の地域（user_notification_areas）は配信に使わない。
 */

function isPreferredAreasColumnMissing(error: { message?: string } | null): boolean {
  return /preferred_areas|schema cache|does not exist/i.test(error?.message ?? "");
}

/** 希望エリアが未設定（空）の場合は全エリアを返す */
export function resolveNotificationTargetAreas(
  preferredAreas: readonly District[] | undefined,
): District[] {
  return preferredAreas && preferredAreas.length > 0
    ? [...preferredAreas]
    : [...DISTRICTS];
}

/**
 * ユーザーごとの希望エリアを取得する。未設定のユーザーは Map に含めない。
 * preferred_areas 列が未作成の環境では全員未設定として扱う。
 */
export async function fetchPreferredAreasByUser(
  userIds: readonly string[],
): Promise<Map<string, District[]>> {
  const byUser = new Map<string, District[]>();
  if (userIds.length === 0) return byUser;

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("users")
    .select("id, preferred_areas")
    .in("id", [...userIds]);

  if (error) {
    if (isPreferredAreasColumnMissing(error)) {
      console.warn("[notification-target-areas] preferred_areas column missing; all areas used");
      return byUser;
    }
    throw error;
  }

  for (const row of data ?? []) {
    const areas = normalizePreferredAreas(
      (row as { preferred_areas?: unknown }).preferred_areas,
    );
    if (areas.length > 0) byUser.set(row.id as string, areas);
  }
  return byUser;
}

export async function fetchUserNotificationTargetAreas(userId: string): Promise<District[]> {
  const byUser = await fetchPreferredAreasByUser([userId]);
  return resolveNotificationTargetAreas(byUser.get(userId));
}
