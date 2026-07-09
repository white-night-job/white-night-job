"use client";

import Link from "next/link";
import { useState } from "react";
import type { Job } from "@/types/job";

type MyPageFavoriteCardProps = {
  job: Job;
  onRemoved: (jobId: string) => void;
};

export function MyPageFavoriteCard({ job, onRemoved }: MyPageFavoriteCardProps) {
  const [removing, setRemoving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleRemove() {
    setErrorMessage(null);
    setRemoving(true);
    try {
      const response = await fetch(
        `/api/favorites?jobId=${encodeURIComponent(job.id)}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        console.error("[MyPageFavoriteCard] unfavorite failed:", {
          status: response.status,
          body,
          jobId: job.id,
        });
        setErrorMessage("お気に入り解除に失敗しました");
        return;
      }
      onRemoved(job.id);
    } catch (error) {
      console.error("[MyPageFavoriteCard] unfavorite failed:", error);
      setErrorMessage("お気に入り解除に失敗しました");
    } finally {
      setRemoving(false);
    }
  }

  return (
    <article className="rounded-2xl border border-gold/25 bg-white p-4 shadow-gold">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-serif text-base font-semibold text-charcoal sm:text-lg">
            {job.shopName}
          </h3>
          <dl className="mt-3 space-y-1.5 text-sm text-muted">
            <div className="flex gap-2">
              <dt className="shrink-0 text-gold-dark">エリア</dt>
              <dd>{job.district}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="shrink-0 text-gold-dark">職種</dt>
              <dd>{job.jobType}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="shrink-0 text-gold-dark">時給</dt>
              <dd className="font-medium text-charcoal">{job.salary}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Link
          href={`/jobs/${job.id}`}
          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-gradient-to-r from-gold to-gold-dark px-4 text-sm font-semibold text-white"
        >
          詳細を見る
        </Link>
        <button
          type="button"
          onClick={handleRemove}
          disabled={removing}
          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-gold/40 bg-white px-4 text-sm font-semibold text-gold-dark disabled:opacity-60"
        >
          {removing ? "解除中..." : "お気に入り解除"}
        </button>
      </div>
      {errorMessage && (
        <p className="mt-2 text-xs text-red-600">{errorMessage}</p>
      )}
    </article>
  );
}
