"use client";

import { useEffect } from "react";

const LOGIN_PATH = "/api/line/login";

function isLineLoginAnchor(anchor: HTMLAnchorElement): boolean {
  try {
    const url = new URL(anchor.href, window.location.origin);
    return url.pathname === LOGIN_PATH;
  } catch {
    return false;
  }
}

function isAuthorizeUrl(href: string): boolean {
  return href.startsWith("https://access.line.me/oauth2/v2.1/authorize");
}

/**
 * Prefetch the official LINE authorize URL on pointerdown and swap the href
 * so the subsequent user tap navigates directly to access.line.me.
 * That enables LINE Auto Login (Universal Links / App Links) on mobile.
 *
 * Important: do not preventDefault on click. iOS Universal Links require a
 * real user-initiated navigation to access.line.me. If prepare is slow,
 * the original /api/line/login bridge page still works.
 */
export function LineLoginEnhancer() {
  useEffect(() => {
    const prepareMap = new WeakMap<HTMLAnchorElement, Promise<void>>();

    function prepare(anchor: HTMLAnchorElement): Promise<void> {
      if (isAuthorizeUrl(anchor.href) || anchor.dataset.lineAuthorizeReady === "1") {
        return Promise.resolve();
      }

      const existing = prepareMap.get(anchor);
      if (existing) return existing;

      const task = (async () => {
        try {
          const current = new URL(anchor.getAttribute("href") || anchor.href, window.location.origin);
          if (current.pathname !== LOGIN_PATH) return;

          current.searchParams.set("format", "json");
          const response = await fetch(`${current.pathname}?${current.searchParams.toString()}`, {
            credentials: "include",
            headers: { Accept: "application/json" },
          });
          if (!response.ok) return;

          const data = (await response.json()) as { authorizeUrl?: string };
          if (!data.authorizeUrl || !isAuthorizeUrl(data.authorizeUrl)) return;

          anchor.href = data.authorizeUrl;
          anchor.rel = "noopener";
          anchor.dataset.lineAuthorizeReady = "1";
        } catch {
          // Keep original /api/line/login href (bridge page).
        }
      })();

      prepareMap.set(anchor, task);
      return task;
    }

    function onPointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (!isLineLoginAnchor(anchor)) return;
      void prepare(anchor);
    }

    // mouseenter / focus help desktop and keyboard users get a ready href early
    function onIntent(event: Event) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (!isLineLoginAnchor(anchor)) return;
      void prepare(anchor);
    }

    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("mouseenter", onIntent, true);
    document.addEventListener("focusin", onIntent, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("mouseenter", onIntent, true);
      document.removeEventListener("focusin", onIntent, true);
    };
  }, []);

  return null;
}
