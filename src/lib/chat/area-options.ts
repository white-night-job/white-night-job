import { DISTRICTS } from "@/data/districts";

export const CHAT_AREA_ALL = "札幌全域" as const;

export const CHAT_AREA_OPTIONS = [...DISTRICTS, CHAT_AREA_ALL] as const;

export type ChatAreaOption = (typeof CHAT_AREA_OPTIONS)[number];

export function jobMatchesSelectedAreas(
  district: string,
  selectedAreas: string[],
): boolean {
  if (selectedAreas.length === 0) return false;
  if (selectedAreas.includes(CHAT_AREA_ALL)) return true;
  return selectedAreas.includes(district);
}
