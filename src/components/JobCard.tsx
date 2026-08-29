"use client";

import Link from "next/link";
import { CompareButton } from "@/components/CompareButton";
import { FavoriteButton } from "@/components/FavoriteButton";
import { JobImpressionTracker } from "@/components/JobImpressionTracker";
import { IMAGE_ALT_BRAND, SHOW_SAMPLE_LISTINGS } from "@/lib/site";
import { luxuryCardSurface, luxuryImageFrame } from "@/lib/luxury-styles";
import { formatLocation } from "@/lib/job-storage";
import { JobDetailPrefetch } from "@/components/JobDetailPrefetch";
import { shopCardDomId } from "@/lib/shop-card-id";
import type { Job } from "@/types/job";
import { SampleListingBadge } from "@/components/SampleListingNotice";
import { SafetyBadge } from "./SafetyBadge";
import {
  isUncontractedPlan,
  UNCONTRACTED_PUBLIC_LABEL,
} from "@/lib/job-plan";
import { getJobComparisonBenefitTags } from "@/lib/seo-comparison-tags";

export function JobCard({
  job,
  showComparisonTags = false,
}: {
  job: Job;
  /** When true, show DB benefit tags useful for comparing listings (SEO landings). */
  showComparisonTags?: boolean;
}) {
  const storeInfoOnly = isUncontractedPlan(job.plan);
  const comparisonTags = showComparisonTags
    ? getJobComparisonBenefitTags(job)
    : [];
  const salaryText = job.salary?.trim() ?? "";
  const workHoursText = job.workHours?.trim() ?? "";
  const showSalary = !storeInfoOnly && (!showComparisonTags || salaryText.length > 0);
  return (
    <JobImpressionTracker jobId={job.id}>
      <article
        id={shopCardDomId(job.id)}
        className={`relative box-border w-full max-w-full overflow-hidden rounded-3xl transition-all hover:-translate-y-0.5 hover:border-gold/55 hover:shadow-luxury ${luxuryCardSurface}`}
      >
      <JobDetailPrefetch jobId={job.id} />
      {SHOW_SAMPLE_LISTINGS ? <SampleListingBadge /> : null}
      {storeInfoOnly ? (
        <span className="absolute left-3 top-3 z-10 rounded-full border border-gold/40 bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-gold-dark shadow-sm">
          {UNCONTRACTED_PUBLIC_LABEL}
        </span>
      ) : null}
      <div className="absolute right-3 top-3 z-10 flex max-w-[calc(100%-1.5rem)] flex-wrap items-center justify-end gap-1.5">
        {!storeInfoOnly ? <CompareButton jobId={job.id} /> : null}
        <FavoriteButton jobId={job.id} allowLineLoginRedirect />
      </div>
      <Link href={`/jobs/${job.id}`} scroll={false} prefetch className="block">
        {job.imageUrl ? (
          <div className={`overflow-hidden ${luxuryImageFrame}`}>
            <img
              src={job.imageUrl}
              alt={`${job.shopName}の${storeInfoOnly ? "店舗情報" : "求人"}｜${IMAGE_ALT_BRAND}`}
              className="block h-52 w-full max-w-full object-cover sm:h-56"
            />
          </div>
        ) : (
          <div className="relative flex h-52 w-full items-center justify-center overflow-hidden bg-gradient-to-br from-charcoal via-[#251c11] to-gold-dark ring-1 ring-gold/40 ring-inset sm:h-56">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.35),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(201,162,39,0.22),transparent_34%)]" />
            <div className="relative text-center">
              <p className="font-serif text-xl font-semibold tracking-[0.22em] text-gold-light">
                White Night
              </p>
              <p className="mt-2 text-xs tracking-[0.35em] text-gold-light/80">
                {storeInfoOnly ? "STORE INFO" : "PREMIUM SHOP"}
              </p>
            </div>
          </div>
        )}
        <div className="p-4 sm:p-5">
          <div className="mb-3 flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="mb-1 text-xs font-medium text-muted">
                {formatLocation(job)} · {job.jobType}
              </p>
              <h3 className="truncate font-serif text-2xl font-semibold text-charcoal">
                {job.shopName}
              </h3>
              {!storeInfoOnly && job.introductionText && (
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted">
                  {job.introductionText}
                </p>
              )}
            </div>
            {!storeInfoOnly && job.isVerified && <SafetyBadge size="sm" />}
          </div>

          <dl className="grid gap-2 text-sm">
            {showSalary ? (
              <div className="rounded-xl border border-gold/30 bg-gradient-to-r from-gold/10 via-gold-mid/10 to-gold-light/15 px-3 py-2">
                <dt className="text-xs font-semibold text-gold-dark">時給</dt>
                <dd className="mt-0.5 min-w-0 break-words bg-gradient-to-r from-gold-dark via-gold to-gold-mid bg-clip-text text-base font-bold text-transparent">
                  {salaryText}
                </dd>
              </div>
            ) : storeInfoOnly ? (
              <div className="rounded-xl border border-gold/20 bg-white/50 px-3 py-2">
                <dt className="text-xs font-semibold text-muted">営業時間</dt>
                <dd className="mt-0.5 line-clamp-1 text-muted">
                  {job.businessHours?.trim() || "情報なし"}
                </dd>
              </div>
            ) : null}
            {!storeInfoOnly ? (
              <div className="rounded-xl border border-gold/20 bg-white/50 px-3 py-2">
                <dt className="text-xs font-semibold text-muted">営業時間</dt>
                <dd className="mt-0.5 line-clamp-1 text-muted">
                  {job.businessHours || "応相談"}
                </dd>
              </div>
            ) : null}
            {job.address && (
              <div className="rounded-xl border border-gold/20 bg-white/50 px-3 py-2">
                <dt className="text-xs font-semibold text-muted">住所</dt>
                <dd className="mt-0.5 line-clamp-2 text-muted">{job.address}</dd>
              </div>
            )}
            {!storeInfoOnly ? (
              <div className="rounded-xl border border-gold/20 bg-white/50 px-3 py-2">
                <dt className="text-xs font-semibold text-muted">キャスト年齢</dt>
                <dd className="mt-0.5 line-clamp-1 text-muted">
                  {job.ageGroup || "詳細ページで確認"}
                </dd>
              </div>
            ) : null}
          </dl>

          {comparisonTags.length > 0 ? (
            <ul
              className="mt-3 flex flex-wrap gap-1.5"
              aria-label="求人の比較ポイント"
            >
              {comparisonTags.map((tag) => (
                <li
                  key={tag.match}
                  className="rounded-full border border-gold/30 bg-champagne/40 px-2.5 py-1 text-[11px] font-semibold text-gold-dark"
                >
                  {tag.label}
                </li>
              ))}
            </ul>
          ) : null}

          {showComparisonTags && !storeInfoOnly && workHoursText ? (
            <p className="mt-2 text-xs leading-5 text-muted">
              <span className="font-medium text-charcoal">勤務時間：</span>
              <span className="line-clamp-2">{workHoursText}</span>
            </p>
          ) : null}

          <p className="mt-4 text-right text-xs font-semibold text-gold-dark">
            {storeInfoOnly ? "店舗情報を見る →" : "詳細を見る →"}
          </p>
        </div>
      </Link>
      </article>
    </JobImpressionTracker>
  );
}
