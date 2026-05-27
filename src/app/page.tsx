import { Suspense } from "react";
import { FirstTimeGuide } from "@/components/FirstTimeGuide";
import { Hero } from "@/components/Hero";
import { JobCount } from "@/components/JobCount";
import { JobFilterSearch } from "@/components/JobFilterSearch";
import { JobList } from "@/components/JobList";
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

  const filterLabel = [
    filters.district,
    filters.jobType,
    filters.query,
    filters.minSalary ? `${Number(filters.minSalary).toLocaleString()}円以上` : null,
    ...(filters.benefits ?? []),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <Hero />

      <div className="mt-6 space-y-6">
        <Suspense fallback={<div className="h-52 animate-pulse rounded-2xl bg-white" />}>
          <JobFilterSearch />
        </Suspense>

        <section id="jobs-section" className="scroll-mt-20">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-charcoal sm:text-xl">
              求人一覧
              {filterLabel && (
                <span className="ml-2 text-base font-normal text-gold-dark">
                  （{filterLabel}）
                </span>
              )}
            </h2>
            <span className="text-sm text-muted">
              <JobCount filters={filters} />
            </span>
          </div>
          <JobList filters={filters} />
        </section>

        <FirstTimeGuide />
      </div>
    </div>
  );
}
