"use client";

import type { AnalyticsEventType } from "@/lib/job-analytics";

const SESSION_KEY = "wn-analytics-session-id";
const IMPRESSION_PREFIX = "wn-impression:";
const DETAIL_PREFIX = "wn-detail-click:";
const DETAIL_DEDUP_MS = 10_000;
const IMPRESSION_DEDUP_MS = 3 * 60 * 1000;

function getOrCreateSessionId(): string {
  try {
    const existing = window.localStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `s-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return `s-${Date.now()}`;
  }
}

function shouldSkip(key: string, windowMs: number): boolean {
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return false;
    const elapsed = Date.now() - Number(raw);
    return Number.isFinite(elapsed) && elapsed >= 0 && elapsed < windowMs;
  } catch {
    return false;
  }
}

function mark(key: string) {
  try {
    window.sessionStorage.setItem(key, String(Date.now()));
  } catch {
    // ignore
  }
}

export async function trackAnalyticsEvent(
  jobId: string,
  eventType: AnalyticsEventType,
): Promise<void> {
  if (!jobId) return;

  if (eventType === "job_impression") {
    const key = `${IMPRESSION_PREFIX}${jobId}`;
    if (shouldSkip(key, IMPRESSION_DEDUP_MS)) return;
    mark(key);
  }

  if (eventType === "job_detail_click") {
    const key = `${DETAIL_PREFIX}${jobId}`;
    if (shouldSkip(key, DETAIL_DEDUP_MS)) return;
    mark(key);
  }

  try {
    await fetch("/api/analytics/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        jobId,
        eventType,
        sessionId: getOrCreateSessionId(),
        referrer:
          typeof document !== "undefined" ? document.referrer || null : null,
      }),
    });
  } catch (error) {
    console.error("[analytics] track failed", { jobId, eventType, error });
  }
}

export function trackJobImpression(jobId: string): void {
  void trackAnalyticsEvent(jobId, "job_impression");
}

export function trackJobDetailClick(jobId: string): void {
  void trackAnalyticsEvent(jobId, "job_detail_click");
}

export function trackLineClick(jobId: string): void {
  void trackAnalyticsEvent(jobId, "line_click");
}

export function trackPhoneClick(jobId: string): void {
  void trackAnalyticsEvent(jobId, "phone_click");
}
