import { JobListingCarousel } from "@/components/JobListingCarousel";

export function TopJobDiscovery() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <JobListingCarousel title="新着店舗一覧" kind="new" theme="premium" />
      <JobListingCarousel title="PICK UP店舗" kind="pickup" theme="premium" />
      <JobListingCarousel
        title="新規オープン店舗"
        kind="new-open"
        theme="premium"
      />
    </div>
  );
}
