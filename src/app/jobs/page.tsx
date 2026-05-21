import { Suspense } from "react";
import { JobCount } from "@/components/JobCount";
import { JobFilterSearch } from "@/components/JobFilterSearch";
import { JobList } from "@/components/JobList";
import type { JobFilters } from "@/types/job";

interface JobsPageProps {
  searchParams: Promise<{ district?: string; jobType?: string }>;
}

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const params = await searchParams;
  const filters: JobFilters = {
    district: params.district ?? null,
    jobType: params.jobType ?? null,
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
          <JobFilterSearch />
        </Suspense>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-charcoal">掲載求人</h2>
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
