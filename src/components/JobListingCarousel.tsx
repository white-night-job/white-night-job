"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchListingJobs, JOBS_UPDATED_EVENT } from "@/lib/job-storage";
import type { Job } from "@/types/job";
import { CompactJobCard } from "./CompactJobCard";

type ListingKind = "new" | "pickup" | "new-open";

type JobListingCarouselProps = {
  title: string;
  kind: ListingKind;
  theme?: "light" | "dark" | "premium";
};

const LISTING_META: Record<
  ListingKind,
  {
    id: string;
    badge: "new" | "pickup" | "new-open";
    panelClass: string;
    headingClass: string;
  }
> = {
  new: {
    id: "new-shops",
    badge: "new",
    panelClass: "listing-panel-new",
    headingClass: "",
  },
  pickup: {
    id: "pickup-shops",
    badge: "pickup",
    panelClass: "listing-panel-pickup",
    headingClass: "is-pickup",
  },
  "new-open": {
    id: "new-open-shops",
    badge: "new-open",
    panelClass: "listing-panel-new-open",
    headingClass: "is-new-open",
  },
};

export function JobListingCarousel({
  title,
  kind,
}: JobListingCarouselProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const meta = LISTING_META[kind];

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
    <section
      id={meta.id}
      className={`listing-panel scroll-mt-24 ${meta.panelClass}`}
    >
      <h2
        className={`listing-panel-heading ${meta.headingClass}`}
      >
        <span className="listing-heading-line" aria-hidden />
        <span className="listing-heading-text">{title}</span>
        <span className="listing-heading-line" aria-hidden />
      </h2>

      {!ready ? (
        <div className="listing-carousel">
          <div className="listing-carousel-track">
            <div className="listing-carousel-grid">
              {[1, 2].map((item) => (
                <div key={item} className="listing-card-skeleton" />
              ))}
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="listing-panel-message listing-panel-message-error">
          {error}
        </div>
      ) : jobs.length === 0 ? (
        <div className="listing-panel-message">
          現在表示できる店舗がありません。
        </div>
      ) : (
        <div className="listing-carousel">
          <div className="listing-carousel-fade listing-carousel-fade-left" aria-hidden />
          <div className="listing-carousel-fade listing-carousel-fade-right" aria-hidden />
          <div className="listing-carousel-track">
            <div className="listing-carousel-grid">
              {jobs.map((job) => (
                <div key={job.id} className="listing-carousel-item snap-start">
                  <CompactJobCard job={job} theme="premium" badge={meta.badge} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
