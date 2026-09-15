"use client";

import { getOrCreateAnonymousId } from "@/lib/user-activity-client";

const VISITOR_ID_KEY = "wnj-visitor-id";
const VISITOR_COOKIE = "wnj_visitor_id";
const PING_AT_KEY = "wnj-visitor-ping-at";
/** Avoid hammering the API on every client navigation within a short window. */
const PING_DEDUP_MS = 5 * 60 * 1000;

function writeCookie(visitorId: string) {
  try {
    const maxAge = 60 * 60 * 24 * 400;
    document.cookie = `${VISITOR_COOKIE}=${encodeURIComponent(visitorId)}; path=/; max-age=${maxAge}; SameSite=Lax`;
  } catch {
    // ignore
  }
}

function readCookie(): string | null {
  try {
    const match = document.cookie
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${VISITOR_COOKIE}=`));
    if (!match) return null;
    const value = decodeURIComponent(match.slice(VISITOR_COOKIE.length + 1));
    return value.trim() || null;
  } catch {
    return null;
  }
}

/**
 * Stable anonymous visitor id for unique-user counting.
 * Reuses existing wnj-anonymous-id when present so returning browsers stay one user.
 */
export function getOrCreateVisitorId(): string {
  try {
    const fromStorage = window.localStorage.getItem(VISITOR_ID_KEY)?.trim();
    if (fromStorage) {
      writeCookie(fromStorage);
      return fromStorage;
    }

    const fromCookie = readCookie();
    if (fromCookie) {
      window.localStorage.setItem(VISITOR_ID_KEY, fromCookie);
      return fromCookie;
    }

    // Continuity with existing activity tracking identity.
    const anonymousId = getOrCreateAnonymousId();
    window.localStorage.setItem(VISITOR_ID_KEY, anonymousId);
    writeCookie(anonymousId);
    return anonymousId;
  } catch {
    return getOrCreateAnonymousId();
  }
}

function shouldSkipPing(): boolean {
  try {
    const raw = window.sessionStorage.getItem(PING_AT_KEY);
    if (!raw) return false;
    const elapsed = Date.now() - Number(raw);
    return Number.isFinite(elapsed) && elapsed >= 0 && elapsed < PING_DEDUP_MS;
  } catch {
    return false;
  }
}

function markPing() {
  try {
    window.sessionStorage.setItem(PING_AT_KEY, String(Date.now()));
  } catch {
    // ignore
  }
}

/** Record / refresh this browser as an active unique visitor. */
export function trackUniqueVisitor(pagePath?: string): void {
  if (typeof window === "undefined") return;

  const path = pagePath || window.location.pathname || "/";
  if (path.startsWith("/admin") || path.startsWith("/shop-dashboard")) {
    return;
  }

  if (shouldSkipPing()) return;
  markPing();

  const visitorId = getOrCreateVisitorId();

  void fetch("/api/site-visitors/ping", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      visitorId,
      pagePath: path.slice(0, 300),
    }),
  }).catch(() => {
    // non-blocking
  });
}
