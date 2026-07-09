"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { buildCompareRows } from "@/lib/job-compare-fields";
import {
  loadCompareJobIds,
  removeCompareJobId,
  saveCompareJobIds,
} from "@/lib/compare-jobs";
import { fetchJobs } from "@/lib/job-storage";
import type { Job } from "@/types/job";

export default function ComparePage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ids = loadCompareJobIds();
    if (ids.length === 0) {
      setLoading(false);
      return;
    }

    fetchJobs()
      .then((allJobs) => {
        const byId = new Map(allJobs.map((job) => [job.id, job]));
        setJobs(ids.map((id) => byId.get(id)).filter(Boolean) as Job[]);
      })
      .finally(() => setLoading(false));
  }, []);

  function handleRemove(jobId: string) {
    const nextIds = removeCompareJobId(jobId);
    setJobs((current) => current.filter((job) => job.id !== jobId));
    if (nextIds.length === 0) saveCompareJobIds([]);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="h-64 animate-pulse rounded-2xl bg-white" />
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10">
        <div className="rounded-2xl border border-gold/25 bg-white p-6 text-center shadow-gold">
          <h1 className="font-serif text-xl font-semibold text-charcoal">店舗比較</h1>
          <p className="mt-2 text-sm text-muted">
            求人一覧や店舗詳細から「比較に追加」を押すと、最大3店舗まで比較できます。
          </p>
          <Link
            href="/jobs"
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-gradient-to-r from-gold to-gold-dark px-6 text-sm font-semibold text-white"
          >
            求人一覧へ
          </Link>
        </div>
      </div>
    );
  }

  const rows = buildCompareRows(jobs);

  return (
    <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-8">
      <h1 className="font-serif text-2xl font-semibold text-charcoal">店舗比較</h1>
      <p className="mt-1 text-sm text-muted">最大3店舗まで比較できます。</p>

      <div className="mt-5 overflow-x-auto rounded-2xl border border-gold/25 bg-white shadow-gold">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gold/20 bg-ivory">
              <th className="sticky left-0 z-10 min-w-[6rem] bg-ivory px-3 py-3 text-left font-semibold text-gold-dark">
                項目
              </th>
              {jobs.map((job) => (
                <th
                  key={job.id}
                  className="min-w-[9rem] px-3 py-3 text-left font-serif font-semibold text-charcoal"
                >
                  <div className="space-y-1">
                    <p>{job.shopName}</p>
                    <button
                      type="button"
                      onClick={() => handleRemove(job.id)}
                      className="text-[10px] font-normal text-muted underline"
                    >
                      削除
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-gold/10">
                <td className="sticky left-0 z-10 bg-white px-3 py-3 font-medium text-gold-dark">
                  {row.label}
                </td>
                {row.values.map((value, index) => (
                  <td key={`${row.label}-${index}`} className="px-3 py-3 text-charcoal">
                    {value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {jobs.map((job) => (
          <Link
            key={job.id}
            href={`/jobs/${job.id}`}
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-gold/35 px-4 text-xs font-semibold text-gold-dark"
          >
            {job.shopName}の詳細
          </Link>
        ))}
      </div>
    </div>
  );
}
