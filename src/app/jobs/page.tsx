import { Suspense } from "react";
import { JobSearchSection } from "@/components/JobSearchSection";
import type { JobFilters } from "@/types/job";

interface JobsPageProps {
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

export default async function JobsPage({ searchParams }: JobsPageProps) {
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
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-semibold text-charcoal sm:text-3xl">
          求人一覧
        </h1>
        <p className="mt-2 text-sm text-muted">
          管理画面で追加した求人もここに表示されます。
        </p>
      </div>

      <div className="space-y-6">
        <Suspense fallback={<div className="h-52 animate-pulse rounded-2xl bg-white" />}>
          <JobSearchSection initialFilters={filters} title="掲載求人" />
        </Suspense>
      </div>
    </div>
  );
}
