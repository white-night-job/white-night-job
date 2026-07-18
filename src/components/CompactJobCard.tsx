"use client";

import Link from "next/link";
import { CompareButton } from "@/components/CompareButton";
import { FavoriteButton } from "@/components/FavoriteButton";
import { JobImpressionTracker } from "@/components/JobImpressionTracker";
import {
  isPremiumTheme,
  luxuryMetalBtn,
  luxurySalaryBadge,
  type LuxuryTheme,
} from "@/lib/luxury-styles";
import { formatLocation } from "@/lib/job-storage";
import { IMAGE_ALT_BRAND } from "@/lib/site";
import type { Job } from "@/types/job";

type CompactJobCardProps = {
  job: Job;
  theme?: LuxuryTheme;
  badge?: "new" | "pickup";
};

function ListingBadge({ badge }: { badge: "new" | "pickup" }) {
  return (
    <span
      className={`listing-card-badge ${
        badge === "pickup" ? "listing-card-badge-pickup" : "listing-card-badge-new"
      }`}
    >
      {badge === "pickup" ? "PICK UP" : "NEW"}
    </span>
  );
}

export function CompactJobCard({
  job,
  theme = "light",
  badge,
}: CompactJobCardProps) {
  const isPremium = isPremiumTheme(theme);

  if (isPremium) {
    return (
      <JobImpressionTracker jobId={job.id}>
      <article className="listing-job-card relative">
        <div className="absolute right-2 top-2 z-10">
          <FavoriteButton jobId={job.id} />
        </div>
        {badge && <ListingBadge badge={badge} />}

        {job.imageUrl ? (
          <div className="listing-card-image">
            <img
              src={job.imageUrl}
              alt={`${job.shopName}の求人｜${IMAGE_ALT_BRAND}`}
              className="h-28 w-full object-cover sm:h-32"
            />
          </div>
        ) : (
          <div className="listing-card-image listing-card-image-placeholder">
            <p className="font-serif text-sm font-semibold tracking-[0.18em] text-[#c4a574]">
              White Night
            </p>
          </div>
        )}

        <div className="listing-card-body">
          <h3 className="listing-card-name">{job.shopName}</h3>
          <dl className="mt-2 space-y-1 text-xs">
            <div className="flex gap-1.5">
              <dt className="shrink-0 font-semibold text-[#111111]/45">エリア</dt>
              <dd className="line-clamp-1 text-[#111111]/70">{formatLocation(job)}</dd>
            </div>
            <div className="flex gap-1.5">
              <dt className="shrink-0 font-semibold text-[#111111]/45">職種</dt>
              <dd className="line-clamp-1 text-[#111111]/70">{job.jobType}</dd>
            </div>
            <div className="flex items-center gap-1.5">
              <dt className="shrink-0 font-semibold text-[#8b6f3e]">時給</dt>
              <dd>
                <span className="listing-card-salary">{job.salary}</span>
              </dd>
            </div>
          </dl>
          <Link href={`/jobs/${job.id}`} className="listing-card-link">
            求人詳細を見る
          </Link>
          <div className="mt-2 border-t border-gold/10 pt-2">
            <CompareButton jobId={job.id} />
          </div>
        </div>
      </article>
      </JobImpressionTracker>
    );
  }

  return (
    <JobImpressionTracker jobId={job.id} className="h-full">
    <article className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-gold/45 bg-gradient-to-br from-white via-ivory to-champagne shadow-luxury transition-transform duration-300 hover:-translate-y-0.5">
      <div className="absolute right-2 top-2 z-10">
        <FavoriteButton jobId={job.id} />
      </div>
      {badge && <ListingBadge badge={badge} />}

      {job.imageUrl ? (
        <div className="overflow-hidden ring-1 ring-gold/40 ring-inset">
          <img
            src={job.imageUrl}
            alt={`${job.shopName}の求人｜${IMAGE_ALT_BRAND}`}
            className="h-28 w-full rounded-xl object-cover sm:h-32"
          />
        </div>
      ) : (
        <div className="flex h-28 w-full items-center justify-center rounded-xl bg-gradient-to-br from-ivory via-champagne to-gold-mid ring-2 ring-gold/50 ring-inset sm:h-32">
          <p className="font-serif text-sm font-semibold tracking-[0.18em] text-gradient-gold">
            White Night
          </p>
        </div>
      )}

      <div className="relative flex flex-1 flex-col p-3">
        <h3 className="line-clamp-2 font-serif text-lg font-semibold leading-snug text-charcoal">
          {job.shopName}
        </h3>
        <dl className="mt-2 space-y-1 text-xs">
          <div className="flex gap-1.5">
            <dt className="shrink-0 font-semibold text-muted">エリア</dt>
            <dd className="line-clamp-1 text-muted">{formatLocation(job)}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="shrink-0 font-semibold text-muted">職種</dt>
            <dd className="line-clamp-1 text-muted">{job.jobType}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <dt className="shrink-0 font-semibold text-gold-dark">時給</dt>
            <dd>
              <span className={luxurySalaryBadge}>{job.salary}</span>
            </dd>
          </div>
        </dl>
        <Link
          href={`/jobs/${job.id}`}
          className={`mt-auto inline-flex min-h-9 items-center justify-center rounded-full px-3 pt-3 text-center text-xs ${luxuryMetalBtn}`}
        >
          求人詳細を見る
        </Link>
        <div className="mt-2 border-t border-gold/10 pt-2">
          <CompareButton jobId={job.id} />
        </div>
      </div>
    </article>
    </JobImpressionTracker>
  );
}
