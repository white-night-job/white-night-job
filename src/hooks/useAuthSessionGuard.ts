"use client";

import { useEffect, useRef } from "react";

const DEFAULT_INTERVAL_MS = 5 * 60 * 1000;

type UseAuthSessionGuardOptions = {
  enabled: boolean;
  checkSession: () => Promise<boolean>;
  onSessionExpired: () => void;
  intervalMs?: number;
};

/** Polls session while a job form is open and re-checks when the tab becomes visible. */
export function useAuthSessionGuard({
  enabled,
  checkSession,
  onSessionExpired,
  intervalMs = DEFAULT_INTERVAL_MS,
}: UseAuthSessionGuardOptions) {
  const onExpiredRef = useRef(onSessionExpired);
  onExpiredRef.current = onSessionExpired;

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    async function verify() {
      const ok = await checkSession();
      if (!cancelled && !ok) {
        onExpiredRef.current();
      }
    }

    void verify();

    const intervalId = window.setInterval(() => {
      void verify();
    }, intervalMs);

    function onVisibilityChange() {
      if (document.visibilityState === "visible") {
        void verify();
      }
    }

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [enabled, checkSession, intervalMs]);
}
