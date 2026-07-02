"use client";

import { JobListingCarousel } from "@/components/JobListingCarousel";
import { luxuryDarkSectionDivider } from "@/lib/luxury-styles";

export function TopJobDiscovery() {
  return (
    <div className="space-y-5">
      <JobListingCarousel title="新着店舗一覧" kind="new" theme="premium" />

      <div className={`${luxuryDarkSectionDivider} pt-5`}>
        <JobListingCarousel title="PICK UP店舗" kind="pickup" theme="premium" />
      </div>
    </div>
  );
}
