export async function recordUserViewHistory(jobId: string): Promise<void> {
  try {
    await fetch("/api/view-history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ jobId }),
    });
  } catch (error) {
    console.error("[view-history] client record failed:", error);
  }
}
