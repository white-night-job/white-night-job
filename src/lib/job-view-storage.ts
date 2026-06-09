export async function recordJobView(jobId: string): Promise<void> {
  try {
    await fetch(`/api/jobs/${jobId}/views`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        referrer: typeof document !== "undefined" ? document.referrer || null : null,
      }),
    });
  } catch {
    // 表示回数の記録失敗はユーザー体験に影響させない
  }
}
