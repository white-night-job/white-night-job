"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useUserSession } from "@/components/UserSessionProvider";
import { trackUniqueVisitor } from "@/lib/site-visitor-client";

/**
 * Records unique site visitors (not pageviews) on public pages.
 * Admin / shop dashboard routes are skipped by the tracker.
 */
export function UniqueVisitorTracker() {
  const pathname = usePathname() || "/";
  const { currentUser, ready } = useUserSession();

  useEffect(() => {
    if (!ready) return;
    trackUniqueVisitor(pathname, currentUser?.id ?? null);
  }, [pathname, ready, currentUser?.id]);

  return null;
}
