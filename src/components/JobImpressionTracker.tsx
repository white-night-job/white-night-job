"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { trackJobImpression } from "@/lib/job-analytics-client";

type JobImpressionTrackerProps = {
  jobId: string;
  children: ReactNode;
  className?: string;
};

/**
 * Fires job_impression once when the card is meaningfully visible in the viewport.
 * Does not fire on detail-page open (that is job_detail_click).
 */
export function JobImpressionTracker({
  jobId,
  children,
  className,
}: JobImpressionTrackerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const sent = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || sent.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting || entry.intersectionRatio < 0.45) return;
        if (sent.current) return;
        sent.current = true;
        trackJobImpression(jobId);
        observer.disconnect();
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
