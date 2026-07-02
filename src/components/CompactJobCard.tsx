import Link from "next/link";
import {
  luxuryBtnPrimary,
  luxuryCardSurface,
  luxuryImageFrame,
} from "@/lib/luxury-styles";
import { formatLocation } from "@/lib/job-storage";
import type { Job } from "@/types/job";

export function CompactJobCard({ job }: { job: Job }) {
  return (
    <article
      className={`flex h-full flex-col overflow-hidden rounded-2xl ${luxuryCardSurface}`}
    >
      {job.imageUrl ? (
        <div className={`overflow-hidden ${luxuryImageFrame}`}>
          <img
            src={job.imageUrl}
            alt={`${job.shopName}の店舗トップ画像`}
            className="h-28 w-full object-cover sm:h-32"
          />
        </div>
      ) : (
        <div className="flex h-28 w-full items-center justify-center bg-gradient-to-br from-charcoal via-[#251c11] to-gold-dark ring-1 ring-gold/40 ring-inset sm:h-32">
          <p className="font-serif text-sm font-semibold tracking-[0.18em] text-gold-light">
            White Night
          </p>
        </div>
      )}
      <div className="flex flex-1 flex-col p-3">
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
          <div className="flex gap-1.5">
            <dt className="shrink-0 font-semibold text-gold-dark">時給</dt>
            <dd className="line-clamp-1 font-bold text-gold">{job.salary}</dd>
          </div>
        </dl>
        <Link
          href={`/jobs/${job.id}`}
          className={`mt-auto inline-flex min-h-9 items-center justify-center rounded-full px-3 pt-3 text-center text-xs ${luxuryBtnPrimary}`}
        >
          求人詳細を見る
        </Link>
      </div>
    </article>
  );
}
