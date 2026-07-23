"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useUserSession } from "@/components/UserSessionProvider";
import { IMAGE_ALT_BRAND } from "@/lib/site";
import type { Job } from "@/types/job";

type RecentlyViewedCarouselProps = {
  showViewAll?: boolean;
  limit?: number;
  title?: string;
};

export function RecentlyViewedCarousel({
  showViewAll = true,
  limit = 10,
  title = "最近見た店舗",
}: RecentlyViewedCarouselProps) {
  const { isLoggedIn, ready } = useUserSession();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;
    if (!isLoggedIn) {
      setJobs([]);
      setLoading(false);
      return;
    }

    fetch("/api/view-history", { cache: "no-store", credentials: "include" })
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as { jobs?: Job[] };
      })
      .then((data) => setJobs((data?.jobs ?? []).slice(0, limit)))
      .finally(() => setLoading(false));
  }, [isLoggedIn, limit, ready]);

  if (!ready || !isLoggedIn || loading) return null;
  if (jobs.length === 0) return null;

  return (
    <section className="recent-panel scroll-mt-24">
      <div className="recent-panel-heading-wrap">
        <div className="listing-panel-heading">
          <span className="listing-heading-line" aria-hidden />
          <h2 className="listing-heading-text">{title}</h2>
          <span className="listing-heading-line" aria-hidden />
        </div>
        {showViewAll && (
          <Link href="/mypage/history" className="recent-view-all">
            すべて見る
          </Link>
        )}
      </div>

      <div className="listing-carousel">
        <div className="listing-carousel-fade listing-carousel-fade-left" aria-hidden />
        <div className="listing-carousel-fade listing-carousel-fade-right" aria-hidden />
        <div className="listing-carousel-track recent-carousel-track">
          <div className="listing-carousel-grid recent-carousel-grid">
            {jobs.map((job) => (
              <article
                key={job.id}
                id={`shop-card-${job.id}--recent`}
                className="recent-history-card snap-start"
              >
                <div className="recent-history-card-image">
                  {job.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={job.imageUrl}
                      alt={`${job.shopName}｜${IMAGE_ALT_BRAND}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center font-serif text-xs tracking-widest text-gold-light">
                      WN
                    </div>
                  )}
                </div>
                <div className="recent-history-card-body">
                  <p className="truncate font-serif text-sm font-semibold text-charcoal">
                    {job.shopName}
                  </p>
                  <p className="mt-1 text-xs text-muted">{job.district}</p>
                  <p className="mt-1 text-xs font-semibold text-gold-dark">{job.salary}</p>
                  <Link
                    href={`/jobs/${job.id}`}
                    scroll={false}
                    className="recent-history-card-link"
                  >
                    詳細を見る
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
