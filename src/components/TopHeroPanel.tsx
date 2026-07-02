"use client";

import { JobFilterSearch } from "@/components/JobFilterSearch";
import { SupportPromoBanner } from "@/components/SupportPromoBanner";
import type { JobFilters } from "@/types/job";

type TopHeroPanelProps = {
  initialFilters: JobFilters;
};

export function TopHeroPanel({ initialFilters }: TopHeroPanelProps) {
  return (
    <div className="first-view">
      <div className="hero-unified-plate mx-auto w-full max-w-2xl">
        <div className="hero-plate-header text-center">
          <h1 className="hero-title font-serif text-balance">
            安心して働ける、
            <br />
            優良認定店専門サイト
          </h1>

          <p className="hero-desc mx-auto mt-2 max-w-md px-1 text-sm leading-relaxed sm:mt-2.5 sm:text-base">
            審査済みの優良店のみ厳選。ブラック店は報告フォームからご連絡ください。
          </p>

          <div className="hero-brand mt-3 sm:mt-4">
            <p className="font-serif text-[1.75rem] font-black leading-none tracking-[0.12em] sm:text-[2.5rem] md:text-[2.875rem]">
              White Night
            </p>
            <p className="mt-1.5 font-serif text-[0.65rem] font-bold uppercase tracking-[0.55em] sm:text-xs md:text-sm">
              Job
            </p>
          </div>
        </div>

        <div className="hero-plate-search mt-4 text-left sm:mt-5">
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
