"use client";

import Link from "next/link";
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
        <div className="hero-plate-header px-0.5 pt-2 sm:pt-3">
          <div className="hero-plate-content">
            <SafetyBadge variant="hero" />

            <h1 className="hero-title font-serif">
              <span className="hero-title-dark">安心できるお店選びを、</span>
              <br />
              <span className="hero-title-gold">優良認定店</span>
              <span className="hero-title-dark">専門サイト</span>
            </h1>

            <div className="hero-brand">
              <div className="hero-brand-mark">
                <span className="hero-brand-line" aria-hidden />
                <p className="hero-brand-logo font-serif leading-none">
                  White Night
                </p>
                <span className="hero-brand-line" aria-hidden />
                <p className="hero-brand-sub font-serif uppercase">Job</p>
              </div>
            </div>

            <p className="hero-desc">
              審査済み店舗のみ掲載。
              <br />
              ブラック店舗は報告フォームへ。
            </p>

            <div className="hero-login-actions">
              <Link href="/jobs" className="hero-guest-btn">
                ゲストとして利用
              </Link>
              <a href="/api/line/login?redirect=/mypage" className="hero-line-btn">
                LINEでログイン
              </a>
            </div>
          </div>
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

      <div className="hero-promo-card mx-auto mt-7 w-full max-w-2xl sm:mt-9">
        <SupportPromoBanner standalone />
      </div>
    </div>
  );
}
