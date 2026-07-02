"use client";

import { JobFilterSearch } from "@/components/JobFilterSearch";
import { SafetyBadge } from "@/components/SafetyBadge";
import { SupportPromoBanner } from "@/components/SupportPromoBanner";
import type { JobFilters } from "@/types/job";

type TopHeroPanelProps = {
  initialFilters: JobFilters;
};

export function TopHeroPanel({ initialFilters }: TopHeroPanelProps) {
  return (
    <div className="first-view">
      <div className="hero-unified-plate relative mx-auto w-full max-w-2xl">
        <div className="hero-plate-header px-1 pt-2 text-center sm:pt-3">
          <div className="mb-2 flex w-full justify-start">
            <SafetyBadge size="xs" variant="hero" />
          </div>

          <h1 className="hero-title font-serif text-balance">
            安心して働ける、
            <br />
            優良認定店専門サイト
          </h1>

          <div className="hero-brand mt-2 sm:mt-2.5">
            <p className="hero-brand-logo font-serif leading-none">
              White Night
            </p>
            <p className="hero-brand-sub mt-1 font-serif uppercase">Job</p>
          </div>

          <p className="hero-desc mx-auto mt-2 max-w-xs px-1">
            審査済み店舗のみ掲載。
            <br />
            ブラック店舗は報告フォームへ。
          </p>
        </div>

        <div className="hero-search-unit hero-plate-search mt-2 text-left sm:mt-2.5">
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

      <div className="hero-promo-card mx-auto mt-8 w-full max-w-2xl sm:mt-10">
        <SupportPromoBanner standalone />
      </div>
    </div>
  );
}
