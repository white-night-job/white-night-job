"use client";

import { useMemo, useState } from "react";
import { formatStarRating } from "@/lib/girl-reviews";
import {
  GIRL_REVIEW_CATEGORY_LABELS,
  type GirlReview,
  type GirlReviewCategory,
} from "@/types/girl-review";
import { countGirlReviewsByCategory } from "@/lib/girl-reviews";

type GirlReviewsSectionProps = {
  reviews: GirlReview[];
};

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
                <p
                  className="text-sm tracking-wide text-gold-dark"
                  aria-label={`評価 ${review.rating} / 5`}
                >
                  {formatStarRating(review.rating)}
                </p>
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
