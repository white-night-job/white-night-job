"use client";

import { useEffect, useMemo, useState } from "react";
import { JobCard } from "@/components/JobCard";
import { emptyJobFilters } from "@/lib/job-filters";
import { fetchJobs } from "@/lib/job-storage";
import { dedupeJobsByShop, formatPreferredAreaList } from "@/lib/preferred-areas";
import { usePreferredAreas } from "@/lib/preferred-areas-client";
import { SALES_STYLE_PROFILES, type SalesStyleType } from "@/lib/sales-style-diagnosis";
import type { Job } from "@/types/job";

export function SalesStyleRecommendedJobs({
  type,
  sectionId,
}: {
  type: SalesStyleType;
  sectionId: string;
}) {
  const profile = SALES_STYLE_PROFILES[type];
  const { areas, configured, ready: areasReady } = usePreferredAreas();
  const filters = useMemo(
    () => ({
      ...emptyJobFilters(),
      jobTypes: profile.jobTypes.map((jobType) => jobType.value),
      districts: configured ? [...areas] : [],
    }),
    [profile, configured, areas],
  );
  const [jobs, setJobs] = useState<Job[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    if (!areasReady) return;
    let cancelled = false;
    setStatus("loading");
    // API の並び（既存ランキング・プラン順位）を維持する
    fetchJobs(filters)
      .then((items) => {
        if (cancelled) return;
        setJobs(dedupeJobsByShop(items));
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [filters, areasReady]);

  const jobTypeLabel = profile.jobTypes.map((jobType) => jobType.label).join("・");

  return (
    <section
      id={sectionId}
      className="sales-style-shops-section"
      aria-labelledby={`${sectionId}-heading`}
    >
      <h3 id={`${sectionId}-heading`} className="job-diagnosis-section-title font-serif">
        あなたに合う店舗
      </h3>
      <p className="job-diagnosis-section-lead">
        {configured
          ? `希望エリア（${formatPreferredAreaList(areas)}）にある、相性の良い職種（${jobTypeLabel}）の掲載中求人です。`
          : `相性の良い職種（${jobTypeLabel}）の掲載中求人です。`}
      </p>

      <div className="sales-style-shops-list">
        {status === "loading" ? (
          <p className="job-diagnosis-shops-loading">おすすめ店舗を読み込み中...</p>
        ) : status === "error" ? (
          <div className="job-diagnosis-shops-empty">
            <p>求人を読み込めませんでした。時間をおいて再度お試しください。</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="job-diagnosis-shops-empty">
            <p>現在、条件に合う求人を準備中です。</p>
          </div>
        ) : (
          <div className="jobs-list-grid grid grid-cols-1 gap-4 sm:grid-cols-2">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
