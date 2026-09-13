import { formatDistrictLabel } from "@/data/districts";
import type { JobFilters } from "@/types/job";

/** Normalize Next.js searchParam values to a string array. */
export function toParamArray(
  value: string | string[] | undefined | null,
): string[] {
  if (!value) return [];
  return (Array.isArray(value) ? value : [value])
    .map((item) => String(item).trim())
    .filter((item) => item.length > 0 && item !== "all");
}

export function emptyJobFilters(): JobFilters {
  return {
    districts: [],
    jobTypes: [],
    query: null,
    minSalary: null,
    benefits: [],
  };
}

export function parseJobFiltersFromParams(params: {
  district?: string | string[];
  jobType?: string | string[];
  q?: string;
  minSalary?: string;
  benefit?: string | string[];
}): JobFilters {
  return {
    districts: toParamArray(params.district),
    jobTypes: toParamArray(params.jobType),
    query: params.q?.trim() || null,
    minSalary: params.minSalary?.trim() || null,
    benefits: toParamArray(params.benefit),
  };
}

export function appendJobFilterParams(
  params: URLSearchParams,
  filters: JobFilters,
): void {
  filters.districts.forEach((district) => params.append("district", district));
  filters.jobTypes.forEach((jobType) => params.append("jobType", jobType));
  if (filters.query) params.set("q", filters.query);
  if (filters.minSalary) params.set("minSalary", filters.minSalary);
  filters.benefits?.forEach((benefit) => params.append("benefit", benefit));
}

export function formatDistrictSelectionLabel(districts: string[]): string {
  if (districts.length === 0) return "すべて";
  return districts.map((d) => formatDistrictLabel(d)).join("・");
}

export function formatJobTypeSelectionLabel(jobTypes: string[]): string {
  if (jobTypes.length === 0) return "すべて";
  return jobTypes.join("・");
}

export function toggleMultiSelectValue(
  current: string[],
  value: string,
): string[] {
  if (value === "all") return [];
  if (current.includes(value)) {
    return current.filter((item) => item !== value);
  }
  return [...current, value];
}
