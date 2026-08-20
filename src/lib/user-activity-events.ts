import type { SupabaseClient } from "@supabase/supabase-js";

export const USER_ACTIVITY_EVENT_TYPES = [
  "site_visit",
  "job_detail_view",
  "line_apply_click",
  "phone_apply_click",
  "job_diagnosis_complete",
  "black_shop_report",
] as const;

export type UserActivityEventType = (typeof USER_ACTIVITY_EVENT_TYPES)[number];

export type UserActivityAttribution = {
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  referrer?: string | null;
};

export type InsertUserActivityEventInput = {
  eventType: UserActivityEventType;
  shopId?: string | null;
  jobId?: string | null;
  anonymousId?: string | null;
  userId?: string | null;
  pagePath?: string | null;
  metadata?: Record<string, unknown> | null;
  /** Skip insert when a recent matching event exists (server-side dedupe). */
  dedupeWindowMs?: number | null;
};

const DEFAULT_DEDUP_MS: Partial<Record<UserActivityEventType, number>> = {
  site_visit: 30 * 60 * 1000,
  job_detail_view: 60 * 1000,
  line_apply_click: 2000,
  phone_apply_click: 2000,
};

export function isUserActivityEventType(
  value: unknown,
): value is UserActivityEventType {
  return (
    typeof value === "string" &&
    (USER_ACTIVITY_EVENT_TYPES as readonly string[]).includes(value)
  );
}

export function isUserActivityTableMissing(error: {
  message?: string;
  code?: string;
} | null): boolean {
  if (!error) return false;
  return /user_activity_events|schema cache|does not exist/i.test(
    error.message ?? "",
  );
}

function compactAttribution(
  attribution: UserActivityAttribution | null | undefined,
): Record<string, string> {
  if (!attribution) return {};
  const next: Record<string, string> = {};
  for (const key of [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "referrer",
  ] as const) {
    const value = attribution[key]?.trim();
    if (value) next[key] = value.slice(0, 500);
  }
  return next;
}

export function buildUserActivityMetadata(input: {
  attribution?: UserActivityAttribution | null;
  extra?: Record<string, unknown> | null;
}): Record<string, unknown> {
  return {
    ...compactAttribution(input.attribution),
    ...(input.extra ?? {}),
  };
}

async function hasRecentDuplicate(
  supabase: SupabaseClient,
  input: InsertUserActivityEventInput,
  windowMs: number,
): Promise<boolean> {
  const sinceIso = new Date(Date.now() - windowMs).toISOString();
  let query = supabase
    .from("user_activity_events")
    .select("id")
    .eq("event_type", input.eventType)
    .gte("created_at", sinceIso)
    .limit(1);

  if (input.anonymousId) {
    query = query.eq("anonymous_id", input.anonymousId);
  } else if (input.userId) {
    query = query.eq("user_id", input.userId);
  } else {
    return false;
  }

  if (
    input.eventType === "job_detail_view" ||
    input.eventType === "line_apply_click" ||
    input.eventType === "phone_apply_click"
  ) {
    if (!input.jobId) return false;
    query = query.eq("job_id", input.jobId);
  }

  const { data, error } = await query;
  if (error) {
    if (isUserActivityTableMissing(error)) return false;
    console.warn("[user-activity] dedupe check failed", error.message);
    return false;
  }
  return Array.isArray(data) && data.length > 0;
}

/**
 * Insert a girl-side activity event. Returns inserted=false when deduped or table missing.
 * Never throws for missing table (graceful until migration runs).
 */
export async function insertUserActivityEvent(
  supabase: SupabaseClient,
  input: InsertUserActivityEventInput,
): Promise<{ inserted: boolean; skippedReason?: string }> {
  const anonymousId = input.anonymousId?.trim().slice(0, 120) || null;
  const userId = input.userId?.trim() || null;
  const jobId = input.jobId?.trim() || null;
  const shopId = input.shopId?.trim() || jobId || null;
  const pagePath = input.pagePath?.trim().slice(0, 500) || null;
  const metadata =
    input.metadata && typeof input.metadata === "object"
      ? input.metadata
      : {};

  const dedupeWindowMs =
    input.dedupeWindowMs === undefined
      ? (DEFAULT_DEDUP_MS[input.eventType] ?? null)
      : input.dedupeWindowMs;

  if (dedupeWindowMs && dedupeWindowMs > 0) {
    try {
      const duplicate = await hasRecentDuplicate(
        supabase,
        { ...input, anonymousId, userId, jobId },
        dedupeWindowMs,
      );
      if (duplicate) {
        return { inserted: false, skippedReason: "deduped" };
      }
    } catch (error) {
      console.warn("[user-activity] dedupe exception", error);
    }
  }

  const { error } = await supabase.from("user_activity_events").insert({
    event_type: input.eventType,
    shop_id: shopId,
    job_id: jobId,
    anonymous_id: anonymousId,
    user_id: userId,
    page_path: pagePath,
    metadata,
  });

  if (error) {
    if (isUserActivityTableMissing(error)) {
      return { inserted: false, skippedReason: "table_missing" };
    }
    console.error("[user-activity] insert failed", {
      eventType: input.eventType,
      message: error.message,
      code: error.code,
    });
    throw error;
  }

  return { inserted: true };
}
