"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { JobCard } from "@/components/JobCard";
import type { Job } from "@/types/job";

export default function FavoritesPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(true);

  useEffect(() => {
    fetch("/api/favorites", { cache: "no-store", credentials: "include" })
      .then(async (response) => {
        if (response.status === 401) {
          setAuthenticated(false);
          return null;
        }
        return (await response.json()) as { jobs?: Job[] };
      })
      .then((data) => {
        if (data?.jobs) setJobs(data.jobs);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="h-56 animate-pulse rounded-2xl bg-white" />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="mx-auto max-w-md px-4 py-10">
        <div className="rounded-2xl border border-gold/25 bg-white p-6 text-center shadow-gold">
          <h1 className="font-serif text-xl font-semibold text-charcoal">
            お気に入り店舗
          </h1>
          <p className="mt-2 text-sm text-muted">
            この機能はLINEログインで利用できます。
          </p>
          <a
            href="/api/line/login?redirect=/favorites"
            className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#06c755] px-5 text-sm font-semibold text-white"
          >
            LINEでログイン
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="font-serif text-2xl font-semibold text-charcoal">
          お気に入り店舗
        </h1>
        <Link href="/jobs" className="text-sm font-medium text-gold-dark">
          求人一覧へ
        </Link>
      </div>
      {jobs.length === 0 ? (
        <div className="rounded-2xl border border-gold/20 bg-white p-6 text-sm text-muted">
          まだお気に入り登録された店舗はありません。
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}
