"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  clearScrollRestorePending,
  isScrollRestorePending,
  markScrollRestorePending,
  readPageScroll,
  restoreScrollY,
  savePageScroll,
} from "@/lib/scroll-restoration";

const RESTORE_DELAYS_MS = [0, 50, 100, 200, 400, 700, 1100, 1800, 2800];

function ScrollRestorationInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString() ? `?${searchParams.toString()}` : "";
  const isPopRef = useRef(false);
  const routeRef = useRef({ pathname, search });
  const restoreCleanupRef = useRef<(() => void) | null>(null);

  // Manual restoration; track back/forward (including iOS swipe).
  useEffect(() => {
    if (!("scrollRestoration" in history)) return;
    const previous = history.scrollRestoration;
    history.scrollRestoration = "manual";
    return () => {
      history.scrollRestoration = previous;
    };
  }, []);

  useEffect(() => {
    const onPopState = () => {
      isPopRef.current = true;
      const nextPath = window.location.pathname;
      const nextSearch = window.location.search;
      const pathChanged =
        nextPath !== routeRef.current.pathname ||
        nextSearch !== routeRef.current.search;
      if (!pathChanged) return;

      const saved = readPageScroll(nextPath, nextSearch);
      if (saved != null && saved > 0) {
        markScrollRestorePending();
        // Reduce flash of top before React paints the previous page.
        restoreScrollY(saved);
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
      if (navEvent.navigationType === "traverse") {
        isPopRef.current = true;
      }
    };
    navigation?.addEventListener("navigate", onNavigate);

    return () => {
      window.removeEventListener("popstate", onPopState);
      navigation?.removeEventListener("navigate", onNavigate);
    };
  }, []);

  // Persist scroll for the active route.
  useEffect(() => {
    routeRef.current = { pathname, search };

    const persist = () => {
      savePageScroll(pathname, search, window.scrollY || window.pageYOffset || 0);
    };

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        ticking = false;
        persist();
      });
    };

    const onHide = () => persist();
    const onVisibility = () => {
      if (document.visibilityState === "hidden") onHide();
    };

    const onPointerDownCapture = (event: MouseEvent | TouchEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      try {
        const url = new URL(href, window.location.origin);
        if (url.origin !== window.location.origin) return;
        // Leaving this document view — snapshot scroll first.
        if (url.pathname !== pathname || url.search !== search) {
          persist();
        }
      } catch {
        /* ignore */
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("mousedown", onPointerDownCapture, true);
    document.addEventListener("touchstart", onPointerDownCapture, true);

    return () => {
      persist();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pagehide", onHide);
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("mousedown", onPointerDownCapture, true);
      document.removeEventListener("touchstart", onPointerDownCapture, true);
    };
  }, [pathname, search]);

  // Restore only on back/forward.
  useEffect(() => {
    restoreCleanupRef.current?.();
    restoreCleanupRef.current = null;

    const wasPop = isPopRef.current;
    isPopRef.current = false;
    routeRef.current = { pathname, search };

    if (!wasPop && !isScrollRestorePending()) {
      clearScrollRestorePending();
      return;
    }

    const saved = readPageScroll(pathname, search);
    if (saved == null || saved <= 0) {
      clearScrollRestorePending();
      return;
    }

    markScrollRestorePending();

    let cancelled = false;
    let userInterrupted = false;
    const timers: number[] = [];

    const stopOnUserScroll = () => {
      userInterrupted = true;
    };

    window.addEventListener("wheel", stopOnUserScroll, { passive: true });
    window.addEventListener("touchmove", stopOnUserScroll, { passive: true });
    window.addEventListener("keydown", stopOnUserScroll);

    const apply = () => {
      if (cancelled || userInterrupted) return;
      restoreScrollY(saved);
    };

    apply();
    for (const delay of RESTORE_DELAYS_MS) {
      timers.push(window.setTimeout(apply, delay));
    }

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => apply())
        : null;
    if (document.documentElement) {
      resizeObserver?.observe(document.documentElement);
    }
    if (document.body) {
      resizeObserver?.observe(document.body);
    }

    timers.push(
      window.setTimeout(() => {
        cancelled = true;
        resizeObserver?.disconnect();
        clearScrollRestorePending();
      }, RESTORE_DELAYS_MS[RESTORE_DELAYS_MS.length - 1]! + 400),
    );

    const cleanup = () => {
      cancelled = true;
      for (const id of timers) window.clearTimeout(id);
      resizeObserver?.disconnect();
      window.removeEventListener("wheel", stopOnUserScroll);
      window.removeEventListener("touchmove", stopOnUserScroll);
      window.removeEventListener("keydown", stopOnUserScroll);
    };
    restoreCleanupRef.current = cleanup;

    return cleanup;
  }, [pathname, search]);

  // bfcache restore (Safari / iOS back).
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      const saved = readPageScroll(
        window.location.pathname,
        window.location.search,
      );
      if (saved != null && saved > 0) {
        markScrollRestorePending();
        restoreScrollY(saved);
        window.setTimeout(() => clearScrollRestorePending(), 500);
      }
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
