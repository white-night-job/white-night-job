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
import { shopCardDomId } from "@/lib/shop-card-id";
import { IMAGE_ALT_BRAND, SHOW_SAMPLE_LISTINGS } from "@/lib/site";
import type { Job } from "@/types/job";
import { JobDetailPrefetch } from "@/components/JobDetailPrefetch";
import { SampleListingBadge } from "@/components/SampleListingNotice";
import {
  isUncontractedPlan,
  UNCONTRACTED_PUBLIC_LABEL,
} from "@/lib/job-plan";

type CompactJobCardProps = {
  job: Job;
  theme?: LuxuryTheme;
  badge?: "new" | "pickup" | "new-open";
};

function ListingBadge({
  badge,
  offsetForSample,
}: {
  badge: "new" | "pickup" | "new-open";
  offsetForSample?: boolean;
}) {
  const label =
    badge === "pickup" ? "PICK UP" : badge === "new-open" ? "NEW OPEN" : "NEW";
  const className =
    badge === "pickup"
      ? "listing-card-badge-pickup"
      : badge === "new-open"
        ? "listing-card-badge-new-open"
        : "listing-card-badge-new";

  return (
    <span
      className={`listing-card-badge ${className}${
        offsetForSample ? " is-below-sample" : ""
      }`}
    >
      {label}
    </span>
  );
}

export function CompactJobCard({
  job,
  theme = "light",
  badge,
}: CompactJobCardProps) {
  const isPremium = isPremiumTheme(theme);
  const cardId = shopCardDomId(job.id, badge);
  const detailHref = `/jobs/${job.id}`;
  const showSample = SHOW_SAMPLE_LISTINGS;
  const storeInfoOnly = isUncontractedPlan(job.plan);

  if (isPremium) {
    return (
      <JobImpressionTracker jobId={job.id}>
      <article id={cardId} className="listing-job-card relative">
        <JobDetailPrefetch jobId={job.id} />
        <div className="absolute right-2 top-2 z-10 flex items-center gap-1.5">
          {!storeInfoOnly ? <CompareButton jobId={job.id} /> : null}
          <FavoriteButton jobId={job.id} allowLineLoginRedirect />
        </div>
        {storeInfoOnly ? (
          <span className="absolute left-2 top-2 z-10 rounded-full border border-[#c4a574]/70 bg-white/95 px-2 py-0.5 text-[10px] font-semibold text-[#8b6f3e]">
            {UNCONTRACTED_PUBLIC_LABEL}
          </span>
        ) : null}
        {showSample ? <SampleListingBadge /> : null}
        {!storeInfoOnly && badge && (
          <ListingBadge badge={badge} offsetForSample={showSample} />
        )}

        <Link href={detailHref} scroll={false} prefetch className="block">
          {job.imageUrl ? (
            <div className="listing-card-image">
              <img
                src={job.imageUrl}
                alt={`${job.shopName}の${storeInfoOnly ? "店舗情報" : "求人"}｜${IMAGE_ALT_BRAND}`}
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
              {!storeInfoOnly ? (
                <div className="flex items-center gap-1.5">
                  <dt className="shrink-0 font-semibold text-[#8b6f3e]">時給</dt>
                  <dd>
                    <span className="listing-card-salary">{job.salary}</span>
                  </dd>
                </div>
              ) : (
                <div className="flex gap-1.5">
                  <dt className="shrink-0 font-semibold text-[#8b6f3e]">掲載</dt>
                  <dd className="line-clamp-1 text-[#111111]/70">店舗情報のみ</dd>
                </div>
              )}
            </dl>
            <span className="listing-card-link">
              {storeInfoOnly ? "店舗情報を見る" : "求人詳細を見る"}
            </span>
          </div>
        </Link>
      </article>
      </JobImpressionTracker>
    );
  }

  return (
    <JobImpressionTracker jobId={job.id} className="h-full">
    <article
      id={cardId}
      className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-gold/45 bg-gradient-to-br from-white via-ivory to-champagne shadow-luxury transition-transform duration-300 hover:-translate-y-0.5"
    >
      <JobDetailPrefetch jobId={job.id} />
      <div className="absolute right-2 top-2 z-10 flex items-center gap-1.5">
        {!storeInfoOnly ? <CompareButton jobId={job.id} /> : null}
        <FavoriteButton jobId={job.id} allowLineLoginRedirect />
      </div>
      {storeInfoOnly ? (
        <span className="absolute left-2 top-2 z-10 rounded-full border border-gold/40 bg-white/95 px-2 py-0.5 text-[10px] font-semibold text-gold-dark">
          {UNCONTRACTED_PUBLIC_LABEL}
        </span>
      ) : null}
      {showSample ? <SampleListingBadge /> : null}
      {!storeInfoOnly && badge && (
        <ListingBadge badge={badge} offsetForSample={showSample} />
      )}

      <Link href={detailHref} scroll={false} prefetch className="flex flex-1 flex-col">
        {job.imageUrl ? (
          <div className="overflow-hidden ring-1 ring-gold/40 ring-inset">
            <img
              src={job.imageUrl}
              alt={`${job.shopName}の${storeInfoOnly ? "店舗情報" : "求人"}｜${IMAGE_ALT_BRAND}`}
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
            {!storeInfoOnly ? (
              <div className="flex items-center gap-1.5">
                <dt className="shrink-0 font-semibold text-gold-dark">時給</dt>
                <dd>
                  <span className={luxurySalaryBadge}>{job.salary}</span>
                </dd>
              </div>
            ) : (
              <div className="flex gap-1.5">
                <dt className="shrink-0 font-semibold text-gold-dark">掲載</dt>
                <dd className="line-clamp-1 text-muted">店舗情報のみ</dd>
              </div>
            )}
          </dl>
          <span
            className={`mt-auto inline-flex min-h-9 items-center justify-center rounded-full px-3 pt-3 text-center text-xs ${luxuryMetalBtn}`}
          >
            {storeInfoOnly ? "店舗情報を見る" : "求人詳細を見る"}
          </span>
        </div>
      </Link>
    </article>
    </JobImpressionTracker>
  );
}
