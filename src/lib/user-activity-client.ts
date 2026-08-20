"use client";

import type {
  UserActivityAttribution,
  UserActivityEventType,
} from "@/lib/user-activity-events";

const ANON_ID_KEY = "wnj-anonymous-id";
const ATTRIBUTION_KEY = "wnj-first-touch-attribution";
const SITE_VISIT_AT_KEY = "wnj-site-visit-at";
const SITE_VISIT_DEDUP_MS = 30 * 60 * 1000;
const APPLY_CLICK_DEDUP_MS = 2000;
const DETAIL_VIEW_DEDUP_MS = 60 * 1000;

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `a-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function getOrCreateAnonymousId(): string {
  try {
    const existing = window.localStorage.getItem(ANON_ID_KEY);
    if (existing) return existing;
    const id = newId();
    window.localStorage.setItem(ANON_ID_KEY, id);
    return id;
  } catch {
    return newId();
  }
}

function readAttribution(): UserActivityAttribution | null {
  try {
    const raw = window.localStorage.getItem(ATTRIBUTION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserActivityAttribution;
  } catch {
    return null;
  }
}

function writeAttribution(value: UserActivityAttribution): void {
  try {
    window.localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(value));
  } catch {
    // ignore
  }
}

/** Capture first-touch UTM / referrer once per browser. */
export function captureFirstTouchAttribution(): UserActivityAttribution | null {
  if (typeof window === "undefined") return null;

  const existing = readAttribution();
  if (existing && Object.keys(existing).length > 0) return existing;

  const params = new URLSearchParams(window.location.search);
  const next: UserActivityAttribution = {};
  const utmSource = params.get("utm_source")?.trim();
  const utmMedium = params.get("utm_medium")?.trim();
  const utmCampaign = params.get("utm_campaign")?.trim();
  const utmContent = params.get("utm_content")?.trim();
  const referrer = document.referrer?.trim() || "";

  if (utmSource) next.utm_source = utmSource.slice(0, 200);
  if (utmMedium) next.utm_medium = utmMedium.slice(0, 200);
  if (utmCampaign) next.utm_campaign = utmCampaign.slice(0, 200);
  if (utmContent) next.utm_content = utmContent.slice(0, 200);
  if (referrer) {
    try {
      const refHost = new URL(referrer).hostname;
      const selfHost = window.location.hostname;
      if (refHost && refHost !== selfHost) {
        next.referrer = referrer.slice(0, 500);
      }
    } catch {
      next.referrer = referrer.slice(0, 500);
    }
  }

  if (Object.keys(next).length === 0) return null;
  writeAttribution(next);
  return next;
}

export function getStoredAttribution(): UserActivityAttribution | null {
  return readAttribution();
}

function shouldSkipClientDedup(key: string, windowMs: number): boolean {
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return false;
    const elapsed = Date.now() - Number(raw);
    return Number.isFinite(elapsed) && elapsed >= 0 && elapsed < windowMs;
  } catch {
    return false;
  }
}

function markClientDedup(key: string): void {
  try {
    window.sessionStorage.setItem(key, String(Date.now()));
  } catch {
    // ignore
  }
}

function isInternalClientPath(pathname?: string): boolean {
  const path = pathname ?? window.location.pathname;
  return (
    path.startsWith("/admin") ||
    path.startsWith("/shop-dashboard") ||
    path.startsWith("/shop-login")
  );
}

export type TrackUserActivityInput = {
  eventType: UserActivityEventType;
  jobId?: string | null;
  shopId?: string | null;
  pagePath?: string | null;
  extraMetadata?: Record<string, unknown> | null;
};

export async function trackUserActivityEvent(
  input: TrackUserActivityInput,
): Promise<void> {
  if (typeof window === "undefined") return;
  if (isInternalClientPath(input.pagePath ?? undefined)) return;

  const eventType = input.eventType;
  if (eventType === "site_visit") {
    if (shouldSkipClientDedup(SITE_VISIT_AT_KEY, SITE_VISIT_DEDUP_MS)) return;
  } else if (eventType === "job_detail_view" && input.jobId) {
    if (
      shouldSkipClientDedup(
        `wnj-uact-detail:${input.jobId}`,
        DETAIL_VIEW_DEDUP_MS,
      )
    ) {
      return;
    }
  } else if (
    (eventType === "line_apply_click" || eventType === "phone_apply_click") &&
    input.jobId
  ) {
    if (
      shouldSkipClientDedup(
        `wnj-uact-apply:${eventType}:${input.jobId}`,
        APPLY_CLICK_DEDUP_MS,
      )
    ) {
      return;
    }
  }

  const anonymousId = getOrCreateAnonymousId();
  const attribution =
    captureFirstTouchAttribution() ?? getStoredAttribution() ?? undefined;

  try {
    const response = await fetch("/api/user-activity/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      keepalive: true,
      body: JSON.stringify({
        eventType,
        jobId: input.jobId ?? null,
        shopId: input.shopId ?? input.jobId ?? null,
        anonymousId,
        pagePath: input.pagePath ?? window.location.pathname,
        attribution: attribution ?? null,
        metadata: input.extraMetadata ?? null,
      }),
    });

    if (!response.ok) return;

    if (eventType === "site_visit") {
      markClientDedup(SITE_VISIT_AT_KEY);
    } else if (eventType === "job_detail_view" && input.jobId) {
      markClientDedup(`wnj-uact-detail:${input.jobId}`);
    } else if (
      (eventType === "line_apply_click" ||
        eventType === "phone_apply_click") &&
      input.jobId
    ) {
      markClientDedup(`wnj-uact-apply:${eventType}:${input.jobId}`);
    }
  } catch (error) {
    console.error("[user-activity] track failed", { eventType, error });
  }
}

export function trackSiteVisit(pagePath?: string): void {
  void trackUserActivityEvent({
    eventType: "site_visit",
    pagePath: pagePath ?? window.location.pathname,
  });
}

/** Payload helpers for dual-write via existing job APIs. */
export function getUserActivityClientContext(): {
  anonymousId: string;
  attribution: UserActivityAttribution | null;
} {
  return {
    anonymousId: getOrCreateAnonymousId(),
    attribution: captureFirstTouchAttribution() ?? getStoredAttribution(),
  };
}
