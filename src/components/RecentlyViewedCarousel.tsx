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
    <section className="listing-panel rounded-2xl border border-gold/25 bg-white/95 p-4 shadow-gold sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-serif text-lg font-semibold text-charcoal">{title}</h2>
        {showViewAll && (
          <Link href="/mypage/history" className="text-xs font-medium text-gold-dark">
            すべて見る
          </Link>
        )}
      </div>
      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 scrollbar-thin">
        {jobs.map((job) => (
          <article
            key={job.id}
            className="w-[11.5rem] shrink-0 overflow-hidden rounded-xl border border-gold/20 bg-ivory shadow-gold sm:w-52"
          >
            <div className="relative aspect-[4/3] bg-gradient-to-br from-charcoal via-[#251c11] to-gold-dark">
              {job.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={job.imageUrl} alt={`${job.shopName}｜${IMAGE_ALT_BRAND}`} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center font-serif text-xs tracking-widest text-gold-light">
                  WN
                </div>
              )}
            </div>
            <div className="p-3">
              <p className="truncate font-serif text-sm font-semibold text-charcoal">
                {job.shopName}
              </p>
              <p className="mt-1 text-xs text-muted">{job.district}</p>
              <p className="mt-1 text-xs font-semibold text-gold-dark">{job.salary}</p>
              <Link
                href={`/jobs/${job.id}`}
                className="mt-2 inline-flex min-h-9 w-full items-center justify-center rounded-full border border-gold/35 bg-white text-xs font-semibold text-gold-dark"
              >
                詳細を見る
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
