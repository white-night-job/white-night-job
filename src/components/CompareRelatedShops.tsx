"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CompareButton } from "@/components/CompareButton";
import { formatLocation, fetchJobs } from "@/lib/job-storage";
import { formatDistrictLabel } from "@/data/districts";
import { IMAGE_ALT_BRAND } from "@/lib/site";
import type { Job } from "@/types/job";

type CompareRelatedShopsProps = {
  job: Job;
};

/**
 * 同エリア・同職種の公開求人から、現在店舗以外を最大3件表示する。
 */
export function CompareRelatedShops({ job }: CompareRelatedShopsProps) {
  const [related, setRelated] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchJobs({ district: job.district, jobType: job.jobType })
      .then((jobs) => {
        if (cancelled) return;
        const next = jobs.filter((item) => item.id !== job.id).slice(0, 3);
        setRelated(next);
      })
      .catch(() => {
        if (!cancelled) setRelated([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [job.district, job.id, job.jobType]);

  if (loading) {
    return (
      <section className="mt-8 rounded-2xl border border-gold/25 bg-white p-5 shadow-gold">
        <h2 className="font-serif text-lg font-semibold text-charcoal">
          この店舗と比較されている店舗
        </h2>
        <div className="mt-3 h-28 animate-pulse rounded-xl bg-ivory" />
      </section>
    );
  }

  if (related.length === 0) return null;

  return (
    <section className="mt-8 rounded-2xl border border-gold/25 bg-white p-5 shadow-gold">
      <h2 className="font-serif text-lg font-semibold text-charcoal">
        この店舗と比較されている店舗
      </h2>
      <p className="mt-1 text-xs text-muted">
        同じ{formatDistrictLabel(job.district)}・{job.jobType}の店舗です。比較に追加して違いを確認できます。
      </p>
      <ul className="mt-4 space-y-3">
        {related.map((item) => (
          <li
            key={item.id}
            className="flex gap-3 rounded-xl border border-gold/20 bg-ivory/40 p-3"
          >
            <Link href={`/jobs/${item.id}`} className="shrink-0">
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.imageUrl}
                  alt={`${item.shopName}｜${IMAGE_ALT_BRAND}`}
                  className="h-16 w-16 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-charcoal">
                  <span className="font-serif text-[10px] text-gold-light">WN</span>
                </div>
              )}
            </Link>
            <div className="min-w-0 flex-1">
              <Link href={`/jobs/${item.id}`} className="block">
                <p className="truncate font-serif text-base font-semibold text-charcoal">
                  {item.shopName}
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  {formatLocation(item)} · {item.jobType}
                </p>
                <p className="mt-1 text-sm font-semibold text-gold-dark">
                  {item.salary}
                </p>
              </Link>
              <div className="mt-2">
                <CompareButton jobId={item.id} variant="detail" />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
