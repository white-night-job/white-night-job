"use client";

import { JobFilterSearch } from "@/components/JobFilterSearch";
import { JobListingCarousel } from "@/components/JobListingCarousel";
import { luxurySectionDivider } from "@/lib/luxury-styles";
import type { JobFilters } from "@/types/job";

type TopJobDiscoveryProps = {
  initialFilters: JobFilters;
};

export function TopJobDiscovery({ initialFilters }: TopJobDiscoveryProps) {
  return (
    <div className="space-y-8">
      <JobFilterSearch
        appliedFilters={initialFilters}
        onApply={() => {}}
        resultsPath="/jobs"
      />

      <div className={`${luxurySectionDivider} pt-8`}>
        <JobListingCarousel
          title="新着店舗一覧"
          kind="new"
        />
      </div>

      <div className={`${luxurySectionDivider} pt-8`}>
        <JobListingCarousel
          title="PICK UP店舗"
          kind="pickup"
        />
      </div>
    </div>
  );
}
