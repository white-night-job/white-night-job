import Link from "next/link";
import {
  luxuryDarkCard,
  luxuryDarkImageFrame,
  luxuryMetalBtn,
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
      <span className="absolute left-2 top-2 z-10 inline-flex items-center gap-0.5 rounded-full border border-gold-mid/60 bg-gradient-gold-metal px-2 py-0.5 text-[10px] font-bold text-void shadow-metal">
        <span aria-hidden>♛</span>
        PICK UP
      </span>
    );
  }

  return (
    <span className="absolute left-2 top-2 z-10 rounded-full border border-gold-light/50 bg-gradient-to-r from-gold-dark via-gold-mid to-gold-light px-2 py-0.5 text-[10px] font-bold text-void shadow-metal">
      NEW
    </span>
  );
}

export function CompactJobCard({
  job,
  theme = "light",
  badge,
}: CompactJobCardProps) {
  const isDark = theme === "dark";
  const cardClass = isDark ? luxuryDarkCard : "border border-gold/35 bg-gradient-to-br from-ivory via-[#FFF9EE] to-[#F8F0DC] shadow-luxury";

  return (
    <article className={`relative flex h-full flex-col overflow-hidden rounded-2xl ${cardClass}`}>
      {badge && <ListingBadge badge={badge} />}

      {job.imageUrl ? (
        <div className={isDark ? luxuryDarkImageFrame : "overflow-hidden ring-1 ring-gold/40 ring-inset"}>
          <img
            src={job.imageUrl}
            alt={`${job.shopName}の店舗トップ画像`}
            className="h-28 w-full rounded-xl object-cover sm:h-32"
          />
        </div>
      ) : (
        <div className="flex h-28 w-full items-center justify-center rounded-xl bg-gradient-to-br from-void via-charcoal to-gold-dark ring-2 ring-gold/45 ring-inset sm:h-32">
          <p className="font-serif text-sm font-semibold tracking-[0.18em] text-gold-light">
            White Night
          </p>
        </div>
      )}

      <div className="flex flex-1 flex-col p-3">
        <h3
          className={`line-clamp-2 font-serif text-lg font-semibold leading-snug ${
            isDark ? "text-white" : "text-charcoal"
          }`}
        >
          {job.shopName}
        </h3>
        <dl className="mt-2 space-y-1 text-xs">
          <div className="flex gap-1.5">
            <dt className={`shrink-0 font-semibold ${isDark ? "text-white/50" : "text-muted"}`}>
              エリア
            </dt>
            <dd className={`line-clamp-1 ${isDark ? "text-white/65" : "text-muted"}`}>
              {formatLocation(job)}
            </dd>
          </div>
          <div className="flex gap-1.5">
            <dt className={`shrink-0 font-semibold ${isDark ? "text-white/50" : "text-muted"}`}>
              職種
            </dt>
            <dd className={`line-clamp-1 ${isDark ? "text-white/65" : "text-muted"}`}>
              {job.jobType}
            </dd>
          </div>
          <div className="flex items-center gap-1.5">
            <dt className="shrink-0 font-semibold text-gold-mid">時給</dt>
            <dd>
              <span className="inline-block rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 font-bold text-gold-light">
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
