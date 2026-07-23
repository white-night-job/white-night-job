const VIEW_DEDUP_MS = 2 * 60 * 1000; // 2 minutes

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

function shouldSkipInternalClientPath(): boolean {
  if (typeof window === "undefined") return false;
  const path = window.location.pathname;
  return (
    path.startsWith("/admin") ||
    path.startsWith("/shop-dashboard") ||
    path.startsWith("/shop-login")
  );
}

export async function recordJobView(jobId: string): Promise<void> {
  if (shouldSkipInternalClientPath()) return;
  if (shouldSkipDuplicateView(jobId)) return;

  try {
    const response = await fetch(`/api/jobs/${jobId}/views`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        referrer:
          typeof document !== "undefined" ? document.referrer || null : null,
      }),
      keepalive: true,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.error("job view POST failed:", {
        jobId,
        status: response.status,
        body,
      });
      return;
    }

    markViewRecorded(jobId);
  } catch (error) {
    console.error("job view POST error:", { jobId, error });
  }
}
