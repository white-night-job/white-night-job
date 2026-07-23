"use client";

import { useEffect, useRef } from "react";
import { prefetchJobDetail } from "@/lib/job-storage";

type JobDetailPrefetchProps = {
  jobId: string;
  /** Prefetch when this fraction of the card is visible (0–1). */
  threshold?: number;
};

/** Prefetch slim job detail JSON when a listing card enters the viewport. */
export function JobDetailPrefetch({
  jobId,
  threshold = 0.35,
}: JobDetailPrefetchProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || !jobId) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        prefetchJobDetail(jobId);
        observer.disconnect();
      },
      { threshold, rootMargin: "120px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [jobId, threshold]);

  return <span ref={ref} className="sr-only" aria-hidden />;
}
