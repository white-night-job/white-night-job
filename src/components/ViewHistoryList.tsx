"use client";

import Link from "next/link";
import { MyPageSectionSkeleton } from "@/components/mypage/MyPageSkeletons";
import { useMyPageSection } from "@/components/mypage/useMyPageSection";
import { IMAGE_ALT_BRAND } from "@/lib/site";
import type { Job } from "@/types/job";

const DEFAULT_LIMIT = 20;

function parseHistory(raw: unknown): Job[] {
  const payload = (raw ?? {}) as { jobs?: unknown };
  return Array.isArray(payload.jobs) ? (payload.jobs as Job[]) : [];
}

export function ViewHistoryList({
  showTitle = true,
  limit = DEFAULT_LIMIT,
}: {
  showTitle?: boolean;
  limit?: number;
}) {
  const { data, status } = useMyPageSection<Job[]>({
    cacheKey: `mypage:view-history:${limit}`,
    url: `/api/view-history?limit=${limit}`,
    parse: parseHistory,
    fallback: [],
  });

  const jobs = Array.isArray(data) ? data : [];

  if (status === "loading") {
    return <MyPageSectionSkeleton height="h-32" />;
  }

  if (status === "signed-out") {
    return <p className="text-sm text-muted">閲覧履歴はLINEログイン後に表示されます。</p>;
  }

  if (status === "error") {
    return <p className="text-sm text-muted">閲覧履歴を読み込めませんでした。</p>;
  }

  if (jobs.length === 0) {
    return <p className="text-sm text-muted">まだ閲覧した店舗はありません。</p>;
  }

  return (
    <div className="space-y-3">
      {showTitle && (
        <h2 className="font-serif text-lg font-semibold text-charcoal">
          最近見た店舗
        </h2>
      )}
      {jobs.map((job) => (
        <article
          key={job.id}
          className="flex gap-3 rounded-2xl border border-gold/20 bg-white p-3 shadow-gold"
        >
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-charcoal to-gold-dark">
            {job.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={job.imageUrl} alt={`${job.shopName}｜${IMAGE_ALT_BRAND}`} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-[10px] text-gold-light">
                WN
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-serif font-semibold text-charcoal">
              {job.shopName}
            </p>
            <p className="mt-0.5 text-xs text-muted">
              {job.district} · {job.salary}
            </p>
            <Link
              href={`/jobs/${job.id}`}
              className="mt-2 inline-flex min-h-9 items-center justify-center rounded-full bg-gradient-to-r from-gold to-gold-dark px-4 text-xs font-semibold text-white"
            >
              もう一度見る
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
