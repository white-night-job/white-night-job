const STORAGE_KEY = "wn:scroll-positions";

type ScrollMap = Record<string, number>;

/** Set synchronously on popstate when a saved position will be restored. */
let pendingRestore = false;

export function markScrollRestorePending() {
  pendingRestore = true;
}

export function clearScrollRestorePending() {
  pendingRestore = false;
}

export function isScrollRestorePending() {
  return pendingRestore;
}

export function getScrollPageKey(pathname: string, search: string) {
  const normalizedSearch = search.startsWith("?") || search === "" ? search : `?${search}`;
  return `${pathname}${normalizedSearch}`;
}

function readMap(): ScrollMap {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as ScrollMap;
  } catch {
    return {};
  }
}

export function savePageScroll(pathname: string, search: string, scrollY: number) {
  if (typeof window === "undefined") return;
  const y = Math.max(0, Math.round(scrollY));
  const key = getScrollPageKey(pathname, search);
  try {
    const map = readMap();
    map[key] = y;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* quota / private mode */
  }
}

export function readPageScroll(pathname: string, search: string): number | null {
  if (typeof window === "undefined") return null;
  const key = getScrollPageKey(pathname, search);
  try {
    const value = readMap()[key];
    return typeof value === "number" && Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

export function restoreScrollY(scrollY: number) {
  window.scrollTo({ top: scrollY, left: 0, behavior: "auto" });
}
