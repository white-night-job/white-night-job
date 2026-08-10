"use client";

import { JobDetailView } from "@/components/JobDetailView";
import type { GirlReview } from "@/types/girl-review";
import type { Job } from "@/types/job";

type JobListingPreviewProps = {
  job: Job;
  mode: "create" | "edit";
  /** publish = 公開前確認 / draft = 下書きプレビュー（公開しない） */
  variant?: "publish" | "draft";
  submitting?: boolean;
  girlReviews?: GirlReview[];
  onBack: () => void;
  onConfirm?: () => void;
};

export function JobListingPreview({
  job,
  mode,
  variant = "publish",
  submitting = false,
  girlReviews = [],
  onBack,
  onConfirm,
}: JobListingPreviewProps) {
  const isDraftPreview = variant === "draft";
  const confirmLabel =
    mode === "create" ? "この内容で掲載する" : "この内容で更新する";

  return (
    <div className="min-h-screen bg-[#f7f4ee] pb-28">
      <div className="sticky top-0 z-40 border-b border-gold/30 bg-charcoal/95 px-4 py-3 text-center text-white backdrop-blur">
        <p className="text-xs font-medium tracking-wide text-gold-light">
          {isDraftPreview ? "下書きプレビュー" : "掲載前プレビュー"}
        </p>
        <p className="mt-0.5 text-sm text-white/85">
          {isDraftPreview
            ? "一般ユーザーには非公開です。公開時と同じ見た目で確認できます（操作は無効）"
            : "一般ユーザーに表示される求人詳細と同じ見た目です（操作は無効）"}
        </p>
      </div>

      <JobDetailView
        job={job}
        preview
        showBreadcrumbs={false}
        girlReviews={girlReviews}
      />

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gold/30 bg-white/95 px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur">
        <div className="mx-auto flex max-w-3xl flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onBack}
            disabled={submitting}
            className="rounded-full border border-gold/40 px-5 py-3 text-sm font-semibold text-charcoal hover:bg-ivory disabled:opacity-60"
          >
            {isDraftPreview ? "編集に戻る" : "修正する"}
          </button>
          {!isDraftPreview && onConfirm ? (
            <button
              type="button"
              onClick={onConfirm}
              disabled={submitting}
              className="rounded-full bg-gradient-to-r from-gold to-gold-dark px-5 py-3 text-sm font-semibold text-white shadow-gold disabled:opacity-60"
            >
              {submitting ? "公開中..." : confirmLabel}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
