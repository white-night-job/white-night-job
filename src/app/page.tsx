import type { Metadata } from "next";
import { Suspense } from "react";
import { BrandAboutSection } from "@/components/BrandAboutSection";
import { FirstTimeGuide } from "@/components/FirstTimeGuide";
import { NightJobDiagnosis } from "@/components/NightJobDiagnosis";
import { RecentlyViewedCarousel } from "@/components/RecentlyViewedCarousel";
import { ScrollReveal } from "@/components/ScrollReveal";
import { TopColumnSection } from "@/components/TopColumnSection";
import { TopFeatureIntroSection } from "@/components/TopFeatureIntroSection";
import { TopHeroPanel } from "@/components/TopHeroPanel";
import { TopJobDiscovery } from "@/components/TopJobDiscovery";
import { TopPageShell } from "@/components/TopPageShell";
import { SupportConsultationSection } from "@/components/SupportConsultationSection";
import { SITE_DESCRIPTION, SITE_OG_TITLE, SITE_TITLE } from "@/lib/site";
import type { JobFilters } from "@/types/job";

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_OG_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    title: SITE_OG_TITLE,
    description: SITE_DESCRIPTION,
  },
};

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
    <TopPageShell
      hero={<TopHeroPanel initialFilters={filters} />}
      featureBand={<TopFeatureIntroSection />}
    >
      <div className="mt-6 space-y-6 sm:mt-8 sm:space-y-8">
        <ScrollReveal delayMs={40}>
          <Suspense
            fallback={
              <div className="h-48 animate-pulse rounded-2xl border border-[#b8a876]/40 bg-gradient-to-br from-[#f5f2eb] to-[#d4c9a8]" />
            }
          >
            <TopJobDiscovery />
          </Suspense>
        </ScrollReveal>

        <ScrollReveal delayMs={60}>
          <NightJobDiagnosis />
        </ScrollReveal>

        <ScrollReveal delayMs={80}>
          <RecentlyViewedCarousel />
        </ScrollReveal>

        <ScrollReveal delayMs={100}>
          <TopColumnSection />
        </ScrollReveal>

        <ScrollReveal delayMs={120}>
          <SupportConsultationSection />
        </ScrollReveal>

        <ScrollReveal delayMs={140}>
          <BrandAboutSection />
        </ScrollReveal>

        <ScrollReveal delayMs={160}>
          <FirstTimeGuide />
        </ScrollReveal>
      </div>
    </TopPageShell>
  );
}
