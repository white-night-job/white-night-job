"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const SECTION_IDS = new Set([
  "shop-search",
  "new-shops",
  "pickup-shops",
  "new-open-shops",
  "first-time-guide",
]);

function scrollToHash(hash: string, behavior: ScrollBehavior = "smooth") {
  const id = hash.replace(/^#/, "");
  if (!id || !SECTION_IDS.has(id)) return false;
  const el = document.getElementById(id);
  if (!el) return false;
  el.scrollIntoView({ behavior, block: "start" });
  return true;
}

function tryScrollWithRetry(hash: string) {
  if (!hash) return;
  if (scrollToHash(hash)) return;
  const delays = [0, 200, 500, 900];
  for (const delay of delays) {
    window.setTimeout(() => scrollToHash(hash), delay);
  }
}

/**
 * Menu / in-page hash jumps only.
 * Does not run on BFCache restore and does not force scroll when there is no hash
 * (so browser back can keep its own scroll position).
 */
export function HomeHashScroll() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== "/") return;

    // Only scroll when the URL actually has a section hash (menu jump).
    // No hash → leave scroll alone (browser back restore).
    if (window.location.hash) {
      tryScrollWithRetry(window.location.hash);
    }

    const onPageShow = (event: PageTransitionEvent) => {
      // Safari BFCache: browser already restored scroll — do not override.
      if (event.persisted) return;
      if (window.location.hash) {
        tryScrollWithRetry(window.location.hash);
      }
    };
    window.addEventListener("pageshow", onPageShow);

    const onHashChange = () => {
      if (window.location.hash) {
        tryScrollWithRetry(window.location.hash);
      }
    };
    window.addEventListener("hashchange", onHashChange);

    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      const href = anchor.getAttribute("href");
      if (!href) return;
      try {
        const url = new URL(href, window.location.origin);
        if (url.pathname !== "/" || !url.hash) return;
        if (!SECTION_IDS.has(url.hash.slice(1))) return;
        window.setTimeout(() => tryScrollWithRetry(url.hash), 0);
      } catch {
        /* ignore */
      }
    };
    document.addEventListener("click", onClick);

    return () => {
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("hashchange", onHashChange);
      document.removeEventListener("click", onClick);
    };
  }, [pathname]);

  return null;
}
