import { Suspense } from "react";
import { FirstTimeGuide } from "@/components/FirstTimeGuide";
import { Hero } from "@/components/Hero";
import { TopJobDiscovery } from "@/components/TopJobDiscovery";
import { TopPageShell } from "@/components/TopPageShell";
import { SupportConsultationSection } from "@/components/SupportConsultationSection";
import { SupportPromoBanner } from "@/components/SupportPromoBanner";
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

      <div className="mt-6 space-y-6 sm:mt-8 sm:space-y-8">
        <SupportPromoBanner />

        <Suspense
          fallback={
            <div className="h-48 animate-pulse rounded-2xl border border-[#b8a876]/40 bg-gradient-to-br from-[#f5f2eb] to-[#d4c9a8]" />
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
