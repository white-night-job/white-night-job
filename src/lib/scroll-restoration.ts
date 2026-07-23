export const SHOP_CARD_ID_PREFIX = "shop-card-";

export function shopCardDomId(jobId: string, variant?: string) {
  const base = `${SHOP_CARD_ID_PREFIX}${jobId}`;
  return variant ? `${base}--${variant}` : base;
}

const RETURN_SNAPSHOT_KEY = "wn:scroll-return-snapshot";
const RESTORE_DONE_KEY = "wn:scroll-restore-done";
const RESTORE_ARMED_KEY = "wn:scroll-restore-armed";

export type ScrollReturnSnapshot = {
  pathname: string;
  searchParams: string;
  scrollY: number;
  jobId: string;
  /** Prefer this exact card node when restoring (handles duplicate job ids). */
  cardDomId: string;
  savedAt: number;
};

/** In-memory: back/forward detected before React re-renders. */
let popNavigationPending = false;

/** In-memory: restore in progress — block hash scroll / overwrite. */
let restoreInProgress = false;

/** In-memory: this back-navigation restore already finished (survives re-renders). */
let restoreCompletedForToken: string | null = null;

export function markPopNavigationPending() {
  popNavigationPending = true;
}

export function consumePopNavigationPending() {
  const value = popNavigationPending;
  popNavigationPending = false;
  return value;
}

export function armScrollRestore() {
  try {
    sessionStorage.setItem(RESTORE_ARMED_KEY, "1");
  } catch {
    /* ignore */
  }
  restoreInProgress = true;
  popNavigationPending = true;
}

export function isScrollRestoreArmed() {
  if (restoreInProgress || popNavigationPending) return true;
  try {
    return sessionStorage.getItem(RESTORE_ARMED_KEY) === "1";
  } catch {
    return false;
  }
}

export function clearScrollRestoreArmed() {
  try {
    sessionStorage.removeItem(RESTORE_ARMED_KEY);
  } catch {
    /* ignore */
  }
}

export function isScrollRestoreInProgress() {
  return restoreInProgress || isScrollRestoreArmed();
}

export function markScrollRestoreInProgress() {
  restoreInProgress = true;
}

export function clearScrollRestoreInProgress() {
  restoreInProgress = false;
}

/** Used by HomeHashScroll to avoid fighting back-restore. */
export function isScrollRestorePending() {
  return isScrollRestoreArmed();
}

export function markScrollRestorePending() {
  armScrollRestore();
}

export function clearScrollRestorePending() {
  restoreInProgress = false;
  clearScrollRestoreArmed();
}

function normalizeSearch(search: string) {
  if (!search) return "";
  return search.startsWith("?") ? search : `?${search}`;
}

export function saveReturnSnapshot(input: {
  pathname: string;
  searchParams: string;
  scrollY: number;
  jobId: string;
  cardDomId?: string;
}) {
  if (typeof window === "undefined") return;
  const jobId = String(input.jobId || "").trim();
  const snapshot: ScrollReturnSnapshot = {
    pathname: input.pathname || "/",
    searchParams: normalizeSearch(input.searchParams),
    scrollY: Math.max(0, Math.round(input.scrollY)),
    jobId,
    cardDomId: input.cardDomId?.trim() || shopCardDomId(jobId),
    savedAt: Date.now(),
  };
  try {
    sessionStorage.setItem(RETURN_SNAPSHOT_KEY, JSON.stringify(snapshot));
    sessionStorage.removeItem(RESTORE_DONE_KEY);
    restoreCompletedForToken = null;
  } catch {
    /* private mode */
  }
}

export function readReturnSnapshot(): ScrollReturnSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(RETURN_SNAPSHOT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ScrollReturnSnapshot>;
    if (!parsed || typeof parsed !== "object") return null;
    if (typeof parsed.pathname !== "string") return null;
    const jobId = String(parsed.jobId ?? "").trim();
    return {
      pathname: parsed.pathname,
      searchParams: normalizeSearch(String(parsed.searchParams ?? "")),
      scrollY: Math.max(0, Math.round(Number(parsed.scrollY) || 0)),
      jobId,
      cardDomId: String(parsed.cardDomId ?? "").trim() || shopCardDomId(jobId),
      savedAt: Number(parsed.savedAt) || 0,
    };
  } catch {
    return null;
  }
}

export function clearReturnSnapshot() {
  try {
    sessionStorage.removeItem(RETURN_SNAPSHOT_KEY);
  } catch {
    /* ignore */
  }
}

export function markRestoreDone(token: string) {
  restoreCompletedForToken = token;
  try {
    sessionStorage.setItem(RESTORE_DONE_KEY, token);
  } catch {
    /* ignore */
  }
}

export function isRestoreAlreadyDone(token: string) {
  if (restoreCompletedForToken === token) return true;
  try {
    return sessionStorage.getItem(RESTORE_DONE_KEY) === token;
  } catch {
    return false;
  }
}

export function clearRestoreDone() {
  restoreCompletedForToken = null;
  try {
    sessionStorage.removeItem(RESTORE_DONE_KEY);
  } catch {
    /* ignore */
  }
}

export function snapshotToken(snapshot: ScrollReturnSnapshot) {
  return `${snapshot.pathname}${snapshot.searchParams}|${snapshot.cardDomId}|${snapshot.savedAt}`;
}

export function matchesSnapshotRoute(
  snapshot: ScrollReturnSnapshot,
  pathname: string,
  search: string,
) {
  return (
    snapshot.pathname === pathname &&
    snapshot.searchParams === normalizeSearch(search)
  );
}

