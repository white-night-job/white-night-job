import type { JobFilters } from "@/types/job";

export type SavedSearchFilters = Pick<
  JobFilters,
  "district" | "jobType" | "minSalary" | "benefits"
> & {
  savedAt: string;
};

const STORAGE_KEY = "white-night-search-history";

export function saveSearchHistory(filters: JobFilters): void {
  if (typeof window === "undefined") return;

  const hasCriteria =
    Boolean(filters.district) ||
    Boolean(filters.jobType) ||
    Boolean(filters.minSalary) ||
    (filters.benefits?.length ?? 0) > 0;

  if (!hasCriteria) return;

  const entry: SavedSearchFilters = {
    district: filters.district ?? null,
    jobType: filters.jobType ?? null,
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
    return JSON.parse(raw) as SavedSearchFilters;
  } catch (error) {
    console.error("[search-history] load failed:", error);
    return null;
  }
}

export function buildJobsSearchUrl(filters: SavedSearchFilters): string {
  const params = new URLSearchParams();
  if (filters.district) params.set("district", filters.district);
  if (filters.jobType) params.set("jobType", filters.jobType);
  if (filters.minSalary) params.set("minSalary", filters.minSalary);
  filters.benefits?.forEach((benefit) => params.append("benefit", benefit));
  const query = params.toString();
  return query ? `/jobs?${query}#jobs-section` : "/jobs#jobs-section";
}

const SALARY_LABELS: Record<string, string> = {
  "1500": "1,500円以上",
  "2000": "2,000円以上",
  "2500": "2,500円以上",
  "3000": "3,000円以上",
  "3500": "3,500円以上",
  "4000": "4,000円以上",
  "5000": "5,000円以上",
};

export function describeSearchHistory(filters: SavedSearchFilters): string[] {
  const lines: string[] = [];
  if (filters.district) lines.push(`エリア: ${filters.district}`);
  if (filters.jobType) lines.push(`職種: ${filters.jobType}`);
  if (filters.minSalary) {
    lines.push(`時給: ${SALARY_LABELS[filters.minSalary] ?? `${filters.minSalary}円以上`}`);
  }
  if (filters.benefits?.length) {
    lines.push(`待遇: ${filters.benefits.join("、")}`);
  }
  return lines;
}
