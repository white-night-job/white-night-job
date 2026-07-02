import Link from "next/link";
import {
  cardSurface,
  isPremiumTheme,
  luxuryMetalBtn,
  luxuryPremiumImageFrame,
  luxurySalaryBadge,
  type LuxuryTheme,
} from "@/lib/luxury-styles";
import { formatLocation } from "@/lib/job-storage";
import type { Job } from "@/types/job";

type CompactJobCardProps = {
  job: Job;
  theme?: LuxuryTheme;
  badge?: "new" | "pickup";
};

function ListingBadge({ badge }: { badge: "new" | "pickup" }) {
  if (badge === "pickup") {
    return (
      <span className="absolute left-2 top-2 z-10 inline-flex items-center gap-0.5 rounded-full border border-gold-mid/60 bg-gradient-gold-metal px-2 py-0.5 text-[10px] font-bold text-charcoal shadow-metal">
        <span className="text-gradient-gold" aria-hidden>
          ♛
        </span>
        PICK UP
      </span>
    );
  }

  return (
    <span className="absolute left-2 top-2 z-10 rounded-full border border-gold-light/60 bg-gradient-gold-metal px-2 py-0.5 text-[10px] font-bold text-charcoal shadow-metal">
      NEW
    </span>
  );
}

export function CompactJobCard({
  job,
  theme = "light",
  badge,
}: CompactJobCardProps) {
  const isPremium = isPremiumTheme(theme);
  const cardClass = cardSurface(theme);

  return (
    <article
      className={`relative flex h-full flex-col overflow-hidden rounded-2xl transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-luxury-glow ${cardClass}`}
    >
      {badge && <ListingBadge badge={badge} />}

      {job.imageUrl ? (
        <div className={isPremium ? luxuryPremiumImageFrame : "overflow-hidden ring-1 ring-gold/40 ring-inset"}>
          <img
            src={job.imageUrl}
            alt={`${job.shopName}の店舗トップ画像`}
            className={`h-28 w-full object-cover sm:h-32 ${isPremium ? "rounded-[10px]" : "rounded-xl"}`}
          />
        </div>
      ) : (
        <div className="flex h-28 w-full items-center justify-center rounded-xl bg-gradient-to-br from-ivory via-champagne to-gold-mid ring-2 ring-gold/50 ring-inset shadow-image-3d sm:h-32">
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
              <span className={isPremium ? luxurySalaryBadge : "inline-block rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 font-bold text-gold-dark"}>
                {job.salary}
              </span>
            </dd>
          </div>
        </dl>
        <Link
          href={`/jobs/${job.id}`}
          className={`mt-auto inline-flex min-h-9 items-center justify-center rounded-full px-3 pt-3 text-center text-xs ${luxuryMetalBtn}`}
        >
          求人詳細を見る
        </Link>
      </div>
    </article>
  );
}
