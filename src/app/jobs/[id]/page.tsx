"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { JobDetailView } from "@/components/JobDetailView";
import { recordJobView } from "@/lib/job-view-storage";
import { recordUserViewHistory } from "@/lib/view-history-client";
import { fetchJobById, JOBS_UPDATED_EVENT } from "@/lib/job-storage";
import type { Job } from "@/types/job";

export default function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [job, setJob] = useState<Job | null | undefined>(undefined);

  useEffect(() => {
    const load = () => {
      fetchJobById(id)
        .then(setJob)
        .catch(() => setJob(null));
    };
    load();
    window.addEventListener(JOBS_UPDATED_EVENT, load);
    return () => window.removeEventListener(JOBS_UPDATED_EVENT, load);
  }, [id]);

  useEffect(() => {
    // job_views + job_detail_click（一覧 impression とは別）
    void recordJobView(id);
    void recordUserViewHistory(id);
  }, [id]);

  if (job === undefined) {
    return (
      <div className="mx-auto max-w-3xl p-8">
        <div className="h-64 animate-pulse rounded-2xl bg-white" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">求人が見つかりません</h1>
        <Link href="/" className="mt-6 inline-block text-gold-dark">
          ← 求人一覧へ
        </Link>
      </div>
    );
  }

  return <JobDetailView job={job} />;
}
