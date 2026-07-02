import { Suspense } from "react";
import Link from "next/link";
import { FirstTimeGuide } from "@/components/FirstTimeGuide";
import { Hero } from "@/components/Hero";
import { TopJobDiscovery } from "@/components/TopJobDiscovery";
import { TopPageShell } from "@/components/TopPageShell";
import { SupportConsultationSection } from "@/components/SupportConsultationSection";
import { SupportPromoBanner } from "@/components/SupportPromoBanner";
import { TOP_CTA_CARD_LAYOUT } from "@/components/top-cta-styles";
import { luxuryDarkCard, luxuryMetalBtn } from "@/lib/luxury-styles";
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
    <TopPageShell>
      <Hero />

      <div className="mt-4 space-y-4">
        <section className="space-y-3">
          <SupportPromoBanner />
          <Link
            href="#first-time-guide"
            className={`animate-fade-up animation-delay-150 group relative block overflow-hidden rounded-3xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-luxury-glow ${luxuryDarkCard} ${TOP_CTA_CARD_LAYOUT}`}
          >
            <div className="luxury-shimmer pointer-events-none absolute inset-0 opacity-50" aria-hidden />
            <span className="relative block text-sm font-semibold text-gold-mid">
              初めてでも安心して探せます
            </span>
            <span
              className={`relative mt-1 inline-flex w-full items-center justify-center rounded-full px-4 py-2.5 font-serif text-base font-semibold sm:text-lg ${luxuryMetalBtn}`}
            >
              初めてご利用される方はこちら
            </span>
          </Link>
        </section>

        <Suspense
          fallback={
            <div className="h-48 animate-pulse rounded-2xl border border-gold/30 bg-charcoal/50" />
          }
        >
          <TopJobDiscovery initialFilters={filters} />
        </Suspense>

        <SupportConsultationSection />

        <FirstTimeGuide />
      </div>
    </TopPageShell>
  );
}
