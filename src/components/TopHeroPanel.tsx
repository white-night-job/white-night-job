"use client";

import { HeroBackground } from "@/components/HeroBackground";
import { JobFilterSearch } from "@/components/JobFilterSearch";
import { SafetyBadge } from "@/components/SafetyBadge";
import { SupportPromoBanner } from "@/components/SupportPromoBanner";
import type { JobFilters } from "@/types/job";

type TopHeroPanelProps = {
  initialFilters: JobFilters;
};

export function TopHeroPanel({ initialFilters }: TopHeroPanelProps) {
  return (
    <section className="hero-panel relative overflow-hidden rounded-3xl px-4 py-6 sm:px-7 sm:py-8 md:px-9 md:py-10">
      <HeroBackground />

      <div className="relative flex flex-col items-center text-center">
        <SafetyBadge size="lg" variant="hero" />

        <div className="hero-title-plate relative mt-4 w-full max-w-xl sm:mt-5 md:max-w-2xl">
          <h1 className="hero-title relative font-serif text-balance">
            安心して働ける、
            <br />
            優良認定店専門サイト
          </h1>
        </div>

        <div className="hero-brand-block relative mt-4 w-full max-w-md sm:mt-5">
          <p className="hero-brand-metal font-serif text-[1.625rem] font-black leading-none tracking-[0.14em] sm:text-[2.25rem] md:text-[2.75rem]">
            White Night
          </p>
          <div className="hero-brand-line mx-auto mt-2.5 w-full max-w-[14rem] sm:mt-3 sm:max-w-[18rem]" aria-hidden />
          <p className="hero-brand-metal mt-2 font-serif text-xs font-bold uppercase tracking-[0.55em] sm:text-sm md:text-base">
            Job
          </p>
        </div>

        <div className="hero-panel-divider w-full max-w-2xl" aria-hidden />

        <div className="w-full max-w-2xl text-left">
          <JobFilterSearch
            appliedFilters={initialFilters}
            onApply={() => {}}
            resultsPath="/jobs"
            theme="premium"
            embedded
          />
        </div>

        <div className="hero-promo-frame relative mt-4 w-full max-w-2xl sm:mt-5">
          <SupportPromoBanner embedded inset />
        </div>
      </div>
    </section>
  );
}
