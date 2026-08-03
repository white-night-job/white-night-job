"use client";

import { useMemo, useState, type MouseEvent } from "react";
import {
  GIRL_REVIEW_CATEGORY_LABELS,
  type GirlReview,
  type GirlReviewCategory,
} from "@/types/girl-review";
import { countGirlReviewsByCategory } from "@/lib/girl-reviews";

export const GIRL_REVIEWS_SECTION_ID = "girl-reviews";

type GirlReviewsSectionProps = {
  reviews: GirlReview[];
};

function clampRating(rating: number) {
  return Math.min(5, Math.max(1, Math.round(rating)));
}

function formatRatingValue(rating: number) {
  return clampRating(rating).toFixed(1);
}

function averageRating(reviews: GirlReview[]) {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((total, review) => total + review.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

function GoldStarIcon({
  filled,
  sizeClass = "h-[1.15rem] w-[1.15rem] sm:h-5 sm:w-5",
}: {
  filled: boolean;
  sizeClass?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={`${sizeClass} ${
        filled ? "text-[#F4C542]" : "text-[#F4C542]/30"
      }`}
    >
      <path
        fill="currentColor"
        d="M12 2.6l2.72 5.51 6.08.88-4.4 4.29 1.04 6.06L12 16.48l-5.44 2.86 1.04-6.06-4.4-4.29 6.08-.88L12 2.6z"
      />
    </svg>
  );
}

function ReviewStarRating({ rating }: { rating: number }) {
  const stars = clampRating(rating);
  const value = formatRatingValue(rating);

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      aria-label={`評価 ${value} / 5`}
    >
      <span className="inline-flex items-center gap-0.5" aria-hidden>
        {Array.from({ length: 5 }, (_, index) => (
          <GoldStarIcon key={index} filled={index < stars} />
        ))}
      </span>
      <span className="text-sm font-semibold tabular-nums tracking-wide text-gold-dark sm:text-base">
        {value}
      </span>
    </div>
  );
}

type GirlReviewsJumpCardProps = {
  reviews: GirlReview[];
  onNavigate?: () => void;
};

/** Compact summary + in-page jump to the reviews section. */
export function GirlReviewsJumpCard({
  reviews,
  onNavigate,
}: GirlReviewsJumpCardProps) {
  const counts = useMemo(() => countGirlReviewsByCategory(reviews), [reviews]);
  const avg = averageRating(reviews);
  const roundedStars = clampRating(avg);
  const avgLabel = avg.toFixed(1);

  if (counts.total === 0) return null;

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    onNavigate?.();
    const scroll = () => {
      const el = document.getElementById(GIRL_REVIEWS_SECTION_ID);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return true;
      }
      return false;
    };
    if (scroll()) return;
    window.setTimeout(scroll, 50);
    window.setTimeout(scroll, 150);
  }

  return (
    <aside
      className="mt-4 rounded-xl border border-gold/30 bg-gradient-to-br from-white via-ivory to-champagne/50 px-3.5 py-3 shadow-[0_4px_16px_rgba(201,169,98,0.12)]"
      aria-label="女の子の口コミの概要"
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="inline-flex items-center gap-0.5" aria-hidden>
          {Array.from({ length: 5 }, (_, index) => (
            <GoldStarIcon
              key={index}
              filled={index < roundedStars}
              sizeClass="h-3.5 w-3.5"
            />
          ))}
        </span>
        <span className="text-sm font-semibold tabular-nums text-charcoal">
          {avgLabel}
        </span>
        <span className="text-xs text-muted">平均評価</span>
        <span className="text-xs text-gold/50" aria-hidden>
          /
        </span>
        <span className="text-xs font-medium text-charcoal">
          {counts.total}件
        </span>
      </div>

      <a
        href={`#${GIRL_REVIEWS_SECTION_ID}`}
        onClick={handleClick}
        className="mt-2 inline-flex min-h-9 items-center text-sm font-semibold text-gold-dark underline-offset-2 hover:underline"
      >
        💬 女の子の口コミを見る
      </a>

      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
        <span>
          【{GIRL_REVIEW_CATEGORY_LABELS.interview}】{counts.interview}件
        </span>
        <span>
          【{GIRL_REVIEW_CATEGORY_LABELS.cast}】{counts.cast}件
        </span>
      </div>
    </aside>
  );
}

export function GirlReviewsSection({ reviews }: GirlReviewsSectionProps) {
  const counts = useMemo(() => countGirlReviewsByCategory(reviews), [reviews]);
  const [activeCategory, setActiveCategory] =
    useState<GirlReviewCategory>("interview");

  const visible = useMemo(
    () => reviews.filter((review) => review.category === activeCategory),
    [reviews, activeCategory],
  );

  if (counts.total === 0) return null;

  return (
    <section
      id={GIRL_REVIEWS_SECTION_ID}
      className="scroll-mt-24 rounded-2xl border border-gold/20 bg-ivory p-4 sm:p-5"
    >
      <h2 className="mb-4 text-base font-semibold text-charcoal">
        女の子の口コミ
      </h2>

      <div
        className="grid grid-cols-2 gap-2"
        role="tablist"
        aria-label="口コミ区分"
      >
        {(["interview", "cast"] as const).map((category) => {
          const active = activeCategory === category;
          const count =
            category === "interview" ? counts.interview : counts.cast;
          return (
            <button
              key={category}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveCategory(category)}
              className={`min-h-11 rounded-xl border px-3 py-2 text-left text-sm transition ${
                active
                  ? "border-gold bg-white font-semibold text-gold-dark shadow-gold"
                  : "border-gold/25 bg-white/70 text-muted hover:border-gold/40"
              }`}
            >
              <span className="block leading-snug">
                【{GIRL_REVIEW_CATEGORY_LABELS[category]}】
              </span>
              <span className="mt-0.5 block text-xs opacity-80">{count}件</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4" role="tabpanel">
        {visible.length === 0 ? (
          <p className="rounded-xl border border-gold/15 bg-white px-4 py-5 text-sm text-muted">
            この区分の口コミはまだありません。
          </p>
        ) : (
          <ul className="space-y-3">
            {visible.map((review) => (
              <li
                key={review.id}
                className="rounded-xl border border-gold/25 bg-white px-4 py-4 shadow-gold"
              >
                <ReviewStarRating rating={review.rating} />
                <p className="mt-2 text-sm font-semibold text-charcoal sm:text-base">
                  {review.nickname}（{review.age}歳）
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-charcoal sm:text-base">
                  {review.comment}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
