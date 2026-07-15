export const LISTING_PRIORITIES = ["normal", "priority", "top"] as const;

export type ListingPriority = (typeof LISTING_PRIORITIES)[number];

export const LISTING_PRIORITY_LABELS: Record<ListingPriority, string> = {
  normal: "通常",
  priority: "優先",
  top: "最優先",
};

export function isListingPriority(value: unknown): value is ListingPriority {
  return (
    typeof value === "string" &&
    (LISTING_PRIORITIES as readonly string[]).includes(value)
  );
}

export function parseListingPriority(value: unknown): ListingPriority {
  if (isListingPriority(value)) return value;
  return "normal";
}

export function listingPriorityRank(value: ListingPriority): number {
  switch (value) {
    case "top":
      return 3;
    case "priority":
      return 2;
    default:
      return 1;
  }
}

export function parseListingPriorityFromBody(
  body: Record<string, unknown>,
): { listing_priority?: ListingPriority } {
  const raw = body.listing_priority ?? body.listingPriority;
  if (raw === undefined) return {};
  return { listing_priority: parseListingPriority(raw) };
}

export function listingPriorityToRow(parsed: {
  listing_priority?: ListingPriority;
}): { listing_priority?: ListingPriority } {
  if (parsed.listing_priority === undefined) return {};
  return { listing_priority: parsed.listing_priority };
}
