import { Suspense } from "react";
import { FirstTimeGuide } from "@/components/FirstTimeGuide";
import { Hero } from "@/components/Hero";
import { JobSearchSection } from "@/components/JobSearchSection";
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
        <Suspense fallback={<div className="h-52 animate-pulse rounded-2xl bg-white" />}>
          <JobSearchSection initialFilters={filters} title="求人一覧" />
        </Suspense>

        <FirstTimeGuide />
      </div>
    </div>
  );
}
