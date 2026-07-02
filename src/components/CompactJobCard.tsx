import Link from "next/link";
import { formatLocation } from "@/lib/job-storage";
import type { Job } from "@/types/job";

export function CompactJobCard({ job }: { job: Job }) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-gold/20 bg-white shadow-gold">
      {job.imageUrl ? (
        <img
          src={job.imageUrl}
          alt={`${job.shopName}の店舗トップ画像`}
          className="h-28 w-full object-cover sm:h-32"
        />
      ) : (
        <div className="flex h-28 w-full items-center justify-center bg-gradient-to-br from-charcoal via-[#251c11] to-gold-dark sm:h-32">
          <p className="font-serif text-sm font-semibold tracking-[0.18em] text-gold-light">
            White Night
          </p>
        </div>
      )}
      <div className="flex flex-1 flex-col p-3">
        <h3 className="line-clamp-2 font-serif text-base font-semibold leading-snug text-charcoal">
          {job.shopName}
        </h3>
        <dl className="mt-2 space-y-1 text-xs text-muted">
          <div className="flex gap-1.5">
            <dt className="shrink-0 font-semibold text-gold-dark">エリア</dt>
            <dd className="line-clamp-1">{formatLocation(job)}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="shrink-0 font-semibold text-gold-dark">職種</dt>
            <dd className="line-clamp-1">{job.jobType}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="shrink-0 font-semibold text-gold-dark">時給</dt>
            <dd className="line-clamp-1 font-semibold text-charcoal">{job.salary}</dd>
          </div>
        </dl>
        <Link
          href={`/jobs/${job.id}`}
          className="mt-auto pt-3 text-right text-xs font-semibold text-gold-dark hover:underline"
        >
          求人詳細を見る →
        </Link>
      </div>
    </article>
  );
}
