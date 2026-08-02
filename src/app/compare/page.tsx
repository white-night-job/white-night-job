"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useCompare } from "@/components/CompareProvider";
import {
  buildCompareRows,
  type CompareBoolTone,
  type CompareCell,
} from "@/lib/job-compare-fields";
import {
  COMPARE_MAX,
  loadCompareJobIds,
  removeCompareJobId,
} from "@/lib/compare-jobs";
import { fetchJobs } from "@/lib/job-storage";
import { IMAGE_ALT_BRAND } from "@/lib/site";
import type { Job } from "@/types/job";

function toneClass(tone: CompareBoolTone | undefined): string {
  if (tone === "good") return "text-[#047a3b]";
  if (tone === "bad") return "text-red-700";
  return "text-muted";
}

function CompareCellView({ cell }: { cell: CompareCell }) {
  if (cell.type === "image") {
    return cell.src ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={cell.src}
        alt={`${cell.alt}｜${IMAGE_ALT_BRAND}`}
        className="h-20 w-full rounded-xl object-cover ring-1 ring-gold/25 sm:h-24"
      />
    ) : (
      <div className="flex h-20 w-full items-center justify-center rounded-xl bg-gradient-to-br from-charcoal to-gold-dark sm:h-24">
        <span className="font-serif text-[10px] tracking-[0.2em] text-gold-light">
          WN
        </span>
      </div>
    );
  }

  if (cell.type === "bool") {
    if (cell.present === null) {
      return <span className="text-sm text-muted">—</span>;
    }
    const label = cell.present
      ? (cell.yesLabel ?? "○")
      : (cell.noLabel ?? "×");
    const tone = cell.present ? cell.toneWhenYes : cell.toneWhenNo;
    return (
      <span className={`text-sm font-semibold ${toneClass(tone)}`}>{label}</span>
    );
  }

  if (cell.type === "line") {
    if (!cell.lineUrl) {
      return <span className="text-xs text-muted">未設定</span>;
    }
    return (
      <a
        href={cell.lineUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-9 items-center justify-center rounded-full bg-[#06c755] px-3 text-[11px] font-semibold text-white"
      >
        LINE応募
      </a>
    );
  }

  return <span className="text-sm leading-relaxed text-charcoal">{cell.text}</span>;
}

export default function ComparePage() {
  const { jobIds, setCompareIds } = useCompare();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ids = jobIds.length > 0 ? jobIds : loadCompareJobIds();
    if (ids.length === 0) {
      setJobs([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    fetchJobs()
      .then((allJobs) => {
        if (cancelled) return;
        const byId = new Map(allJobs.map((job) => [job.id, job]));
        const ordered = ids
          .map((id) => byId.get(id))
          .filter((job): job is Job => Boolean(job));
        setJobs(ordered);
        // 公開終了などで消えたIDを掃除
        if (ordered.length !== ids.length) {
          setCompareIds(ordered.map((job) => job.id));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [jobIds, setCompareIds]);

  const rows = useMemo(() => buildCompareRows(jobs), [jobs]);

  function handleRemove(jobId: string) {
    removeCompareJobId(jobId);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="h-64 animate-pulse rounded-2xl border border-gold/20 bg-white" />
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10">
        <div className="rounded-2xl border border-gold/25 bg-white p-6 text-center shadow-gold">
          <h1 className="font-serif text-xl font-semibold text-charcoal">店舗比較</h1>
          <p className="mt-2 text-sm text-muted">
            求人一覧や店舗詳細から「比較する」を押すと、最大{COMPARE_MAX}
            店舗まで比較できます。
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

  return (
    <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-8">
      <h1 className="font-serif text-2xl font-semibold text-charcoal">店舗比較</h1>
      <p className="mt-1 text-sm text-muted">
        {jobs.length}/{COMPARE_MAX}店舗を比較中。○×と色分けで違いを確認できます。
      </p>

      <div className="mt-5 overflow-x-auto rounded-2xl border border-gold/25 bg-white shadow-gold">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gold/20 bg-gradient-to-r from-ivory to-champagne/40">
              <th className="sticky left-0 z-10 min-w-[5.5rem] bg-ivory px-3 py-3 text-left text-xs font-semibold text-gold-dark">
                項目
              </th>
              {jobs.map((job) => (
                <th
                  key={job.id}
                  className="min-w-[8.5rem] max-w-[10rem] px-3 py-3 text-left font-serif text-sm font-semibold text-charcoal"
                >
                  <div className="space-y-1">
                    <p className="line-clamp-2">{job.shopName}</p>
                    <button
                      type="button"
                      onClick={() => handleRemove(job.id)}
                      className="text-[10px] font-normal text-muted underline"
                    >
                      外す
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-gold/10 align-top">
                <td className="sticky left-0 z-10 bg-white px-3 py-3 text-xs font-semibold text-gold-dark">
                  {row.label}
                </td>
                {row.cells.map((cell, index) => (
                  <td key={`${row.label}-${index}`} className="px-3 py-3">
                    <CompareCellView cell={cell} />
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
