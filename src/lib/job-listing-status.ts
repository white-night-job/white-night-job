export const JOB_LISTING_STATUSES = ["draft", "published", "paused"] as const;

export type JobListingStatus = (typeof JOB_LISTING_STATUSES)[number];

export const JOB_LISTING_STATUS_LABELS: Record<JobListingStatus, string> = {
  draft: "下書き",
  published: "公開中",
  paused: "掲載停止",
};

export function isJobListingStatus(value: unknown): value is JobListingStatus {
  return (
    typeof value === "string" &&
    (JOB_LISTING_STATUSES as readonly string[]).includes(value)
  );
}

export function parseJobListingStatus(value: unknown): JobListingStatus | null {
  if (isJobListingStatus(value)) return value;
  return null;
}

/** Resolve status from new column and/or legacy published boolean. */
export function resolveJobListingStatus(input: {
  listing_status?: unknown;
  listingStatus?: unknown;
  published?: unknown;
}): JobListingStatus {
  const fromColumn = parseJobListingStatus(
    input.listing_status ?? input.listingStatus,
  );
  if (fromColumn) return fromColumn;
  if (input.published === true) return "published";
  if (input.published === false) return "draft";
  return "draft";
}

export function listingStatusToPublished(status: JobListingStatus): boolean {
  return status === "published";
}

export function listingStatusToRow(status: JobListingStatus): {
  listing_status: JobListingStatus;
  published: boolean;
} {
  return {
    listing_status: status,
    published: listingStatusToPublished(status),
  };
}
