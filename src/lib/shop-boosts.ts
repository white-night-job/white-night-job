import type { SupabaseClient } from "@supabase/supabase-js";
import { parseJobPlan, type JobPlan } from "@/lib/job-plan";

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

/** 公開一覧・地区内順位の並び替えに使う最小フィールド */
export type SortableJobRow = {
  id: string;
  created_at: string;
  updated_at?: string | null;
  plan?: string | null;
};

export type ListingSortKey = {
  id: string;
  plan?: JobPlan | string | null;
  createdAt: string;
  updatedAt?: string | null;
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

export function isBoostedToday(stats: BoostStats | undefined | null): boolean {
  return (stats?.todayCount ?? 0) > 0;
}

/**
 * 表示グループ優先度（大きいほど上）。
 * 1. プレミアム＋上位表示中
 * 2. プレミアム通常
 * 3. スタンダード＋上位表示中
 * 4. ライト＋上位表示中
 * 5. スタンダード通常
 * 6. ライト通常
 */
export function listingDisplayGroupRank(
  plan: JobPlan | string | null | undefined,
  boosted: boolean,
): number {
  const normalized = parseJobPlan(plan);
  if (normalized === "premium") return boosted ? 6 : 5;
  if (normalized === "standard") return boosted ? 4 : 2;
  return boosted ? 3 : 1;
}

function toSortKey(row: SortableJobRow): ListingSortKey {
  return {
    id: row.id,
    plan: row.plan,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * 求人一覧・検索・地区内順位の共通比較。
 * グループ内は既存の上位表示ロジック → 更新日時 → 作成日時 → ID。
 */
export function compareJobsForListing(
  a: ListingSortKey,
  b: ListingSortKey,
  boostMap: BoostStatsMap,
): number {
  const aBoost = boostMap[a.id] ?? { todayCount: 0, latestBoostAt: null };
  const bBoost = boostMap[b.id] ?? { todayCount: 0, latestBoostAt: null };
  const aBoosted = isBoostedToday(aBoost);
  const bBoosted = isBoostedToday(bBoost);

  const groupDiff =
    listingDisplayGroupRank(b.plan, bBoosted) -
    listingDisplayGroupRank(a.plan, aBoosted);
  if (groupDiff !== 0) return groupDiff;

  // 同じグループ内：既存の上位表示ロジック（回数 → 最新ブースト時刻）
  if (aBoost.todayCount !== bBoost.todayCount) {
    return bBoost.todayCount - aBoost.todayCount;
  }

  if (aBoost.latestBoostAt && bBoost.latestBoostAt) {
    const boostTimeDiff =
      new Date(bBoost.latestBoostAt).getTime() -
      new Date(aBoost.latestBoostAt).getTime();
    if (boostTimeDiff !== 0) return boostTimeDiff;
  } else if (aBoost.latestBoostAt) {
    return -1;
  } else if (bBoost.latestBoostAt) {
    return 1;
  }

  const aUpdated = a.updatedAt ?? a.createdAt;
  const bUpdated = b.updatedAt ?? b.createdAt;
  const updatedDiff =
    new Date(bUpdated).getTime() - new Date(aUpdated).getTime();
  if (updatedDiff !== 0) return updatedDiff;

  const createdDiff =
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  if (createdDiff !== 0) return createdDiff;

  return a.id.localeCompare(b.id);
}

export function sortJobRowsByBoost<T extends SortableJobRow>(
  rows: T[],
  boostMap: BoostStatsMap,
): T[] {
  return [...rows].sort((a, b) =>
    compareJobsForListing(toSortKey(a), toSortKey(b), boostMap),
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

  // Denormalized mirrors for ops/debug. Never touch listing_priority.
  const todayCount = await countTodayBoosts(supabase, jobId);
  const { error: updateError } = await supabase
    .from("jobs")
    .update({
      boost_count: todayCount,
      last_boost_at: new Date().toISOString(),
    })
    .eq("id", jobId);

  if (updateError) {
    console.warn(
      "[shop-boosts] optional boost_count/last_boost_at update skipped:",
      updateError.message,
    );
  }
}
