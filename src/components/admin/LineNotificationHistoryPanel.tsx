"use client";

import { useCallback, useEffect, useState } from "react";

type HistoryRow = {
  id: string;
  sentAt: string;
  shopName: string;
  jobId: string | null;
  notifyType: string;
  notifyTypeLabel: string;
  targetCount: number;
  successCount: number;
  failCount: number;
  detail: string | null;
};

function formatDateTime(value: string) {
  try {
    return new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function LineNotificationHistoryPanel() {
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/notification-history", {
        cache: "no-store",
        credentials: "include",
      });
      const data = (await response.json()) as {
        history?: HistoryRow[];
        message?: string;
      };
      if (!response.ok) {
        throw new Error(data.message ?? "履歴の取得に失敗しました。");
      }
      setHistory(data.history ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "履歴の取得に失敗しました。");
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section className="mb-8 rounded-2xl border border-gold/25 bg-white p-5 shadow-gold sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl font-semibold text-charcoal">
            LINE通知履歴
          </h2>
          <p className="mt-1 text-xs text-muted">
            自動配信の送信日時・店舗・種類・件数を確認できます。
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="rounded-full border border-gold/40 bg-ivory px-4 py-2 text-xs font-semibold text-gold-dark disabled:opacity-60"
        >
          {loading ? "更新中..." : "再読み込み"}
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {loading && history.length === 0 ? (
        <div className="mt-4 h-24 animate-pulse rounded-xl bg-ivory" />
      ) : history.length === 0 ? (
        <p className="mt-4 text-sm text-muted">まだ通知履歴はありません。</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-gold/25 text-muted">
                <th className="px-2 py-2 font-semibold">送信日時</th>
                <th className="px-2 py-2 font-semibold">店舗</th>
                <th className="px-2 py-2 font-semibold">通知種類</th>
                <th className="px-2 py-2 font-semibold">対象</th>
                <th className="px-2 py-2 font-semibold">成功</th>
                <th className="px-2 py-2 font-semibold">失敗</th>
              </tr>
            </thead>
            <tbody>
              {history.map((row) => (
                <tr key={row.id} className="border-b border-gold/10 text-charcoal">
                  <td className="whitespace-nowrap px-2 py-2">
                    {formatDateTime(row.sentAt)}
                  </td>
                  <td className="px-2 py-2">{row.shopName}</td>
                  <td className="px-2 py-2">
                    <span className="font-medium">{row.notifyTypeLabel}</span>
                    {row.detail ? (
                      <span className="mt-0.5 block text-[11px] text-muted">
                        {row.detail}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-2 py-2">{row.targetCount}</td>
                  <td className="px-2 py-2 text-[#047a3b]">{row.successCount}</td>
                  <td className="px-2 py-2 text-red-600">{row.failCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
