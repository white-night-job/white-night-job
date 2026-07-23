"use client";

import { useEffect } from "react";
import { JobDetailView } from "@/components/JobDetailView";
import { recordJobView } from "@/lib/job-view-storage";
import { recordUserViewHistory } from "@/lib/view-history-client";
import { cacheJobById } from "@/lib/job-storage";
import type { Job } from "@/types/job";

type JobDetailClientProps = {
  job: Job;
};

function scheduleIdle(task: () => void) {
  if (typeof window === "undefined") return () => {};
  const w = window as Window & {
    requestIdleCallback?: (
      cb: IdleRequestCallback,
      opts?: IdleRequestOptions,
    ) => number;
    cancelIdleCallback?: (id: number) => void;
  };
  if (typeof w.requestIdleCallback === "function") {
    const id = w.requestIdleCallback(() => task(), { timeout: 2500 });
    return () => w.cancelIdleCallback?.(id);
  }
  const timer = window.setTimeout(task, 400);
  return () => window.clearTimeout(timer);
}

/**
 * Client shell around SSR job payload:
 * - keep listing scroll restore intact (scroll={false} on Links)
 * - scroll detail to top on forward entry
 * - defer analytics / view-history so they never block first paint
 */
export function JobDetailClient({ job }: JobDetailClientProps) {
  useEffect(() => {
    cacheJobById(job);
  }, [job]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [job.id]);

  useEffect(() => {
    const startedAt = performance.now();
    return scheduleIdle(() => {
      if (process.env.NODE_ENV === "development") {
        console.info("[job-detail] deferred tracking start", {
          jobId: job.id,
          idleAfterMs: Math.round(performance.now() - startedAt),
        });
      }
      const trackStarted = performance.now();
      void recordJobView(job.id).finally(() => {
        if (process.env.NODE_ENV === "development") {
          console.info("[job-detail] view record done", {
            jobId: job.id,
            ms: Math.round(performance.now() - trackStarted),
          });
        }
      });
      void recordUserViewHistory(job.id);
    });
  }, [job.id]);

  return <JobDetailView job={job} />;
}
