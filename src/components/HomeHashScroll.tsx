"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { isScrollRestorePending } from "@/lib/scroll-restoration";

const SECTION_IDS = new Set([
  "shop-search",
  "new-shops",
  "pickup-shops",
  "new-open-shops",
  "first-time-guide",
]);

function scrollToHash(hash: string, behavior: ScrollBehavior = "smooth") {
  if (isScrollRestorePending()) return false;
  const id = hash.replace(/^#/, "");
  if (!id || !SECTION_IDS.has(id)) return false;
  const el = document.getElementById(id);
  if (!el) return false;
  el.scrollIntoView({ behavior, block: "start" });
  return true;
}

function tryScrollWithRetry(hash: string) {
  if (!hash || isScrollRestorePending()) return;
  if (scrollToHash(hash)) return;
  const delays = [0, 200, 500, 900];
  for (const delay of delays) {
    window.setTimeout(() => {
      if (isScrollRestorePending()) return;
      scrollToHash(hash);
    }, delay);
  }
}

/** Scroll to top-page section anchors after client navigations (e.g. /#new-open-shops). */
export function HomeHashScroll() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== "/") return;
    // Back/forward card restore wins over hash scrolling.
    if (isScrollRestorePending()) return;

    tryScrollWithRetry(window.location.hash);

    const onHashChange = () => {
      if (isScrollRestorePending()) return;
      tryScrollWithRetry(window.location.hash);
    };
    window.addEventListener("hashchange", onHashChange);

    const onClick = (event: MouseEvent) => {
      if (isScrollRestorePending()) return;
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
        window.setTimeout(() => {
          if (isScrollRestorePending()) return;
          tryScrollWithRetry(url.hash);
        }, 0);
      } catch {
        /* ignore invalid href */
      }
    };
    document.addEventListener("click", onClick);

    return () => {
      window.removeEventListener("hashchange", onHashChange);
      document.removeEventListener("click", onClick);
    };
  }, [pathname]);

  return null;
}
