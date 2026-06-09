const VIEW_DEDUP_MS = 10_000;

function shouldSkipDuplicateView(jobId: string): boolean {
  if (typeof window === "undefined") return false;

  const storageKey = `job-view-recorded-${jobId}`;
  const lastRecordedAt = window.sessionStorage.getItem(storageKey);
  if (!lastRecordedAt) return false;

  const elapsed = Date.now() - Number(lastRecordedAt);
  return Number.isFinite(elapsed) && elapsed >= 0 && elapsed < VIEW_DEDUP_MS;
}

function markViewRecorded(jobId: string): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(`job-view-recorded-${jobId}`, String(Date.now()));
}

function clearViewRecorded(jobId: string): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(`job-view-recorded-${jobId}`);
}

export async function recordJobView(jobId: string): Promise<void> {
  if (shouldSkipDuplicateView(jobId)) return;

  markViewRecorded(jobId);

  try {
    const response = await fetch(`/api/jobs/${jobId}/views`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        referrer:
          typeof document !== "undefined" ? document.referrer || null : null,
      }),
    });

    if (!response.ok) {
      clearViewRecorded(jobId);
      if (process.env.NODE_ENV !== "production") {
        const body = await response.text().catch(() => "");
        console.warn("job view record failed:", response.status, body);
      }
    }
  } catch (error) {
    clearViewRecorded(jobId);
    if (process.env.NODE_ENV !== "production") {
      console.warn("job view record error:", error);
    }
  }
}
