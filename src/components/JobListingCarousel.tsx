"use client";

import { useCallback, useEffect, useState } from "react";
import { sectionHeading, type LuxuryTheme } from "@/lib/luxury-styles";
import { fetchListingJobs, JOBS_UPDATED_EVENT } from "@/lib/job-storage";
import type { Job } from "@/types/job";
import { CompactJobCard } from "./CompactJobCard";

type JobListingCarouselProps = {
  title: string;
  kind: "new" | "pickup";
  theme?: LuxuryTheme;
};

export function JobListingCarousel({
  title,
  kind,
  theme = "light",
}: JobListingCarouselProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const isPremium = theme === "premium" || theme === "dark";
  const badge = kind === "new" ? "new" : "pickup";

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

  const skeletonClass = isPremium
    ? "h-56 animate-pulse rounded-2xl border border-gold/40 bg-gradient-to-br from-white to-champagne"
    : "h-56 animate-pulse rounded-2xl border border-gold/20 bg-white";

  const emptyClass = isPremium
    ? "rounded-2xl border border-gold/40 bg-gradient-to-br from-white to-ivory px-4 py-8 text-center text-sm text-muted"
    : "rounded-2xl border border-gold/20 bg-white px-4 py-8 text-center text-sm text-muted";

  return (
    <section className="listing-section space-y-4">
      <h2 className={sectionHeading(theme)}>
        <span className="heading-ornament" aria-hidden />
        {title}
      </h2>

      {!ready ? (
        <div className="-mx-4 overflow-hidden px-4">
          <div className="grid grid-flow-col auto-cols-[calc(50%-0.375rem)] gap-3">
            {[1, 2].map((item) => (
              <div key={item} className={skeletonClass} />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-300/60 bg-white/90 px-4 py-8 text-center text-sm text-red-700">
          {error}
        </div>
      ) : jobs.length === 0 ? (
        <div className={emptyClass}>現在表示できる店舗がありません。</div>
      ) : (
        <div className="-mx-4 overflow-x-auto px-4 pb-1 [scrollbar-width:thin]">
          <div className="grid grid-flow-col auto-cols-[calc(50%-0.375rem)] gap-3 sm:auto-cols-[calc(50%-0.5rem)]">
            {jobs.map((job) => (
              <div key={job.id} className="snap-start">
                <CompactJobCard job={job} theme={theme} badge={badge} />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
