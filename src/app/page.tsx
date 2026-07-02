import { Suspense } from "react";
import Link from "next/link";
import { FirstTimeGuide } from "@/components/FirstTimeGuide";
import { Hero } from "@/components/Hero";
import { TopJobDiscovery } from "@/components/TopJobDiscovery";
import { SupportConsultationSection } from "@/components/SupportConsultationSection";
import { SupportPromoBanner } from "@/components/SupportPromoBanner";
import { TOP_CTA_CARD_LAYOUT } from "@/components/top-cta-styles";
import type { JobFilters } from "@/types/job";

interface HomePageProps {
  searchParams: Promise<{
    district?: string;
    jobType?: string;
    q?: string;
    minSalary?: string;
    benefit?: string | string[];
  }>;
}

function toArray(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const filters: JobFilters = {
    district: params.district ?? null,
    jobType: params.jobType ?? null,
    query: params.q ?? null,
    minSalary: params.minSalary ?? null,
    benefits: toArray(params.benefit),
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <Hero />

      <div className="mt-6 space-y-6">
        <section className="space-y-4">
          <SupportPromoBanner />
          <Link
            href="#first-time-guide"
            className={`animate-fade-up animation-delay-150 group block rounded-3xl border border-gold/35 bg-white shadow-[0_12px_32px_rgba(33,29,24,0.08)] transition-all duration-300 hover:-translate-y-1 hover:border-gold hover:bg-gold-light/15 hover:shadow-gold ${TOP_CTA_CARD_LAYOUT}`}
          >
            <span className="block text-sm font-semibold text-gold-dark">
              初めてでも安心して探せます
            </span>
            <span className="mt-1 block font-serif text-lg font-semibold text-charcoal sm:text-xl">
              🔰 初めてご利用される方はこちら
            </span>
          </Link>
        </section>

        <Suspense fallback={<div className="h-52 animate-pulse rounded-2xl bg-white" />}>
          <TopJobDiscovery initialFilters={filters} />
        </Suspense>

        <SupportConsultationSection />

        <FirstTimeGuide />
      </div>
    </div>
  );
}
