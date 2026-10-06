import { DISTRICTS, formatDistrictLabel } from "@/data/districts";
import type { District } from "@/types/job";

export const PREFERRED_AREA_OPTIONS = DISTRICTS.map((value) => ({
  value,
  label: formatDistrictLabel(value),
}));

export function isPreferredArea(value: unknown): value is District {
  return typeof value === "string" && (DISTRICTS as readonly string[]).includes(value);
}

/** 許可されたエリアのみ・重複なし・マスタ順に正規化する */
export function normalizePreferredAreas(raw: unknown): District[] {
  if (!Array.isArray(raw)) return [];
  const selected = new Set(raw.filter(isPreferredArea));
  return DISTRICTS.filter((district) => selected.has(district));
}

export function formatPreferredAreaList(areas: readonly string[]): string {
  return areas.map(formatDistrictLabel).join("・");
}

/** 希望エリア未設定（空）の場合は絞り込まない */
export function filterJobsByPreferredAreas<T extends { district: District }>(
  jobs: T[],
  areas: readonly District[],
): T[] {
  if (areas.length === 0) return jobs;
  const allowed = new Set<District>(areas);
  return jobs.filter((job) => allowed.has(job.district));
}

/** 並び順を維持したまま、同一求人・同一店舗の重複を除外する */
export function dedupeJobsByShop<T extends { id: string; shopName?: string | null }>(
  jobs: T[],
): T[] {
  const seenIds = new Set<string>();
  const seenShops = new Set<string>();
  const result: T[] = [];
  for (const job of jobs) {
    if (seenIds.has(job.id)) continue;
    const shopKey = job.shopName?.trim().toLowerCase();
    if (shopKey && seenShops.has(shopKey)) continue;
    seenIds.add(job.id);
    if (shopKey) seenShops.add(shopKey);
    result.push(job);
  }
  return result;
}
