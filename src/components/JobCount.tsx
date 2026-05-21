"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchJobs, JOBS_UPDATED_EVENT } from "@/lib/job-storage";
import type { JobFilters } from "@/types/job";

export function JobCount({ filters }: { filters: JobFilters }) {
  const [count, setCount] = useState(0);

  const load = useCallback(() => {
    fetchJobs(filters)
      .then((jobs) => setCount(jobs.length))
      .catch(() => setCount(0));
  }, [filters]);

  useEffect(() => {
    load();
    const onUpdate = () => load();
    window.addEventListener(JOBS_UPDATED_EVENT, onUpdate);
    return () => window.removeEventListener(JOBS_UPDATED_EVENT, onUpdate);
  }, [load]);

  return <>{count}件</>;
}
