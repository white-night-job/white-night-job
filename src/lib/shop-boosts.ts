import type { SupabaseClient } from "@supabase/supabase-js";

export const DAILY_BOOST_LIMIT = 5;
const TOKYO_TIME_ZONE = "Asia/Tokyo";

export type BoostStats = {
  todayCount: number;
  latestBoostAt: string | null;
};

export type BoostStatsMap = Record<string, BoostStats>;

type BoostRow = {
  job_id: string;
  boosted_at: string;
};

type SortableJobRow = {
  id: string;
  created_at: string;
};

export function getTokyoDayBounds(now = new Date()): {
  startIso: string;
  endIso: string;
} {
  const dateKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: TOKYO_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const nextDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: TOKYO_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(`${dateKey}T12:00:00+09:00`).getTime() + 24 * 60 * 60 * 1000);

  return {
    startIso: new Date(`${dateKey}T00:00:00+09:00`).toISOString(),
    endIso: new Date(`${nextDate}T00:00:00+09:00`).toISOString(),
  };
}

export function compareJobsForListing(
  aId: string,
  bId: string,
  boostMap: BoostStatsMap,
  aCreatedAt: string,
  bCreatedAt: string,
  aListingPriority = 1,
  bListingPriority = 1,
): number {
  if (aListingPriority !== bListingPriority) {
    return bListingPriority - aListingPriority;
  }

  const a = boostMap[aId] ?? { todayCount: 0, latestBoostAt: null };
  const b = boostMap[bId] ?? { todayCount: 0, latestBoostAt: null };

  if (a.todayCount !== b.todayCount) {
    return b.todayCount - a.todayCount;
  }

  if (a.latestBoostAt && b.latestBoostAt) {
    const diff =
      new Date(b.latestBoostAt).getTime() - new Date(a.latestBoostAt).getTime();
    if (diff !== 0) return diff;
  } else if (a.latestBoostAt) {
    return -1;
  } else if (b.latestBoostAt) {
    return 1;
  }

  return new Date(bCreatedAt).getTime() - new Date(aCreatedAt).getTime();
}

export function sortJobRowsByBoost<T extends SortableJobRow>(
  rows: T[],
  boostMap: BoostStatsMap,
): T[] {
  return [...rows].sort((a, b) =>
    compareJobsForListing(a.id, b.id, boostMap, a.created_at, b.created_at),
  );
}

export function calculateDistrictRank(
  jobId: string,
  districtJobs: SortableJobRow[],
  boostMap: BoostStatsMap,
): { rank: number; total: number } {
  const sorted = sortJobRowsByBoost(districtJobs, boostMap);
  const index = sorted.findIndex((job) => job.id === jobId);
  return {
    rank: index >= 0 ? index + 1 : districtJobs.length,
    total: districtJobs.length,
  };
}

function emptyBoostStatsMap(jobIds: string[]): BoostStatsMap {
  return Object.fromEntries(
    jobIds.map((id) => [id, { todayCount: 0, latestBoostAt: null }]),
  );
}

export async function fetchBoostStatsForJobs(
  supabase: SupabaseClient,
  jobIds: string[],
): Promise<BoostStatsMap> {
  if (jobIds.length === 0) return {};

  const map = emptyBoostStatsMap(jobIds);
  const { startIso, endIso } = getTokyoDayBounds();

  try {
    const { data, error } = await supabase
      .from("shop_boosts")
      .select("job_id, boosted_at")
      .in("job_id", jobIds)
      .gte("boosted_at", startIso)
      .lt("boosted_at", endIso);

    if (error) throw error;

    for (const row of (data ?? []) as BoostRow[]) {
      const stats = map[row.job_id];
      if (!stats) continue;
      stats.todayCount += 1;
      if (!stats.latestBoostAt || row.boosted_at > stats.latestBoostAt) {
        stats.latestBoostAt = row.boosted_at;
      }
    }
  } catch {
    return emptyBoostStatsMap(jobIds);
  }

  return map;
}

export async function countTodayBoosts(
  supabase: SupabaseClient,
  jobId: string,
): Promise<number> {
  const stats = await fetchBoostStatsForJobs(supabase, [jobId]);
  return stats[jobId]?.todayCount ?? 0;
}

export async function insertShopBoost(
  supabase: SupabaseClient,
  jobId: string,
): Promise<void> {
  const { error } = await supabase.from("shop_boosts").insert({ job_id: jobId });
  if (error) throw error;
}
