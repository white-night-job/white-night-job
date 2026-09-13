import type { JobFilters } from "@/types/job";
import {
  appendJobFilterParams,
  formatDistrictSelectionLabel,
  formatJobTypeSelectionLabel,
  toParamArray,
} from "@/lib/job-filters";

export type SavedSearchFilters = Pick<
  JobFilters,
  "districts" | "jobTypes" | "minSalary" | "benefits"
> & {
  savedAt: string;
};

const STORAGE_KEY = "white-night-search-history";

function normalizeSavedFilters(raw: unknown): SavedSearchFilters | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;

  const districts = Array.isArray(data.districts)
    ? toParamArray(data.districts as string[])
    : toParamArray(
        typeof data.district === "string" ? data.district : null,
      );
  const jobTypes = Array.isArray(data.jobTypes)
    ? toParamArray(data.jobTypes as string[])
    : toParamArray(typeof data.jobType === "string" ? data.jobType : null);

  return {
    districts,
    jobTypes,
    minSalary:
      typeof data.minSalary === "string" && data.minSalary.trim()
        ? data.minSalary
        : null,
    benefits: Array.isArray(data.benefits)
      ? toParamArray(data.benefits as string[])
      : [],
    savedAt:
      typeof data.savedAt === "string" ? data.savedAt : new Date().toISOString(),
  };
}

export function saveSearchHistory(filters: JobFilters): void {
  if (typeof window === "undefined") return;

  const hasCriteria =
    filters.districts.length > 0 ||
    filters.jobTypes.length > 0 ||
    Boolean(filters.minSalary) ||
    (filters.benefits?.length ?? 0) > 0;

  if (!hasCriteria) return;

  const entry: SavedSearchFilters = {
    districts: filters.districts,
    jobTypes: filters.jobTypes,
    minSalary: filters.minSalary ?? null,
    benefits: filters.benefits ?? [],
    savedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
  } catch (error) {
    console.error("[search-history] save failed:", error);
  }
}

export function loadSearchHistory(): SavedSearchFilters | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return normalizeSavedFilters(JSON.parse(raw));
  } catch (error) {
    console.error("[search-history] load failed:", error);
    return null;
  }
}

export function buildJobsSearchUrl(filters: SavedSearchFilters): string {
  const params = new URLSearchParams();
  appendJobFilterParams(params, {
    districts: filters.districts,
    jobTypes: filters.jobTypes,
    minSalary: filters.minSalary,
    benefits: filters.benefits,
  });
  const query = params.toString();
  return query ? `/jobs?${query}#jobs-section` : "/jobs#jobs-section";
}

const SALARY_LABELS: Record<string, string> = {
  "1500": "1,500円以上",
  "2000": "2,000円以上",
};

export function describeSearchHistory(filters: SavedSearchFilters): string[] {
  const lines: string[] = [];
  if (filters.districts.length > 0) {
    lines.push(`エリア: ${formatDistrictSelectionLabel(filters.districts)}`);
  }
  if (filters.jobTypes.length > 0) {
    lines.push(`職種: ${formatJobTypeSelectionLabel(filters.jobTypes)}`);
  }
  if (filters.minSalary) {
    lines.push(
      `時給: ${SALARY_LABELS[filters.minSalary] ?? `${filters.minSalary}円以上`}`,
    );
  }
  if (filters.benefits?.length) {
    lines.push(`待遇: ${filters.benefits.join("、")}`);
  }
  return lines;
}
