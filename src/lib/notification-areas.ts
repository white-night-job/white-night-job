import { DISTRICTS } from "@/data/districts";
import type { District } from "@/types/job";

export const NOTIFICATION_AREA_OPTIONS = [
  "すすきの",
  "琴似",
  "24条",
  "手稲",
  "その他",
] as const;

export type NotificationArea = (typeof NOTIFICATION_AREA_OPTIONS)[number];

export function isNotificationArea(value: string): value is NotificationArea {
  return (NOTIFICATION_AREA_OPTIONS as readonly string[]).includes(value);
}

export function jobDistrictToNotificationArea(district: District): NotificationArea {
  return district;
}

export function jobMatchesBroadcastArea(
  district: District,
  broadcastArea: NotificationArea,
): boolean {
  if (broadcastArea === "その他") {
    return !(DISTRICTS as readonly string[]).includes(district);
  }
  return district === broadcastArea;
}

export function filterJobsByBroadcastAreas<T extends { district: District }>(
  jobs: T[],
  areas: NotificationArea[],
): T[] {
  if (areas.length === 0) return jobs;
  return jobs.filter((job) =>
    areas.some((area) => jobMatchesBroadcastArea(job.district, area)),
  );
}
