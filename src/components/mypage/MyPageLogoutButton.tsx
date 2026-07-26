"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useUserSession } from "@/components/UserSessionProvider";
import { clearUserCache } from "@/lib/user-data-cache";

export function MyPageLogoutButton() {
  const router = useRouter();
  const { refreshSession } = useUserSession();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/user/logout", { method: "POST", credentials: "include" });
      clearUserCache();
      await refreshSession();
      router.push("/");
    } catch (error) {
      console.error("[mypage] logout failed:", error);
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleLogout()}
      disabled={loggingOut}
      className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-full border border-charcoal/20 bg-white px-4 text-sm font-semibold text-charcoal shadow-gold disabled:opacity-60"
    >
      {loggingOut ? "ログアウト中..." : "ログアウト"}
    </button>
  );
}
