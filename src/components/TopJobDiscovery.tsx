"use client";

import { JobListingCarousel } from "@/components/JobListingCarousel";

export function TopJobDiscovery() {
  return (
    <div className="space-y-6 pt-4 sm:space-y-8 sm:pt-6">
      <JobListingCarousel title="新着店舗一覧" kind="new" theme="premium" />
      <JobListingCarousel title="PICK UP店舗" kind="pickup" theme="premium" />
    </div>
  );
}
