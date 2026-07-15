import { jobDistrictToNotificationArea } from "@/lib/notification-areas";
import { JOB_TYPES, type Job, type JobType } from "@/types/job";

export const MIN_HOURLY_WAGE_OPTIONS = [2500, 3000, 3500, 4000] as const;

export type MinHourlyWageOption = (typeof MIN_HOURLY_WAGE_OPTIONS)[number] | 0;

export const NOTIFICATION_JOB_TYPE_OPTIONS: {
  value: JobType;
  label: string;
}[] = JOB_TYPES.map((value) => ({
  value,
  label: value === "ニュークラ" ? "ニュークラブ" : value,
}));

export function parseHourlySalary(salary: string): number | null {
  if (/日給|月給|年収/.test(salary)) return null;
  const match = salary.replace(/,/g, "").match(/\d+/);
  return match ? Number(match[0]) : null;
}

export function isJobType(value: string): value is JobType {
  return (JOB_TYPES as readonly string[]).includes(value);
}

export type UserNotifyPrefs = {
  userId: string;
  lineUserId: string;
  notifyNewJobs: boolean;
  notifyPickupJobs: boolean;
  notifyFavoriteUpdates: boolean;
  areas: string[];
  jobTypes: string[];
  minHourlyWage: number;
};

export function jobMatchesNotifyPrefs(job: Job, prefs: UserNotifyPrefs): boolean {
  if (prefs.areas.length > 0) {
    const area = jobDistrictToNotificationArea(job.district);
    if (!prefs.areas.includes(area)) return false;
  }

  if (prefs.jobTypes.length > 0 && !prefs.jobTypes.includes(job.jobType)) {
    return false;
  }

  if (prefs.minHourlyWage > 0) {
    const hourly = parseHourlySalary(job.salary);
    if (hourly === null || hourly < prefs.minHourlyWage) return false;
  }

  return true;
}
