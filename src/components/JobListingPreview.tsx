"use client";

import { JobDetailView } from "@/components/JobDetailView";
import type { Job } from "@/types/job";

type JobListingPreviewProps = {
  job: Job;
  mode: "create" | "edit";
  submitting?: boolean;
  onBack: () => void;
  onConfirm: () => void;
};

export function JobListingPreview({
  job,
  mode,
  submitting = false,
  onBack,
  onConfirm,
}: JobListingPreviewProps) {
  const confirmLabel =
    mode === "create" ? "この内容で掲載する" : "この内容で更新する";

  return (
    <div className="min-h-screen bg-[#f7f4ee] pb-28">
      <div className="sticky top-0 z-40 border-b border-gold/30 bg-charcoal/95 px-4 py-3 text-center text-white backdrop-blur">
        <p className="text-xs font-medium tracking-wide text-gold-light">
          掲載前プレビュー
        </p>
        <p className="mt-0.5 text-sm text-white/85">
          一般ユーザーに表示される求人詳細と同じ見た目です（操作は無効）
        </p>
      </div>

      <JobDetailView job={job} preview showBreadcrumbs={false} />

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gold/30 bg-white/95 px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur">
        <div className="mx-auto flex max-w-3xl flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onBack}
            disabled={submitting}
            className="rounded-full border border-gold/40 px-5 py-3 text-sm font-semibold text-charcoal hover:bg-ivory disabled:opacity-60"
          >
            修正する
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className="rounded-full bg-gradient-to-r from-gold to-gold-dark px-5 py-3 text-sm font-semibold text-white shadow-gold disabled:opacity-60"
          >
            {submitting ? "処理中..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
