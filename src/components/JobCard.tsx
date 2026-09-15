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
                    <div className="space-y-1">
                      {conditions.priorityRows
                        .filter((row) => row.variant === "trialExclusive")
                        .map((row) => (
                          <div
                            key={`${row.label}:${row.value}`}
                            className="relative flex flex-col items-center justify-center overflow-hidden rounded-lg border border-gold/40 px-2 py-1.5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
                            style={{
                              backgroundImage: [
                                "radial-gradient(ellipse 75% 65% at 8% 18%, rgba(255,255,255,0.98) 0%, transparent 58%)",
                                "radial-gradient(ellipse 70% 55% at 92% 22%, rgba(244,210,220,0.72) 0%, transparent 55%)",
                                "radial-gradient(ellipse 65% 60% at 78% 88%, rgba(255,255,255,0.92) 0%, transparent 52%)",
                                "radial-gradient(ellipse 60% 50% at 18% 82%, rgba(236,188,204,0.68) 0%, transparent 55%)",
                                "radial-gradient(ellipse 50% 40% at 48% 48%, rgba(250,230,236,0.55) 0%, transparent 60%)",
                                "linear-gradient(145deg, #fff9fb 0%, #f6e4eb 42%, #faf0f4 72%, #f3dce5 100%)",
                              ].join(", "),
                            }}
                          >
                            <span
                              className="mb-1 h-px w-[min(11.5rem,78%)] bg-gradient-to-r from-transparent via-[#c4a574] to-transparent"
                              aria-hidden
                            />
                            <p className="max-w-full text-[13px] font-bold leading-tight tracking-wide text-[#9a7a3a] sm:text-sm">
                              {row.label}
                            </p>
                            <p className="mt-0.5 flex max-w-full min-w-0 flex-wrap items-baseline justify-center gap-x-1 leading-none">
                              <span className="shrink-0 text-xs font-semibold text-[#b08d4a] sm:text-[13px]">
                                体入時給
                              </span>
                              <span className="min-w-0 break-words font-serif text-[24px] font-bold tracking-wide text-[#8b6914] sm:text-[26px]">
                                {row.amountDisplay || row.value}
                              </span>
                            </p>
                            <span
                              className="mt-1 h-px w-[min(11.5rem,78%)] bg-gradient-to-r from-transparent via-[#c4a574] to-transparent"
                              aria-hidden
                            />
                          </div>
                        ))}
                      {conditions.priorityRows.some(
                        (row) => row.variant !== "trialExclusive",
                      ) ? (
                        <dl className="grid grid-cols-2 gap-1">
                          {conditions.priorityRows
                            .filter((row) => row.variant !== "trialExclusive")
                            .map((row) => (
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
                                    row.emphasize
                                      ? "text-gold-dark"
                                      : "text-muted"
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
                    </div>
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
