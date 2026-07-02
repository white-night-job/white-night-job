"use client";

import { useMemo, useState } from "react";
import type { JobFilters } from "@/types/job";
import { JobCount } from "./JobCount";
import { JobFilterSearch } from "./JobFilterSearch";
import { JobList } from "./JobList";

type JobSearchSectionProps = {
  initialFilters: JobFilters;
  title: string;
  showJobList?: boolean;
  resultsPath?: string;
};

function getFilterLabel(filters: JobFilters) {
  return [
    filters.district,
    filters.jobType,
    filters.query,
    filters.minSalary ? `${Number(filters.minSalary).toLocaleString()}円以上` : null,
    ...(filters.benefits ?? []),
  ]
    .filter(Boolean)
    .join(" · ");
}

export function JobSearchSection({
  initialFilters,
  title,
  showJobList = true,
  resultsPath,
}: JobSearchSectionProps) {
  const [appliedFilters, setAppliedFilters] = useState<JobFilters>(initialFilters);
  const filterLabel = useMemo(
    () => getFilterLabel(appliedFilters),
    [appliedFilters],
  );

  return (
    <div className="space-y-6">
      <JobFilterSearch
        appliedFilters={appliedFilters}
        onApply={setAppliedFilters}
        resultsPath={resultsPath}
      />

      {showJobList && (
      <section id="jobs-section" className="scroll-mt-20">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-charcoal sm:text-xl">
            {title}
            {filterLabel && (
              <span className="ml-2 text-base font-normal text-gold-dark">
                （{filterLabel}）
              </span>
            )}
          </h2>
          <span className="shrink-0 text-sm text-muted">
            <JobCount filters={appliedFilters} />
          </span>
        </div>
        <JobList filters={appliedFilters} />
      </section>
      )}
    </div>
  );
}
