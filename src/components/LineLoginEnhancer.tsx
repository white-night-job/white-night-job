"use client";

import { useEffect } from "react";

const LOGIN_PATH = "/api/line/login";
const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID?.trim() || "";

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

function isLiffUrl(href: string): boolean {
  return href.startsWith("https://liff.line.me/");
}

function getRedirectFromAnchor(anchor: HTMLAnchorElement): string {
  try {
    const raw = anchor.getAttribute("href") || anchor.href;
    const url = new URL(raw, window.location.origin);
    if (url.pathname === LOGIN_PATH) {
      return url.searchParams.get("redirect") || "/";
    }
    if (url.pathname === "/liff/login") {
      return url.searchParams.get("redirect") || "/";
    }
  } catch {
    // ignore
  }
  return "/";
}

/**
 * Makes "LINEでかんたんログイン" open LINE in one tap:
 * 1) If LIFF ID is set → href becomes https://liff.line.me/{id} (opens LINE app)
 * 2) Otherwise → prefetch authorize URL and set href to access.line.me (Universal Links)
 * Never shows the intermediate "LINEアプリで続ける" bridge page.
 */
export function LineLoginEnhancer() {
  useEffect(() => {
    const prepareMap = new WeakMap<HTMLAnchorElement, Promise<string | null>>();

    async function rememberLiffRedirect(redirect: string) {
      try {
        await fetch(
          `/api/line/login?format=json&redirect=${encodeURIComponent(redirect)}`,
          { credentials: "include", headers: { Accept: "application/json" } },
        );
        // Also stash for LIFF endpoint (readable in same tab before app switch)
        sessionStorage.setItem("white-night-liff-redirect", redirect);
      } catch {
        sessionStorage.setItem("white-night-liff-redirect", redirect);
      }
    }

    async function prepare(anchor: HTMLAnchorElement): Promise<string | null> {
      if (isAuthorizeUrl(anchor.href) || isLiffUrl(anchor.href)) {
        return anchor.href;
      }

      const existing = prepareMap.get(anchor);
      if (existing) return existing;

      const task = (async () => {
        const redirect = getRedirectFromAnchor(anchor);

        // LIFF Universal Link → opens LINE app directly
        if (LIFF_ID) {
          await rememberLiffRedirect(redirect);
          const liffUrl = `https://liff.line.me/${LIFF_ID}`;
          anchor.href = liffUrl;
          anchor.rel = "noopener";
          anchor.dataset.lineAuthorizeReady = "1";
          return liffUrl;
        }

        try {
          const endpoint = new URL(LOGIN_PATH, window.location.origin);
          endpoint.searchParams.set("format", "json");
          endpoint.searchParams.set("redirect", redirect);
          const response = await fetch(`${endpoint.pathname}?${endpoint.searchParams}`, {
            credentials: "include",
            headers: { Accept: "application/json" },
          });
          if (!response.ok) return null;

          const data = (await response.json()) as {
            authorizeUrl?: string;
            liffUrl?: string | null;
          };

          // Server may also return LIFF when env is set server-side only
          if (data.liffUrl && isLiffUrl(data.liffUrl)) {
            sessionStorage.setItem("white-night-liff-redirect", redirect);
            anchor.href = data.liffUrl;
            anchor.rel = "noopener";
            anchor.dataset.lineAuthorizeReady = "1";
            return data.liffUrl;
          }

          if (!data.authorizeUrl || !isAuthorizeUrl(data.authorizeUrl)) return null;

          anchor.href = data.authorizeUrl;
          anchor.rel = "noopener";
          anchor.dataset.lineAuthorizeReady = "1";
          return data.authorizeUrl;
        } catch {
          return null;
        }
      })();

      prepareMap.set(anchor, task);
      return task;
    }

    function findLoginAnchors(root: ParentNode = document): HTMLAnchorElement[] {
      return Array.from(root.querySelectorAll("a")).filter(
        (a): a is HTMLAnchorElement =>
          a instanceof HTMLAnchorElement && isLineLoginAnchor(a),
      );
    }

    // Prefetch as soon as login CTAs exist so the first tap hits LINE/authorize.
    function warmAll() {
      for (const anchor of findLoginAnchors()) {
        void prepare(anchor);
      }
    }

    warmAll();
    const observer = new MutationObserver(() => warmAll());
    observer.observe(document.body, { childList: true, subtree: true });

    function onPointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (!isLineLoginAnchor(anchor) && !anchor.dataset.lineAuthorizeReady) return;
      if (isLineLoginAnchor(anchor) || anchor.getAttribute("href")?.includes("/api/line/login")) {
        void prepare(anchor);
      }
    }

    async function onClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a");
      if (!(anchor instanceof HTMLAnchorElement)) return;

      const hrefAttr = anchor.getAttribute("href") || "";
      const needsPrepare =
        isLineLoginAnchor(anchor) ||
        hrefAttr.startsWith("/api/line/login") ||
        hrefAttr.includes("/api/line/login?");

      if (!needsPrepare) {
        // Already on access.line.me or liff.line.me — allow native navigation (UL / App Links).
        return;
      }

      // Still pointing at our API — prepare then go directly (no bridge UI).
      event.preventDefault();
      event.stopPropagation();

      const destination = await prepare(anchor);
      if (destination) {
        window.location.assign(destination);
        return;
      }

      // Last resort: server 303 to authorize / LIFF (still no HTML bridge).
      const redirect = getRedirectFromAnchor(anchor);
      window.location.assign(
        `${LOGIN_PATH}?redirect=${encodeURIComponent(redirect)}`,
      );
    }

    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("click", onClick, true);

    return () => {
      observer.disconnect();
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("click", onClick, true);
    };
  }, []);

  return null;
}
