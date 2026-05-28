import Link from "next/link";
import { formatLocation } from "@/lib/job-storage";
import type { Job } from "@/types/job";
import { SafetyBadge } from "./SafetyBadge";

export function JobCard({ job }: { job: Job }) {
  return (
    <article className="overflow-hidden rounded-3xl border border-gold/20 bg-white shadow-gold transition-all hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-lg">
      <Link href={`/jobs/${job.id}`} className="block">
        {job.imageUrl ? (
          <img
            src={job.imageUrl}
            alt={`${job.shopName}の店舗写真`}
            className="h-52 w-full object-cover sm:h-56"
          />
        ) : (
          <div className="relative flex h-52 w-full items-center justify-center overflow-hidden bg-gradient-to-br from-charcoal via-[#251c11] to-gold-dark sm:h-56">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(232,213,163,0.42),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(201,169,98,0.28),transparent_34%)]" />
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
              <p className="mb-1 text-xs font-medium text-gold-dark">
                {formatLocation(job)} · {job.jobType}
              </p>
              <h3 className="truncate font-serif text-xl font-semibold text-charcoal">
                {job.shopName}
              </h3>
            </div>
            {job.isVerified && <SafetyBadge size="sm" />}
          </div>

          {job.description && (
            <p className="mb-3 line-clamp-3 text-sm leading-6 text-muted">
              {job.description}
            </p>
          )}

          <dl className="mt-3 grid gap-2 text-sm text-charcoal">
            <div className="rounded-xl border border-gold/15 bg-gold-light/20 px-3 py-2">
              <dt className="text-xs font-semibold text-gold-dark">時給</dt>
              <dd className="mt-0.5 font-bold text-gold-dark">{job.salary}</dd>
            </div>
            <div className="rounded-xl border border-gold/15 bg-ivory px-3 py-2">
              <dt className="text-xs font-semibold text-gold-dark">アクセス</dt>
              <dd className="mt-0.5 line-clamp-1 text-muted">
                {job.access || job.address || "詳細ページでご確認ください"}
              </dd>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-gold/15 bg-ivory px-3 py-2">
                <dt className="text-xs font-semibold text-gold-dark">営業時間</dt>
                <dd className="mt-0.5 line-clamp-1 text-muted">
                  {job.businessHours || "応相談"}
                </dd>
              </div>
              <div className="rounded-xl border border-gold/15 bg-ivory px-3 py-2">
                <dt className="text-xs font-semibold text-gold-dark">キャスト年齢</dt>
                <dd className="mt-0.5 line-clamp-1 text-muted">
                  {job.ageGroup || "詳細ページで確認"}
                </dd>
              </div>
            </div>
          </dl>

          <p className="mt-4 text-right text-xs font-semibold text-gold-dark">
            詳細を見る →
          </p>
        </div>
      </Link>
    </article>
  );
}
