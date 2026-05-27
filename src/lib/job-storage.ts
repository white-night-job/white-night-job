import type { Job, JobFilters } from "@/types/job";

export const JOBS_UPDATED_EVENT = "jobs-updated";

function buildJobQuery(filters?: JobFilters): string {
  const params = new URLSearchParams();
  if (filters?.district) params.set("district", filters.district);
  if (filters?.jobType) params.set("jobType", filters.jobType);
  if (filters?.query) params.set("q", filters.query);
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

export async function fetchJobs(filters?: JobFilters): Promise<Job[]> {
  const data = await readJson<{ jobs: Job[] }>(
    await fetch(`/api/jobs${buildJobQuery(filters)}`, { cache: "no-store" }),
  );
  return data.jobs;
}

export async function fetchJobById(id: string): Promise<Job | null> {
  const response = await fetch(`/api/jobs/${id}`, { cache: "no-store" });
  if (response.status === 404) return null;
  const data = await readJson<{ job: Job }>(response);
  return data.job;
}

export function formatLocation(job: Job): string {
  return `${job.area} / ${job.district}`;
}
