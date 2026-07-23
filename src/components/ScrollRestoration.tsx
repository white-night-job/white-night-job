"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  armScrollRestore,
  captureJobDetailNavigation,
  clearRestoreDone,
  clearReturnSnapshot,
  clearScrollRestoreArmed,
  clearScrollRestoreInProgress,
  isRestoreAlreadyDone,
  isScrollRestoreArmed,
  matchesSnapshotRoute,
  readReturnSnapshot,
  scheduleShopCardRestore,
  snapshotToken,
} from "@/lib/scroll-restoration";

const JOB_DETAIL_PATH = /^\/jobs\/([^/]+)\/?$/;

function ScrollRestorationInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString() ? `?${searchParams.toString()}` : "";
  const restoreCleanupRef = useRef<(() => void) | null>(null);
  const activeTokenRef = useRef<string | null>(null);

  // Disable browser scroll restoration (conflicts with card-based restore).
  useEffect(() => {
    if (!("scrollRestoration" in history)) return;
    const previous = history.scrollRestoration;
    history.scrollRestoration = "manual";
    return () => {
      history.scrollRestoration = previous;
    };
  }, []);

  // Detect browser back / forward / iOS swipe-back as early as possible.
  useEffect(() => {
    const onPopState = () => {
      const snapshot = readReturnSnapshot();
      if (
        snapshot &&
        matchesSnapshotRoute(
          snapshot,
          window.location.pathname,
          window.location.search,
        )
      ) {
        armScrollRestore();
      }
    };

    window.addEventListener("popstate", onPopState);

    const navigation = (
      window as Window & {
        navigation?: {
          addEventListener: (type: string, handler: (event: Event) => void) => void;
          removeEventListener: (type: string, handler: (event: Event) => void) => void;
        };
      }
    ).navigation;

    const onNavigate = (event: Event) => {
      const navEvent = event as Event & { navigationType?: string };
      if (navEvent.navigationType !== "traverse") return;
      const snapshot = readReturnSnapshot();
      if (
        snapshot &&
        matchesSnapshotRoute(
          snapshot,
          window.location.pathname,
          window.location.search,
        )
      ) {
        armScrollRestore();
      }
    };
    navigation?.addEventListener("navigate", onNavigate);

    return () => {
      window.removeEventListener("popstate", onPopState);
      navigation?.removeEventListener("navigate", onNavigate);
    };
  }, []);

  // Capture snapshot when clicking a job detail link (before Next scrolls away).
  useEffect(() => {
    const onPointerDown = (event: Event) => {
      if (isScrollRestoreArmed()) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const href = anchor.getAttribute("href");
      if (!href) return;
      try {
        const url = new URL(href, window.location.origin);
        if (url.origin !== window.location.origin) return;
        const match = JOB_DETAIL_PATH.exec(url.pathname);
        if (!match) return;
        const card = anchor.closest<HTMLElement>("[id^='shop-card-']");
        captureJobDetailNavigation(match[1]!, card?.id ?? null);
      } catch {
        /* ignore */
      }
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("click", onPointerDown, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("click", onPointerDown, true);
    };
  }, []);

  // Clear snapshot when intentionally opening home via push (logo / menu), not back.
  useEffect(() => {
    const onPointerDown = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      const href = anchor.getAttribute("href");
      if (!href) return;
      try {
        const url = new URL(href, window.location.origin);
        if (url.origin !== window.location.origin) return;
        const isHome = url.pathname === "/";
        const leavingJob = JOB_DETAIL_PATH.test(window.location.pathname);
        if (isHome && !leavingJob && window.location.pathname !== "/") {
          clearReturnSnapshot();
          clearRestoreDone();
          clearScrollRestoreInProgress();
          clearScrollRestoreArmed();
        }
        if (isHome && url.hash && window.location.pathname === "/") {
          clearReturnSnapshot();
          clearRestoreDone();
          clearScrollRestoreInProgress();
          clearScrollRestoreArmed();
        }
      } catch {
        /* ignore */
      }
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, []);

  // Restore only after browser back to the saved listing route.
  useEffect(() => {
    const snapshot = readReturnSnapshot();
    if (!snapshot || !matchesSnapshotRoute(snapshot, pathname, search)) {
      return;
    }

    const token = snapshotToken(snapshot);
    if (isRestoreAlreadyDone(token)) {
      clearReturnSnapshot();
      clearScrollRestoreArmed();
      clearScrollRestoreInProgress();
      return;
    }

    if (!isScrollRestoreArmed()) {
      return;
    }

    if (activeTokenRef.current === token && restoreCleanupRef.current) {
      return;
    }

    restoreCleanupRef.current?.();
    activeTokenRef.current = token;
    restoreCleanupRef.current = scheduleShopCardRestore(snapshot, {
      onDone: () => {
        activeTokenRef.current = null;
        restoreCleanupRef.current = null;
      },
    });
  }, [pathname, search]);

  // bfcache (Safari): page may be restored from memory — re-apply card position.
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      const snapshot = readReturnSnapshot();
      if (!snapshot) return;
      if (
        !matchesSnapshotRoute(
          snapshot,
          window.location.pathname,
          window.location.search,
        )
      ) {
        return;
      }
      const token = snapshotToken(snapshot);
      if (isRestoreAlreadyDone(token)) return;
      armScrollRestore();
      restoreCleanupRef.current?.();
      activeTokenRef.current = token;
      restoreCleanupRef.current = scheduleShopCardRestore(snapshot, {
        onDone: () => {
          activeTokenRef.current = null;
          restoreCleanupRef.current = null;
        },
      });
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  return null;
}

export function ScrollRestoration() {
  return (
    <Suspense fallback={null}>
      <ScrollRestorationInner />
    </Suspense>
  );
}
