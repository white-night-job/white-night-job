"use client";

import { useMemo, useState } from "react";
import {
  GIRL_REVIEW_CATEGORY_LABELS,
  type GirlReview,
  type GirlReviewCategory,
} from "@/types/girl-review";
import { countGirlReviewsByCategory } from "@/lib/girl-reviews";

type GirlReviewsSectionProps = {
  reviews: GirlReview[];
};

function clampRating(rating: number) {
  return Math.min(5, Math.max(1, Math.round(rating)));
}

function formatRatingValue(rating: number) {
  return clampRating(rating).toFixed(1);
}

function GoldStarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={`h-[1.15rem] w-[1.15rem] sm:h-5 sm:w-5 ${
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
    <section className="rounded-2xl border border-gold/20 bg-ivory p-4 sm:p-5">
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
