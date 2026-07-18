"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { trackJobImpression } from "@/lib/job-analytics-client";

type JobImpressionTrackerProps = {
  jobId: string;
  children: ReactNode;
  className?: string;
};

/**
 * Fires job_impression when the card becomes meaningfully visible.
 * Deduping (same user/job within 3 minutes) is handled in trackJobImpression.
 */
export function JobImpressionTracker({
  jobId,
  children,
  className,
}: JobImpressionTrackerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const wasVisible = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    wasVisible.current = false;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        const nowVisible = Boolean(
          entry?.isIntersecting && (entry.intersectionRatio ?? 0) >= 0.45,
        );
        if (nowVisible && !wasVisible.current) {
          trackJobImpression(jobId);
        }
        wasVisible.current = nowVisible;
      },
      { threshold: [0.45], rootMargin: "0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [jobId]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
