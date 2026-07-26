/**
 * Columns needed to render a job as a card in mypage (favorites / history).
 * Heavy detail text and jsonb columns are intentionally excluded.
 */
export const USER_JOB_CARD_COLUMNS = [
  "id",
  "shop_name",
  "district",
  "job_type",
  "title",
  "salary",
  "work_hours",
  "image_url",
  "is_verified",
  "line_url",
  "posted_at",
  "created_at",
  "pickup_enabled",
  "listing_priority",
  "plan",
].join(", ");

/** Clamp a user supplied `limit` query value. */
export function parseCardLimit(
  raw: string | null,
  fallback: number,
  max = 50,
): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(Math.trunc(parsed), max);
}
