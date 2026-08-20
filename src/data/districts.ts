import type { District } from "@/types/job";

/** Canonical district values stored in DB / query params (do not rename). */
export const DISTRICTS: District[] = ["すすきの", "琴似", "24条", "手稲"];

/**
 * User-facing district label.
 * Keep DB / URL / filter values as-is; only change what people read.
 */
export function formatDistrictLabel(
  district: string | null | undefined,
): string {
  if (!district) return "";
  if (district === "24条") return "北24条";
  return district;
}
