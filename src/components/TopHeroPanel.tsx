"use client";

import { JobFilterSearch } from "@/components/JobFilterSearch";
import { SafetyBadge } from "@/components/SafetyBadge";
import { SupportPromoBanner } from "@/components/SupportPromoBanner";
import { SITE_FORMAL_NAME } from "@/lib/site";
import type { JobFilters } from "@/types/job";

type TopHeroPanelProps = {
  initialFilters: JobFilters;
};

export function TopHeroPanel({ initialFilters }: TopHeroPanelProps) {
  return (
    <div className="first-view">
      <div className="hero-immersive">
        <div className="hero-immersive-fx" aria-hidden>
          <div className="hero-gold-sweep" />
          <div className="hero-particles" />
        </div>

        <div className="hero-plate-header hero-immersive-header">
          <div className="hero-plate-content">
            <SafetyBadge variant="hero" />

            <h2 className="hero-title font-serif">
              <span className="hero-title-dark">安心できるお店選びを、</span>
              <br />
              <span className="hero-title-gold">優良認定店</span>
              <span className="hero-title-dark">専門サイト</span>
            </h2>

            <h1 className="hero-brand">
              <div className="hero-brand-mark">
                <span className="hero-brand-line" aria-hidden />
                <p className="hero-brand-logo font-serif leading-none">White Night</p>
                <div className="hero-brand-tag-wrap">
                  <span
                    className="hero-brand-line hero-brand-line-through"
                    aria-hidden
                  />
                  <div className="hero-brand-tag">
                    <span className="hero-brand-tag-text font-serif">
                      体入ホワイトナイト
                    </span>
                  </div>
                </div>
                <p className="hero-brand-sub font-serif uppercase">JOB</p>
              </div>
            </h1>

            <p className="hero-desc">
              {SITE_FORMAL_NAME}は、審査済み店舗のみを掲載する夜職求人サイトです。
              <br />
              体験入店から正社員まで、安心して比較できる求人をお探しください。
            </p>
          </div>
        </div>

        <div className="hero-immersive-search">
          <div className="hero-search-unit hero-plate-search text-left">
            <JobFilterSearch
              appliedFilters={initialFilters}
              onApply={() => {}}
              resultsPath="/jobs"
              theme="premium"
              embedded
              inPlate
            />
          </div>
        </div>
      </div>

      <div className="hero-promo-fullbleed">
        <div className="hero-promo-card">
          <SupportPromoBanner standalone />
        </div>
      </div>
    </div>
  );
}
