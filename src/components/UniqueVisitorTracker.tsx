"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { trackUniqueVisitor } from "@/lib/site-visitor-client";

/**
 * Records unique site visitors (not pageviews) on public pages.
 * Admin / shop dashboard routes are skipped by the tracker.
 */
export function UniqueVisitorTracker() {
  const pathname = usePathname() || "/";

  useEffect(() => {
    trackUniqueVisitor(pathname);
  }, [pathname]);

  return null;
}
