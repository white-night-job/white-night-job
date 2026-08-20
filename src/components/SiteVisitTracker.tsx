"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { trackSiteVisit } from "@/lib/user-activity-client";

/**
 * Records anonymous site_visit events on public pages.
 * Admin / shop dashboard routes are skipped by the tracker.
 */
export function SiteVisitTracker() {
  const pathname = usePathname() || "/";

  useEffect(() => {
    trackSiteVisit(pathname);
  }, [pathname]);

  return null;
}
