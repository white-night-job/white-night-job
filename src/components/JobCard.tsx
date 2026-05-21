import Link from "next/link";
import { formatLocation } from "@/lib/job-storage";
import type { Job } from "@/types/job";
import { SafetyBadge } from "./SafetyBadge";

export function JobCard({ job }: { job: Job }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-gold/20 bg-white shadow-gold transition-all hover:border-gold/50 hover:shadow-lg">
      <Link href={`/jobs/${job.id}`} className="block">
        {job.imageUrl ? (
          <img
            src={job.imageUrl}
            alt={`${job.shopName}の店舗写真`}
            className="h-40 w-full object-cover"
          />
        ) : (
          <div className="relative flex h-40 w-full items-center justify-center overflow-hidden bg-gradient-to-br from-charcoal via-[#2b2418] to-gold-dark">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(232,213,163,0.35),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(201,169,98,0.22),transparent_35%)]" />
            <div className="relative rounded-full border border-gold-light/50 px-5 py-2 text-sm font-semibold tracking-[0.25em] text-gold-light">
              WHITE NIGHT
            </div>
          </div>
        )}
        <div className="p-4 sm:p-5">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="mb-1 text-xs font-medium text-gold-dark">{formatLocation(job)}</p>
            <h3 className="line-clamp-2 font-semibold text-charcoal sm:text-lg">{job.title}</h3>
            <p className="mt-1 truncate text-sm text-muted">{job.shopName}</p>
          </div>
          {job.isVerified && <SafetyBadge size="sm" />}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="rounded-full border border-gold/30 bg-ivory px-3 py-1 text-xs text-muted">
            {job.jobType}
          </span>
          <span className="font-semibold text-gold-dark">{job.salary}</span>
        </div>
        <p className="mt-3 line-clamp-2 text-sm text-muted">{job.description}</p>
        <p className="mt-3 text-right text-xs font-medium text-gold">詳細を見る →</p>
        </div>
      </Link>
    </article>
  );
}
