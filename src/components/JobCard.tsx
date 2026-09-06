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
import { buildJobCardConditions } from "@/lib/job-card-conditions";

const MAX_JOB_CARD_CONDITION_TAGS = 8;

export function JobCard({
  job,
  showComparisonTags: _showComparisonTags = false,
}: {
  job: Job;
  /**
   * Kept for call-site compatibility (SEO landings).
   * Condition rows/tags are now shown for every paid job when DB values exist.
   */
  showComparisonTags?: boolean;
}) {
  const storeInfoOnly = isUncontractedPlan(job.plan);
  const conditions = !storeInfoOnly ? buildJobCardConditions(job) : null;
  const conditionTags = (conditions?.tags ?? []).slice(
    0,
    MAX_JOB_CARD_CONDITION_TAGS,
  );
  const hasConditionBlock = Boolean(
    conditions &&
      (conditions.priorityRows.length > 0 || conditionTags.length > 0),
  );
  const addressText = job.address?.trim() ?? "";
  const ageGroupText = job.ageGroup?.trim() ?? "";
  const businessHoursText = job.businessHours?.trim() ?? "";
  const introText = job.introductionText?.trim() ?? "";

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
        <div className="px-3.5 py-3 sm:px-4 sm:py-3.5">
          <div className="mb-2 flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="mb-0.5 text-[11px] font-medium leading-tight text-muted">
                {formatLocation(job)} · {job.jobType}
              </p>
              <h3 className="truncate font-serif text-2xl font-semibold leading-tight text-charcoal">
                {job.shopName}
              </h3>
              {!storeInfoOnly && introText ? (
                <p className="mt-1 line-clamp-2 text-xs leading-snug text-muted sm:text-sm sm:leading-5">
                  {introText}
                </p>
              ) : null}
            </div>
            {!storeInfoOnly && job.isVerified && <SafetyBadge size="sm" />}
          </div>

          {storeInfoOnly ? (
            <div className="space-y-0.5 text-xs leading-snug text-muted">
              {businessHoursText ? (
                <p className="line-clamp-1">
                  <span className="font-medium text-charcoal">営業時間：</span>
                  {businessHoursText}
                </p>
              ) : null}
              {addressText ? (
                <p className="line-clamp-2">
                  <span className="font-medium text-charcoal">住所：</span>
                  {addressText}
                </p>
              ) : null}
            </div>
          ) : (
            <>
              {hasConditionBlock && conditions ? (
                <>
                  {conditions.priorityRows.length > 0 ? (
                    <dl className="grid grid-cols-2 gap-1">
                      {conditions.priorityRows.map((row) => (
                        <div
                          key={`${row.label}:${row.value}`}
                          className={
                            row.emphasize
                              ? "min-w-0 rounded-md border border-gold/30 bg-gradient-to-r from-gold/10 via-gold-mid/10 to-gold-light/15 px-1.5 py-0.5"
                              : "min-w-0 rounded-md border border-gold/20 bg-white/50 px-1.5 py-0.5"
                          }
                        >
                          <dt
                            className={`text-[9px] font-semibold leading-none ${
                              row.emphasize ? "text-gold-dark" : "text-muted"
                            }`}
                          >
                            {row.label}
                          </dt>
                          <dd
                            className={`mt-0.5 line-clamp-2 min-w-0 break-words text-[11px] font-medium leading-tight sm:text-xs ${
                              row.emphasize
                                ? "bg-gradient-to-r from-gold-dark via-gold to-gold-mid bg-clip-text font-bold text-transparent"
                                : "text-charcoal"
                            }`}
                          >
                            {row.value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  ) : null}

                  {conditionTags.length > 0 ? (
                    <ul
                      className={`flex flex-wrap gap-1 ${
                        conditions.priorityRows.length > 0 ? "mt-1.5" : ""
                      }`}
                      aria-label="求人の比較ポイント"
                    >
                      {conditionTags.map((tag) => (
                        <li
                          key={tag.key}
                          className="rounded-full border border-gold/30 bg-champagne/40 px-1.5 py-px text-[10px] font-semibold leading-4 text-gold-dark"
                        >
                          {tag.label}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </>
              ) : null}

              {(addressText || ageGroupText) && (
                <div
                  className={`space-y-0.5 text-[11px] leading-snug text-muted ${
                    hasConditionBlock ? "mt-1.5" : ""
                  }`}
                >
                  {addressText ? (
                    <p className="line-clamp-2">
                      <span className="font-medium text-charcoal">住所：</span>
                      {addressText}
                    </p>
                  ) : null}
                  {ageGroupText ? (
                    <p className="line-clamp-1">
                      <span className="font-medium text-charcoal">
                        キャスト年齢：
                      </span>
                      {ageGroupText}
                    </p>
                  ) : null}
                </div>
              )}
            </>
          )}

          <p className="mt-2 text-right text-[11px] font-semibold text-gold-dark">
            {storeInfoOnly ? "店舗情報を見る →" : "詳細を見る →"}
          </p>
        </div>
      </Link>
      </article>
    </JobImpressionTracker>
  );
}
