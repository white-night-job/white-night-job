import { listingStatusToRow } from "@/lib/job-listing-status";

/** Supabase PostgrestFilterBuilder 互換の最小型 */
type SoftDeleteFilterable<T> = {
  is: (column: string, value: null) => T;
};

/**
 * 公開・管理一覧向け: 論理削除済み求人を除外する。
 * jobs 取得クエリに必ず付ける。
 */
export function excludeSoftDeletedJobs<T>(query: SoftDeleteFilterable<T>): T {
  return query.is("deleted_at", null);
}

export function isJobSoftDeleted(row: {
  deleted_at?: string | null;
  deletedAt?: string | null;
}): boolean {
  const value = row.deleted_at ?? row.deletedAt;
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * 論理削除時の更新内容。
 * - deleted_at を記録
 * - 公開フラグを下ろし、既存の published=true フィルタからも外す
 * - Stripe / 請求 / 口コミ等には触れない
 */
export function buildSoftDeleteJobPatch(now = new Date()): Record<string, unknown> {
  return {
    deleted_at: now.toISOString(),
    ...listingStatusToRow("paused"),
    updated_at: now.toISOString(),
  };
}
