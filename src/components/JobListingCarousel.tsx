"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchListingJobs, JOBS_UPDATED_EVENT } from "@/lib/job-storage";
import type { Job } from "@/types/job";
import { CompactJobCard } from "./CompactJobCard";

type JobListingCarouselProps = {
  title: string;
  kind: "new" | "pickup";
  theme?: "light" | "dark" | "premium";
};

export function JobListingCarousel({
  title,
  kind,
}: JobListingCarouselProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const badge = kind === "new" ? "new" : "pickup";
  const isPickup = kind === "pickup";

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
      id={isPickup ? "pickup-shops" : "new-shops"}
      className={`listing-panel scroll-mt-24 ${isPickup ? "listing-panel-pickup" : "listing-panel-new"}`}
    >
      <h2
        className={`listing-panel-heading ${isPickup ? "is-pickup" : ""}`}
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
                  <CompactJobCard job={job} theme="premium" badge={badge} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
