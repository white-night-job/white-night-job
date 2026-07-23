import type { Metadata } from "next";
import { Suspense } from "react";
import { BrandAboutSection } from "@/components/BrandAboutSection";
import { FirstTimeGuide } from "@/components/FirstTimeGuide";
import { NightJobDiagnosis } from "@/components/NightJobDiagnosis";
import { RecentlyViewedCarousel } from "@/components/RecentlyViewedCarousel";
import { ScrollReveal } from "@/components/ScrollReveal";
import { TopColumnSection } from "@/components/TopColumnSection";
import { TopHeroPanel } from "@/components/TopHeroPanel";
import { TopJobDiscovery } from "@/components/TopJobDiscovery";
import { TopMidBand } from "@/components/TopMidBand";
import { TopPageShell } from "@/components/TopPageShell";
import { HomeHashScroll } from "@/components/HomeHashScroll";
import { SITE_BRAND_JA, SITE_DESCRIPTION, SITE_URL } from "@/lib/site";
import type { JobFilters } from "@/types/job";

const HOME_TITLE =
  "【体入ホワイトナイト】安心できるお店選びを、優良認定店専門サイト";

export const metadata: Metadata = {
  title: {
    absolute: HOME_TITLE,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    title: HOME_TITLE,
    description: SITE_DESCRIPTION,
    siteName: SITE_BRAND_JA,
    url: `${SITE_URL}/`,
    type: "website",
    locale: "ja_JP",
  },
  twitter: {
    card: "summary_large_image",
    title: HOME_TITLE,
    description: SITE_DESCRIPTION,
  },
  alternates: {
    canonical: `${SITE_URL}/`,
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
      midBand={<TopMidBand />}
    >
      <HomeHashScroll />
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
          <BrandAboutSection />
        </ScrollReveal>

        <ScrollReveal delayMs={140}>
          <FirstTimeGuide />
        </ScrollReveal>
      </div>
    </TopPageShell>
  );
}