/**
 * Capture scroll + job id when leaving a listing for a job detail page.
 * Must run before Next.js applies its default scroll-to-top.
 */
export function captureJobDetailNavigation(
  jobId: string,
  cardDomId?: string | null,
) {
  if (typeof window === "undefined") return;
  const id = String(jobId || "").trim();
  if (!id) return;
  saveReturnSnapshot({
    pathname: window.location.pathname,
    searchParams: window.location.search,
    scrollY: window.scrollY || window.pageYOffset || 0,
    jobId: id,
    cardDomId: cardDomId || undefined,
  });
}

export function restoreScrollY(scrollY: number) {
  const top = Math.max(0, scrollY);
  window.scrollTo(0, top);
  document.documentElement.scrollTop = top;
  document.body.scrollTop = top;
}

function findCardElement(snapshot: ScrollReturnSnapshot): HTMLElement | null {
  const exact = document.getElementById(snapshot.cardDomId);
  if (exact) return exact;
  if (!snapshot.jobId) return null;
  const base = document.getElementById(shopCardDomId(snapshot.jobId));
  if (base) return base;
  const variantPrefix = `${SHOP_CARD_ID_PREFIX}${snapshot.jobId}--`;
  const variants = document.querySelectorAll<HTMLElement>(`[id^="${variantPrefix}"]`);
  return variants[0] ?? null;
}

export function restoreToShopCard(snapshot: ScrollReturnSnapshot) {
  const el = findCardElement(snapshot);
  if (el) {
    el.scrollIntoView({ block: "center", inline: "nearest", behavior: "auto" });
    return true;
  }
  if (snapshot.scrollY > 0) {
    restoreScrollY(snapshot.scrollY);
  }
  return false;
}

/**
 * Wait until the shop card exists (or timeout), then restore once.
 * Returns a cleanup function.
 */
export function scheduleShopCardRestore(
  snapshot: ScrollReturnSnapshot,
  options?: { onDone?: () => void; maxMs?: number },
): () => void {
  const maxMs = options?.maxMs ?? 8000;
  const token = snapshotToken(snapshot);
  let cancelled = false;
  let finished = false;
  const startedAt = Date.now();
  let rafId = 0;
  let observer: MutationObserver | null = null;
  let resizeObserver: ResizeObserver | null = null;
  const timers: number[] = [];

  const lockPosition = () => {
    if (cancelled || finished) return false;
    const el = findCardElement(snapshot);
    if (el) {
      el.scrollIntoView({ block: "center", inline: "nearest", behavior: "auto" });
      return true;
    }
    if (snapshot.scrollY > 0) {
      restoreScrollY(snapshot.scrollY);
    }
    return false;
  };

  const onScrollGuard = () => {
    if (cancelled || finished || !restoreInProgress) return;
    const y = window.scrollY || window.pageYOffset || 0;
    if (y < 40 && (snapshot.scrollY > 80 || Boolean(snapshot.jobId))) {
      lockPosition();
    }
  };

  const finish = () => {
    if (finished || cancelled) return;
    finished = true;
    markRestoreDone(token);
    clearReturnSnapshot();
    clearScrollRestoreInProgress();
    clearScrollRestoreArmed();
    observer?.disconnect();
    resizeObserver?.disconnect();
    window.removeEventListener("scroll", onScrollGuard);
    if (rafId) cancelAnimationFrame(rafId);
    for (const id of timers) window.clearTimeout(id);
    options?.onDone?.();
  };

  const tryRestore = () => {
    if (cancelled || finished) return true;
    if (isRestoreAlreadyDone(token)) {
      finish();
      return true;
    }

    const found = lockPosition();
    if (found) {
      // Re-apply after layout/images settle, then lock.
      rafId = requestAnimationFrame(() => {
        rafId = requestAnimationFrame(() => {
          if (cancelled || finished) return;
          lockPosition();
          timers.push(
            window.setTimeout(() => {
              if (cancelled || finished) return;
              lockPosition();
              finish();
            }, 120),
          );
        });
      });
      return true;
    }

    if (Date.now() - startedAt > maxMs) {
      lockPosition();
      finish();
      return true;
    }
    return false;
  };

  markScrollRestoreInProgress();

  tryRestore();
  rafId = requestAnimationFrame(() => {
    if (tryRestore()) return;
    rafId = requestAnimationFrame(() => {
      tryRestore();
    });
  });

  const delays = [50, 100, 200, 350, 500, 800, 1200, 1800, 2500, 3500, 5000, 7000];
  for (const delay of delays) {
    timers.push(window.setTimeout(() => tryRestore(), delay));
  }

  if (typeof MutationObserver !== "undefined") {
    observer = new MutationObserver(() => {
      tryRestore();
    });
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  if (typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(() => {
      if (restoreInProgress && !finished) {
        lockPosition();
      }
    });
    if (document.body) resizeObserver.observe(document.body);
  }

  // While restoring, fight Next.js / layout scrolls that jump back to top.
  window.addEventListener("scroll", onScrollGuard, { passive: true });

  timers.push(window.setTimeout(() => tryRestore() || finish(), maxMs + 50));

  return () => {
    cancelled = true;
    observer?.disconnect();
    resizeObserver?.disconnect();
    window.removeEventListener("scroll", onScrollGuard);
    if (rafId) cancelAnimationFrame(rafId);
    for (const id of timers) window.clearTimeout(id);
  };
}
