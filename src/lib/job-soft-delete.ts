import {
  isJobListingStatus,
  listingStatusToRow,
  resolveJobListingStatus,
  type JobListingStatus,
} from "@/lib/job-listing-status";

/**
 * 公開・管理一覧向け: 論理削除済み求人を除外する。
 * jobs 取得クエリに必ず付ける。
 */
export function excludeSoftDeletedJobs<
  T extends { is: (column: string, value: null) => T },
>(query: T): T {
  return query.is("deleted_at", null);
}

/** 管理者の削除済み一覧向け: 論理削除済みのみ */
export function onlySoftDeletedJobs<
  T extends { not: (column: string, operator: string, value: null) => T },
>(query: T): T {
  return query.not("deleted_at", "is", null);
}

export function isJobSoftDeleted(row: {
  deleted_at?: string | null;
  deletedAt?: string | null;
}): boolean {
  const value = row.deleted_at ?? row.deletedAt;
  return typeof value === "string" && value.trim().length > 0;
}

export function parseDeletedFromListingStatus(
  value: unknown,
): JobListingStatus | null {
  if (isJobListingStatus(value)) return value;
  return null;
}

/**
 * 論理削除時の更新内容。
 * - deleted_at を記録
 * - 削除前の listing_status を保存（表示用）
 * - 公開フラグを下ろし、既存の published=true フィルタからも外す
 * - Stripe / 請求 / 口コミ等には触れない
 */
export function buildSoftDeleteJobPatch(
  previous: {
    listing_status?: unknown;
    listingStatus?: unknown;
    published?: unknown;
  },
  now = new Date(),
): Record<string, unknown> {
  const previousStatus = resolveJobListingStatus(previous);
  return {
    deleted_at: now.toISOString(),
    deleted_from_listing_status: previousStatus,
    ...listingStatusToRow("paused"),
    updated_at: now.toISOString(),
  };
}

/**
 * 復元時の更新内容。
 * - deleted_at を解除
 * - 原則として掲載停止のまま戻す（自動公開しない）
 * - プラン・Stripe 等は変更しない
 */
export function buildSoftRestoreJobPatch(now = new Date()): Record<string, unknown> {
  return {
    deleted_at: null,
    deleted_from_listing_status: null,
    ...listingStatusToRow("paused"),
    updated_at: now.toISOString(),
  };
}
