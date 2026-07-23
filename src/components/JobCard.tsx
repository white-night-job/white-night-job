"use client";

import Link from "next/link";
import { CompareButton } from "@/components/CompareButton";
import { FavoriteButton } from "@/components/FavoriteButton";
import { JobImpressionTracker } from "@/components/JobImpressionTracker";
import { IMAGE_ALT_BRAND } from "@/lib/site";
import { luxuryCardSurface, luxuryImageFrame } from "@/lib/luxury-styles";
import { formatLocation } from "@/lib/job-storage";
import { shopCardDomId } from "@/lib/scroll-restoration";
import type { Job } from "@/types/job";
import { SafetyBadge } from "./SafetyBadge";

export function JobCard({ job }: { job: Job }) {
  return (
    <JobImpressionTracker jobId={job.id}>
    <article
      id={shopCardDomId(job.id)}
      className={`relative overflow-hidden rounded-3xl transition-all hover:-translate-y-0.5 hover:border-gold/55 hover:shadow-luxury ${luxuryCardSurface}`}
    >
      <div className="absolute right-3 top-3 z-10">
        <FavoriteButton jobId={job.id} />
      </div>
      <Link href={`/jobs/${job.id}`} scroll={false} className="block">
        {job.imageUrl ? (
          <div className={`overflow-hidden ${luxuryImageFrame}`}>
            <img
              src={job.imageUrl}
              alt={`${job.shopName}の求人｜${IMAGE_ALT_BRAND}`}
              className="h-52 w-full object-cover sm:h-56"
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
                PREMIUM SHOP
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
              {job.introductionText && (
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted">
                  {job.introductionText}
                </p>
              )}
            </div>
            {job.isVerified && <SafetyBadge size="sm" />}
          </div>

          <dl className="grid gap-2 text-sm">
            <div className="rounded-xl border border-gold/30 bg-gradient-to-r from-gold/10 via-gold-mid/10 to-gold-light/15 px-3 py-2">
              <dt className="text-xs font-semibold text-gold-dark">時給</dt>
              <dd className="mt-0.5 bg-gradient-to-r from-gold-dark via-gold to-gold-mid bg-clip-text text-base font-bold text-transparent">
                {job.salary}
              </dd>
            </div>
            <div className="rounded-xl border border-gold/20 bg-white/50 px-3 py-2">
              <dt className="text-xs font-semibold text-muted">営業時間</dt>
              <dd className="mt-0.5 line-clamp-1 text-muted">
                {job.businessHours || "応相談"}
              </dd>
            </div>
            {job.address && (
              <div className="rounded-xl border border-gold/20 bg-white/50 px-3 py-2">
                <dt className="text-xs font-semibold text-muted">住所</dt>
                <dd className="mt-0.5 line-clamp-2 text-muted">{job.address}</dd>
              </div>
            )}
            <div className="rounded-xl border border-gold/20 bg-white/50 px-3 py-2">
              <dt className="text-xs font-semibold text-muted">キャスト年齢</dt>
              <dd className="mt-0.5 line-clamp-1 text-muted">
                {job.ageGroup || "詳細ページで確認"}
              </dd>
            </div>
          </dl>

          <p className="mt-4 text-right text-xs font-semibold text-gold-dark">
            詳細を見る →
          </p>
        </div>
      </Link>
      <div className="border-t border-gold/10 px-4 pb-4 sm:px-5">
        <CompareButton jobId={job.id} />
      </div>
    </article>
    </JobImpressionTracker>
  );
}
