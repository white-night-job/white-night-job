"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchListingJobs, JOBS_UPDATED_EVENT } from "@/lib/job-storage";
import type { Job } from "@/types/job";
import { CompactJobCard } from "./CompactJobCard";

type JobListingCarouselProps = {
  title: string;
  kind: "new" | "pickup";
};

export function JobListingCarousel({
  title,
  kind,
}: JobListingCarouselProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    fetchListingJobs(kind)
      .then((items) => {
        setJobs(items);
        setError("");
      })
      .catch((err: unknown) => {
        setError(
          err instanceof Error ? err.message : "求人を取得できませんでした。",
        );
      })
      .finally(() => setReady(true));
  }, [kind]);

  useEffect(() => {
    setReady(false);
    load();
    const onUpdate = () => load();
    window.addEventListener(JOBS_UPDATED_EVENT, onUpdate);
    return () => window.removeEventListener(JOBS_UPDATED_EVENT, onUpdate);
  }, [load]);

  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-charcoal sm:text-xl">{title}</h2>

      {!ready ? (
        <div className="-mx-4 overflow-hidden px-4">
          <div className="grid grid-flow-col auto-cols-[calc(50%-0.375rem)] gap-3">
            {[1, 2].map((item) => (
              <div
                key={item}
                className="h-56 animate-pulse rounded-2xl border border-gold/20 bg-white"
              />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-white px-4 py-8 text-center text-sm text-red-600">
          {error}
        </div>
      ) : jobs.length === 0 ? (
        <div className="rounded-2xl border border-gold/20 bg-white px-4 py-8 text-center text-sm text-muted">
          現在表示できる店舗がありません。
        </div>
      ) : (
        <div className="-mx-4 overflow-x-auto px-4 pb-1 [scrollbar-width:thin]">
          <div className="grid grid-flow-col auto-cols-[calc(50%-0.375rem)] gap-3 sm:auto-cols-[calc(50%-0.5rem)]">
            {jobs.map((job) => (
              <div key={job.id} className="snap-start">
                <CompactJobCard job={job} />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
