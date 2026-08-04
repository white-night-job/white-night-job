import {
  SHOW_SAMPLE_LISTINGS,
  SAMPLE_LISTING_DETAIL_NOTE,
  SAMPLE_LISTING_HOME_NOTICE,
} from "@/lib/site";

/** Small corner badge for listing cards during pre-launch sample display. */
export function SampleListingBadge({
  className = "",
}: {
  className?: string;
}) {
  if (!SHOW_SAMPLE_LISTINGS) return null;

  return (
    <span
      className={`sample-listing-badge ${className}`.trim()}
      aria-label="サンプル求人"
    >
      サンプル
    </span>
  );
}

/** Notice under shop name on job detail pages. */
export function SampleListingDetailNote() {
  if (!SHOW_SAMPLE_LISTINGS) return null;

  return (
    <p className="mt-2 text-xs leading-relaxed text-muted sm:text-sm">
      {SAMPLE_LISTING_DETAIL_NOTE}
    </p>
  );
}

/** Homepage top notice for pre-launch sample listings. */
export function SampleListingsHomeNotice() {
  if (!SHOW_SAMPLE_LISTINGS) return null;

  return (
    <div className="sample-listings-home-notice" role="status">
      <p className="sample-listings-home-notice-text">
        {SAMPLE_LISTING_HOME_NOTICE}
      </p>
    </div>
  );
}
