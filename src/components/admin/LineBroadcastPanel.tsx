"use client";

import { useState } from "react";
import { NOTIFICATION_AREA_OPTIONS } from "@/lib/notification-areas";

export type BroadcastJobOption = {
  id: string;
  shopName: string;
  district: string;
};

type LineBroadcastPanelProps = {
  jobs: BroadcastJobOption[];
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

function getConfirmMessage(action: PendingAction, jobs: BroadcastJobOption[]): string {
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
  const [dailyTestUserId, setDailyTestUserId] = useState("");
  const [dailyTestLoading, setDailyTestLoading] = useState(false);

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

  async function runDailyPickupTest(dryRun: boolean) {
    const userId = dailyTestUserId.trim();
    if (!userId) {
      onMessage("毎日PickUpテストには users.id（UUID）を入力してください。");
      return;
    }
    setDailyTestLoading(true);
    onMessage("");
    try {
      const response = await fetch("/api/admin/daily-pickup-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId, dryRun }),
      });
      const data = (await response.json()) as {
        message?: string;
        hint?: string;
        diagnosis?: {
          eligible?: boolean;
          reasons?: string[];
          matchingTopShopCount?: number;
          alreadySentToday?: boolean;
          notifyDailyPickup?: boolean;
          areaCount?: number;
          lineUserIdMasked?: string | null;
        };
        result?: {
          sent?: number;
          failed?: number;
          skippedDuplicate?: number;
          lineHttpStatuses?: number[];
          deliveredJobIds?: string[];
          executedAtJst?: string;
        };
      };
      if (!response.ok) {
        const reasons = data.diagnosis?.reasons?.join(" / ");
        throw new Error(
          [data.message, reasons].filter(Boolean).join(" — ") ||
            "毎日PickUpテストに失敗しました。",
        );
      }
      if (dryRun) {
        onMessage(
          [
            "【診断のみ・未送信】",
            data.hint,
            data.diagnosis?.notifyDailyPickup === false
              ? "毎日通知OFF"
              : "毎日通知ON",
            `地域数=${data.diagnosis?.areaCount ?? 0}`,
            `一致最優先店舗=${data.diagnosis?.matchingTopShopCount ?? 0}`,
            data.diagnosis?.lineUserIdMasked
              ? `LINE=${data.diagnosis.lineUserIdMasked}`
              : null,
            data.diagnosis?.alreadySentToday ? "本日既送あり" : null,
          ]
            .filter(Boolean)
            .join(" / "),
        );
        return;
      }
      onMessage(
        [
          "【1件テスト送信完了】",
          `成功=${data.result?.sent ?? 0}`,
          `失敗=${data.result?.failed ?? 0}`,
          `重複スキップ=${data.result?.skippedDuplicate ?? 0}`,
          data.result?.lineHttpStatuses?.length
            ? `LINE HTTP=${data.result.lineHttpStatuses.join(",")}`
            : null,
          data.result?.executedAtJst
            ? `実行=${data.result.executedAtJst}`
            : null,
          data.result?.deliveredJobIds?.[0]
            ? `店舗ID=${data.result.deliveredJobIds[0]}`
            : null,
        ]
          .filter(Boolean)
          .join(" / "),
      );
    } catch (error) {
      onMessage(
        error instanceof Error
          ? error.message
          : "毎日PickUpテストに失敗しました。",
      );
    } finally {
      setDailyTestLoading(false);
    }
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

        <div className="rounded-xl border border-amber-300/50 bg-amber-50/60 p-4">
          <p className="text-sm font-semibold text-charcoal">
            毎日PickUp（20時配信）の安全テスト
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            指定した users.id の1人だけに、Cronと同じ配信ロジックで診断／送信します。全員への一斉再送はできません。文面は本番と同じです。
          </p>
          <input
            type="text"
            value={dailyTestUserId}
            onChange={(event) => setDailyTestUserId(event.target.value)}
            placeholder="users.id（UUID）"
            className="mt-3 w-full rounded-xl border border-gold/25 bg-white px-3 py-2 text-sm text-charcoal"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={dailyTestLoading || !dailyTestUserId.trim()}
              onClick={() => void runDailyPickupTest(true)}
              className="rounded-full border border-gold/35 bg-white px-4 py-2 text-sm font-semibold text-gold-dark disabled:opacity-60"
            >
              {dailyTestLoading ? "処理中..." : "診断のみ（未送信）"}
            </button>
            <button
              type="button"
              disabled={dailyTestLoading || !dailyTestUserId.trim()}
              onClick={() => {
                if (
                  !window.confirm(
                    "指定した1ユーザーだけへ毎日PickUpを実送信します。よろしいですか？（本日既送の場合は二重送信防止で止まります）",
                  )
                ) {
                  return;
                }
                void runDailyPickupTest(false);
              }}
              className="rounded-full border border-charcoal/20 bg-charcoal px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {dailyTestLoading ? "送信中..." : "1件だけ実送信"}
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
