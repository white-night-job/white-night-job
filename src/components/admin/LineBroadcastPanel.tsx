"use client";

import { useState } from "react";
import { NOTIFICATION_AREA_OPTIONS } from "@/lib/notification-areas";
import type { Job } from "@/types/job";

type LineBroadcastPanelProps = {
  jobs: Job[];
  selectedJobId?: string | null;
  onMessage: (message: string) => void;
  /** When true, omit outer card title (parent accordion provides chrome). */
  embedded?: boolean;
};

type PendingAction =
  | { kind: "new_jobs" }
  | { kind: "pickup_jobs" }
  | { kind: "area"; areas: string[] }
  | { kind: "specific_shop"; jobId: string }
  | { kind: "favorited_users"; jobId: string };

function getConfirmMessage(action: PendingAction, jobs: Job[]): string {
  switch (action.kind) {
    case "new_jobs":
      return "新着店舗をカルーセル形式でLINE配信します。よろしいですか？";
    case "pickup_jobs":
      return "PICK UP店舗をカルーセル形式でLINE配信します。よろしいですか？";
    case "area":
      return `${action.areas.join("・")}エリア向けに店舗カルーセルをLINE配信します。よろしいですか？`;
    case "specific_shop": {
      const job = jobs.find((item) => item.id === action.jobId);
      return `${job?.shopName ?? "選択中の店舗"}をカルーセル形式でLINE配信します。よろしいですか？`;
    }
    case "favorited_users": {
      const job = jobs.find((item) => item.id === action.jobId);
      return `${job?.shopName ?? "選択中の店舗"}をお気に入り登録しているユーザーへLINE配信します。よろしいですか？`;
    }
    default:
      return "LINE配信を実行します。よろしいですか？";
  }
}

