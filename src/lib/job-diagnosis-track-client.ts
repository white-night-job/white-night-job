"use client";

import { getOrCreateAnalyticsSessionId } from "@/lib/job-analytics-client";

const TRACKED_KEYS = "wn-diagnosis-tracked-keys";

function alreadyTracked(completionKey: string): boolean {
  try {
    const raw = window.sessionStorage.getItem(TRACKED_KEYS);
    if (!raw) return false;
    const list = JSON.parse(raw) as string[];
    return Array.isArray(list) && list.includes(completionKey);
  } catch {
    return false;
  }
}

function markTracked(completionKey: string) {
  try {
    const raw = window.sessionStorage.getItem(TRACKED_KEYS);
    const list = raw ? (JSON.parse(raw) as string[]) : [];
    const next = Array.isArray(list) ? list : [];
    if (!next.includes(completionKey)) {
      next.push(completionKey);
      // 直近の完了キーだけ保持
      window.sessionStorage.setItem(
        TRACKED_KEYS,
        JSON.stringify(next.slice(-20)),
      );
    }
  } catch {
    // ignore
  }
}

/** 結果画面到達を1回記録。同一 completionKey は送らない。 */
export async function trackJobDiagnosisCompleted(input: {
  completionKey: string;
  resultJobType?: string | null;
  area?: string | null;
}): Promise<void> {
  const completionKey = input.completionKey.trim();
  if (!completionKey) return;
  if (alreadyTracked(completionKey)) return;
  markTracked(completionKey);

  try {
    await fetch("/api/job-type-diagnosis/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        sessionId: getOrCreateAnalyticsSessionId(),
        completionKey,
        resultJobType: input.resultJobType ?? null,
        area: input.area ?? null,
      }),
    });
  } catch (error) {
    console.error("[diagnosis] complete track failed", error);
  }
}

export function createDiagnosisCompletionKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `d-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
