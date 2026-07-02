"use client";

import { JobFilterSearch } from "@/components/JobFilterSearch";
import { JobListingCarousel } from "@/components/JobListingCarousel";
import { luxuryDarkSectionDivider } from "@/lib/luxury-styles";
import type { JobFilters } from "@/types/job";

type TopJobDiscoveryProps = {
  initialFilters: JobFilters;
};

export function TopJobDiscovery({ initialFilters }: TopJobDiscoveryProps) {
  return (
    <div className="space-y-5">
      <JobFilterSearch
        appliedFilters={initialFilters}
        onApply={() => {}}
        resultsPath="/jobs"
        theme="premium"
      />

      <div className={`${luxuryDarkSectionDivider} pt-5`}>
        <JobListingCarousel title="新着店舗一覧" kind="new" theme="premium" />
      </div>

      <div className={`${luxuryDarkSectionDivider} pt-5`}>
        <JobListingCarousel title="PICK UP店舗" kind="pickup" theme="premium" />
      </div>
    </div>
  );
}
