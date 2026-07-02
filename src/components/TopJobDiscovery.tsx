"use client";

import { JobListingCarousel } from "@/components/JobListingCarousel";
import { luxuryDarkSectionDivider } from "@/lib/luxury-styles";

export function TopJobDiscovery() {
  return (
    <div className="space-y-8 pt-4 sm:space-y-10 sm:pt-6">
      <JobListingCarousel title="新着店舗一覧" kind="new" theme="premium" />

      <div className={`${luxuryDarkSectionDivider} pt-6 sm:pt-8`}>
        <JobListingCarousel title="PICK UP店舗" kind="pickup" theme="premium" />
      </div>
    </div>
  );
}
