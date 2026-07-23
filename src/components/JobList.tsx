"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchJobs, JOBS_UPDATED_EVENT } from "@/lib/job-storage";
import type { Job, JobFilters } from "@/types/job";
import { JobCard } from "./JobCard";

const jobsListCache = new Map<string, Job[]>();

function filtersCacheKey(filters: JobFilters): string {
  return JSON.stringify({
    district: filters.district ?? null,
    jobType: filters.jobType ?? null,
    query: filters.query ?? null,
    minSalary: filters.minSalary ?? null,
    benefits: filters.benefits ?? [],
  });
}

export function JobList({ filters }: { filters: JobFilters }) {
  const cacheKey = useMemo(() => filtersCacheKey(filters), [filters]);
  const cached = jobsListCache.get(cacheKey);
  const [jobs, setJobs] = useState<Job[]>(() => cached ?? []);
  const [ready, setReady] = useState(() => cached != null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    fetchJobs(filters)
      .then((items) => {
        jobsListCache.set(cacheKey, items);
        setJobs(items);
        setError("");
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "求人を取得できませんでした。");
      })
      .finally(() => setReady(true));
  }, [cacheKey, filters]);

  useEffect(() => {
    // Keep cached cards on remount (browser back) so scroll height stays stable.
    load();
    const onUpdate = () => load();
    window.addEventListener(JOBS_UPDATED_EVENT, onUpdate);
    return () => window.removeEventListener(JOBS_UPDATED_EVENT, onUpdate);
  }, [load]);

  if (!ready) {
    return (
      <div className="jobs-list-grid grid gap-4 sm:grid-cols-2">
        {[1, 2].map((i) => (
          <div key={i} className="h-40 animate-pulse rounded-2xl border border-gold/20 bg-white" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-white py-12 text-center">
        <p className="text-red-600">{error}</p>
        <p className="mt-1 text-sm text-muted">Supabaseの環境変数とテーブル設定を確認してください。</p>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="rounded-2xl border border-gold/20 bg-white py-12 text-center">
        <p className="text-muted">該当する求人がありません。</p>
        <p className="mt-1 text-sm text-muted">地区・職種の条件を変えてお試しください。</p>
      </div>
    );
  }

  return (
    <div className="jobs-list-grid grid gap-4 sm:grid-cols-2">
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  );
}
