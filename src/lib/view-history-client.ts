export async function recordUserViewHistory(jobId: string): Promise<void> {
  if (typeof window !== "undefined") {
    const path = window.location.pathname;
    if (
      path.startsWith("/admin") ||
      path.startsWith("/shop-dashboard") ||
      path.startsWith("/shop-login")
    ) {
      return;
    }
  }

  try {
    await fetch("/api/view-history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ jobId }),
      keepalive: true,
    });
  } catch (error) {
    console.error("[view-history] client record failed:", error);
  }
}
