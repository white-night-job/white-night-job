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
    <section className="hero-panel relative overflow-hidden rounded-3xl px-5 py-10 sm:px-8 sm:py-12 md:px-10 md:py-14">
      <HeroBackground />

      <div className="relative flex flex-col items-center text-center">
        <SafetyBadge size="lg" variant="hero" />

        <div className="hero-title-plate relative mt-8 w-full max-w-2xl sm:mt-9">
          <h1 className="hero-title relative font-serif text-[2.5rem] leading-relaxed text-balance sm:text-[2.8rem] md:text-[3.65rem] md:leading-relaxed">
            安心して働ける、
            <br />
            優良認定店専門サイト
          </h1>
        </div>

        <div className="hero-brand-block relative mt-9 w-full max-w-lg sm:mt-10">
          <p className="hero-brand-metal font-serif text-[2.75rem] font-black leading-none tracking-[0.18em] sm:text-[3.5rem] md:text-[4.25rem]">
            White Night
          </p>
          <div className="hero-brand-line mx-auto mt-5 w-full max-w-[20rem] sm:max-w-[24rem]" aria-hidden />
          <p className="hero-brand-metal mt-4 font-serif text-base font-bold uppercase tracking-[0.65em] sm:text-lg md:text-xl">
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

        <div className="hero-panel-divider w-full max-w-2xl" aria-hidden />

        <div className="w-full max-w-2xl">
          <SupportPromoBanner embedded />
        </div>
      </div>
    </section>
  );
}
