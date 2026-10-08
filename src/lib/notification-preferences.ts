import { jobDistrictToNotificationArea } from "@/lib/notification-areas";
import type { Job } from "@/types/job";

export function parseHourlySalary(salary: string): number | null {
  if (/日給|月給|年収/.test(salary)) return null;
  const match = salary.replace(/,/g, "").match(/\d+/);
  return match ? Number(match[0]) : null;
}

export type UserNotifyPrefs = {
  userId: string;
  lineUserId: string;
  notifyNewJobs: boolean;
  notifyPickupJobs: boolean;
  notifyFavoriteUpdates: boolean;
  /** マイページの希望エリア。空の場合は全エリアが対象 */
  areas: string[];
};

export function jobMatchesNotifyPrefs(job: Job, prefs: UserNotifyPrefs): boolean {
  if (prefs.areas.length > 0) {
    const area = jobDistrictToNotificationArea(job.district);
    if (!prefs.areas.includes(area)) return false;
  }
  return true;
}
