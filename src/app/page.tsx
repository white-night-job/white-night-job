import { Suspense } from "react";
import { Hero } from "@/components/Hero";
import { JobCount } from "@/components/JobCount";
import { JobFilterSearch } from "@/components/JobFilterSearch";
import { JobList } from "@/components/JobList";
import type { JobFilters } from "@/types/job";

interface HomePageProps {
  searchParams: Promise<{ district?: string; jobType?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const filters: JobFilters = {
    district: params.district ?? null,
    jobType: params.jobType ?? null,
  };

  const filterLabel = [filters.district, filters.jobType].filter(Boolean).join(" · ");

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <Hero />

      <div className="mt-6 space-y-6">
        <Suspense fallback={<div className="h-52 animate-pulse rounded-2xl bg-white" />}>
          <JobFilterSearch />
        </Suspense>

        <section>
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
      </div>
    </div>
  );
}
