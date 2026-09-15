import type { SupabaseClient } from "@supabase/supabase-js";

const TOKYO = "Asia/Tokyo";

function jstYmd(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TOKYO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "00";
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
  };
}

function jstDayStartIso(year: number, month: number, day: number) {
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return new Date(`${year}-${mm}-${dd}T00:00:00+09:00`).toISOString();
}

function addDays(year: number, month: number, day: number, delta: number) {
  const base = new Date(
    `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T12:00:00+09:00`,
  );
  base.setDate(base.getDate() + delta);
  return jstYmd(base);
}

export type UniqueUserCounts = {
  today: number;
  last7Days: number;
  last30Days: number;
  total: number;
};

export function getUniqueUserRangeStarts(now = new Date()): {
  todayStartIso: string;
  last7StartIso: string;
  last30StartIso: string;
} {
  const today = jstYmd(now);
  const d7 = addDays(today.year, today.month, today.day, -6);
  const d30 = addDays(today.year, today.month, today.day, -29);
  return {
    todayStartIso: jstDayStartIso(today.year, today.month, today.day),
    last7StartIso: jstDayStartIso(d7.year, d7.month, d7.day),
    last30StartIso: jstDayStartIso(d30.year, d30.month, d30.day),
  };
}

function isMissingTableError(error: { message?: string; code?: string } | null) {
  if (!error) return false;
  const message = (error.message ?? "").toLowerCase();
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    (message.includes("site_visitors") && message.includes("does not exist")) ||
    message.includes("could not find the table")
  );
}

/** Upsert by visitor_id: create on first visit, bump last_seen_at afterwards. */
export async function upsertSiteVisitor(
  supabase: SupabaseClient,
  input: { visitorId: string; userId?: string | null },
): Promise<void> {
  const visitorId = input.visitorId.trim().slice(0, 80);
  if (!visitorId) return;

  const nowIso = new Date().toISOString();
  const userId = input.userId?.trim() || null;

  const { data: existing, error: selectError } = await supabase
    .from("site_visitors")
    .select("id, user_id")
    .eq("visitor_id", visitorId)
    .maybeSingle();

  if (selectError) {
    if (isMissingTableError(selectError)) {
      console.warn("[site-visitors] table missing — run add-site-visitors-table.sql");
      return;
    }
    throw selectError;
  }

  if (existing?.id) {
    const patch: Record<string, unknown> = { last_seen_at: nowIso };
    if (userId && !existing.user_id) {
      patch.user_id = userId;
    }
    const { error: updateError } = await supabase
      .from("site_visitors")
      .update(patch)
      .eq("id", existing.id);
    if (updateError) throw updateError;
    return;
  }

  const { error: insertError } = await supabase.from("site_visitors").insert({
    visitor_id: visitorId,
    user_id: userId,
    first_seen_at: nowIso,
    last_seen_at: nowIso,
  });

  if (insertError) {
    // Race: another request inserted the same visitor_id.
    if (insertError.code === "23505") {
      const { error: retryError } = await supabase
        .from("site_visitors")
        .update({
          last_seen_at: nowIso,
          ...(userId ? { user_id: userId } : {}),
        })
        .eq("visitor_id", visitorId);
      if (retryError) throw retryError;
      return;
    }
    throw insertError;
  }
}

async function countVisitorsSince(
  supabase: SupabaseClient,
  sinceIso: string | null,
): Promise<number> {
  let query = supabase
    .from("site_visitors")
    .select("id", { count: "exact", head: true });

  if (sinceIso) {
    query = query.gte("last_seen_at", sinceIso);
  }

  const { count, error } = await query;
  if (error) {
    if (isMissingTableError(error)) return 0;
    throw error;
  }
  return count ?? 0;
}

export async function fetchUniqueUserCounts(
  supabase: SupabaseClient,
  now = new Date(),
): Promise<UniqueUserCounts> {
  const { todayStartIso, last7StartIso, last30StartIso } =
    getUniqueUserRangeStarts(now);

  const [today, last7Days, last30Days, total] = await Promise.all([
    countVisitorsSince(supabase, todayStartIso),
    countVisitorsSince(supabase, last7StartIso),
    countVisitorsSince(supabase, last30StartIso),
    countVisitorsSince(supabase, null),
  ]);

  return { today, last7Days, last30Days, total };
}