export function LineBroadcastPanel({
  jobs,
  selectedJobId,
  onMessage,
  embedded = false,
}: LineBroadcastPanelProps) {
  const [loading, setLoading] = useState(false);
  const [selectedAreas, setSelectedAreas] = useState<string[]>(["すすきの"]);
  const [targetJobId, setTargetJobId] = useState(selectedJobId ?? "");
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  async function executeAction(action: PendingAction) {
    setLoading(true);
    onMessage("");
    try {
      let response: Response;
      if (action.kind === "new_jobs" || action.kind === "pickup_jobs") {
        response = await fetch("/api/line/send-shop-carousel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            mode: action.kind,
          }),
        });
      } else if (action.kind === "area") {
        response = await fetch("/api/line/send-area-shops", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ areas: action.areas }),
        });
      } else if (action.kind === "specific_shop") {
        response = await fetch("/api/line/send-shop-carousel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            mode: "custom",
            jobIds: [action.jobId],
          }),
        });
      } else {
        response = await fetch("/api/line/send-to-favorited-users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ jobId: action.jobId }),
        });
      }

      const data = (await response.json()) as {
        sent?: number;
        failed?: number;
        message?: string;
      };
      if (!response.ok) {
        throw new Error(data.message ?? "LINE配信に失敗しました。");
      }
      onMessage(
        `LINE配信が完了しました。送信成功: ${data.sent ?? 0}件 / 失敗: ${data.failed ?? 0}件`,
      );
    } catch (error) {
      onMessage(error instanceof Error ? error.message : "LINE配信に失敗しました。");
    } finally {
      setLoading(false);
      setPendingAction(null);
    }
  }

  function toggleArea(area: string) {
    setSelectedAreas((current) =>
      current.includes(area)
        ? current.filter((item) => item !== area)
        : [...current, area],
    );
  }

  const effectiveJobId = targetJobId || selectedJobId || "";

  return (
    <section
      className={
        embedded
          ? "pt-1"
          : "mb-6 rounded-2xl border border-gold/25 bg-white p-5 shadow-gold sm:p-6"
      }
    >
      {!embedded && (
        <>
          <h2 className="font-serif text-lg font-semibold text-charcoal">
            LINE配信管理
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Flex Messageのカルーセル形式で店舗情報を配信します。送信結果は notification_logs
            に記録されます。
          </p>
        </>
      )}
      {embedded && (
        <p className="mb-3 text-xs leading-relaxed text-muted">
          Flex Messageのカルーセル形式で店舗情報を配信します。送信結果は notification_logs
          に記録されます。
        </p>
      )}

      <div className={embedded ? "grid gap-4" : "mt-4 grid gap-4"}>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={() => setPendingAction({ kind: "new_jobs" })}
            className="rounded-full border border-gold/35 bg-white px-4 py-2 text-sm font-semibold text-gold-dark disabled:opacity-60"
          >
            新着店舗を配信
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => setPendingAction({ kind: "pickup_jobs" })}
            className="rounded-full border border-gold/35 bg-white px-4 py-2 text-sm font-semibold text-gold-dark disabled:opacity-60"
          >
            PICK UP店舗を配信
          </button>
        </div>

        <div className="rounded-xl border border-gold/20 bg-ivory/40 p-4">
          <p className="text-sm font-semibold text-charcoal">エリア別配信</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {NOTIFICATION_AREA_OPTIONS.map((area) => (
              <label
                key={area}
                className="inline-flex items-center gap-2 rounded-full border border-gold/25 bg-white px-3 py-1.5 text-sm text-charcoal"
              >
                <input
                  type="checkbox"
                  checked={selectedAreas.includes(area)}
                  onChange={() => toggleArea(area)}
                />
                {area}
              </label>
            ))}
          </div>
          <button
            type="button"
            disabled={loading || selectedAreas.length === 0}
            onClick={() => setPendingAction({ kind: "area", areas: selectedAreas })}
            className="mt-3 rounded-full border border-gold/35 bg-white px-4 py-2 text-sm font-semibold text-gold-dark disabled:opacity-60"
          >
            選択エリアへ配信
          </button>
        </div>

        <div className="rounded-xl border border-gold/20 bg-ivory/40 p-4">
          <p className="text-sm font-semibold text-charcoal">特定店舗・お気に入り登録者へ配信</p>
          <select
            value={effectiveJobId}
            onChange={(event) => setTargetJobId(event.target.value)}
            className="mt-3 w-full rounded-xl border border-gold/25 bg-white px-3 py-2 text-sm text-charcoal"
          >
            <option value="">店舗を選択</option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.shopName}（{job.district}）
              </option>
            ))}
          </select>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={loading || !effectiveJobId}
              onClick={() =>
                setPendingAction({ kind: "specific_shop", jobId: effectiveJobId })
              }
              className="rounded-full border border-gold/35 bg-white px-4 py-2 text-sm font-semibold text-gold-dark disabled:opacity-60"
            >
              特定店舗を配信
            </button>
            <button
              type="button"
              disabled={loading || !effectiveJobId}
              onClick={() =>
                setPendingAction({ kind: "favorited_users", jobId: effectiveJobId })
              }
              className="rounded-full border border-gold/35 bg-white px-4 py-2 text-sm font-semibold text-gold-dark disabled:opacity-60"
            >
              お気に入り登録者へ送信
            </button>
          </div>
        </div>
      </div>

      {pendingAction && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl border border-gold/30 bg-white p-5 shadow-2xl">
            <h3 className="font-serif text-lg font-semibold text-charcoal">配信確認</h3>
            <p className="mt-3 text-sm leading-7 text-charcoal/90">
              {getConfirmMessage(pendingAction, jobs)}
            </p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setPendingAction(null)}
                className="flex-1 rounded-full border border-charcoal/15 px-4 py-2.5 text-sm font-semibold text-charcoal"
              >
                キャンセル
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => void executeAction(pendingAction)}
                className="flex-1 rounded-full bg-gradient-to-r from-gold to-gold-dark px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {loading ? "送信中..." : "配信する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
