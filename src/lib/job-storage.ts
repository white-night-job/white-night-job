import type { Job, JobFilters } from "@/types/job";

export const JOBS_UPDATED_EVENT = "jobs-updated";

type ListingKind = "new" | "pickup" | "new-open";

/** In-memory listing cache so back-navigation remounts keep page height (scroll). */
const listingJobsCache = new Map<ListingKind, Job[]>();

/** Short client cache for detail warm-start / prefetch from cards. */
const jobByIdCache = new Map<string, { job: Job; savedAt: number }>();
const JOB_BY_ID_TTL_MS = 60_000;
const jobByIdInflight = new Map<string, Promise<Job | null>>();

function buildJobQuery(filters?: JobFilters): string {
  const params = new URLSearchParams();
  if (filters?.district) params.set("district", filters.district);
  if (filters?.jobType) params.set("jobType", filters.jobType);
  if (filters?.query) params.set("q", filters.query);
  if (filters?.minSalary) params.set("minSalary", filters.minSalary);
  filters?.benefits?.forEach((benefit) => params.append("benefit", benefit));
  const query = params.toString();
  return query ? `?${query}` : "";
}

async function readJson<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & { message?: string };
  if (!response.ok) {
    throw new Error(data.message ?? "通信に失敗しました。");
  }
  return data;
}

function seedJobByIdCache(jobs: Job[]) {
  const now = Date.now();
  for (const job of jobs) {
    jobByIdCache.set(job.id, { job, savedAt: now });
  }
}

export function cacheJobById(job: Job) {
  jobByIdCache.set(job.id, { job, savedAt: Date.now() });
}

export function getCachedJobById(id: string): Job | null {
  const entry = jobByIdCache.get(id);
  if (!entry) return null;
  if (Date.now() - entry.savedAt > JOB_BY_ID_TTL_MS) {
    jobByIdCache.delete(id);
    return null;
  }
  return entry.job;
}

export async function fetchJobs(filters?: JobFilters): Promise<Job[]> {
  const data = await readJson<{ jobs: Job[] }>(
    await fetch(`/api/jobs${buildJobQuery(filters)}`, { cache: "no-store" }),
  );
  seedJobByIdCache(data.jobs);
  return data.jobs;
}

export function getCachedListingJobs(kind: ListingKind): Job[] | null {
  return listingJobsCache.get(kind) ?? null;
}

export async function fetchListingJobs(kind: ListingKind): Promise<Job[]> {
  const data = await readJson<{ jobs: Job[] }>(
    await fetch(`/api/jobs?listing=${kind}`, { cache: "no-store" }),
  );
  listingJobsCache.set(kind, data.jobs);
  seedJobByIdCache(data.jobs);
  return data.jobs;
}

export async function fetchJobById(id: string): Promise<Job | null> {
  const cached = getCachedJobById(id);
  if (cached) return cached;

  const existing = jobByIdInflight.get(id);
  if (existing) return existing;

  const request = (async () => {
    const response = await fetch(`/api/jobs/${id}`, {
      // Allow short browser/CDN cache; server also sends Cache-Control.
      next: { revalidate: 60 },
    });
    if (response.status === 404) return null;
    const data = await readJson<{ job: Job }>(response);
    cacheJobById(data.job);
    return data.job;
  })().finally(() => {
    jobByIdInflight.delete(id);
  });

  jobByIdInflight.set(id, request);
  return request;
}

/** Warm detail API from listing cards (viewport / hover). */
export function prefetchJobDetail(id: string) {
  if (!id || typeof window === "undefined") return;
  if (getCachedJobById(id)) return;
  void fetchJobById(id).catch(() => {
    /* ignore warm failures */
  });
}

export function formatLocation(job: Job): string {
  return `${job.area} / ${job.district}`;
}
