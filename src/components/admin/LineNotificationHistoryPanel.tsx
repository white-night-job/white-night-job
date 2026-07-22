"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type HistoryRow = {
  id: string;
  sentAt: string;
  deliveryDate?: string;
  deliveryTime?: string;
  shopName: string;
  district?: string | null;
  jobId: string | null;
  notifyType: string;
  notifyTypeLabel: string;
  targetCount: number;
  successCount: number;
  failCount: number;
  detail: string | null;
};

type DailySummary = {
  id: string;
  scheduledDate: string;
  deliveryDate: string;
  deliveryTime: string;
  shopName: string;
  district: string;
  notifyTypeLabel: string;
  targetCount: number;
  successCount: number;
  failCount: number;
};

type ShopStat = {
  jobId: string;
  shopName: string;
  district: string;
  sendCount: number;
};

const PAGE_SIZE = 20;

function formatDateTime(value: string) {
  try {
    return new Intl.DateTimeFormat("ja-JP", {
      timeZone: "Asia/Tokyo",
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

export function LineNotificationHistoryPanel({
  embedded = false,
  active = true,
}: {
  embedded?: boolean;
  /** When false, skip fetching (parent keeps panel closed). */
  active?: boolean;
} = {}) {
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [dailySummaries, setDailySummaries] = useState<DailySummary[]>([]);
  const [shopStats, setShopStats] = useState<ShopStat[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState("");
  const [loadedOnce, setLoadedOnce] = useState(false);
  const historyLenRef = useRef(0);
  historyLenRef.current = history.length;

  const load = useCallback(async (options?: { append?: boolean }) => {
    const append = Boolean(options?.append);
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError("");
    const timerLabel = append
      ? "admin:notification-history-more"
      : "admin:notification-history-open";
    console.time(timerLabel);
    try {
      const offset = append ? historyLenRef.current : 0;
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(offset),
        extras: append ? "0" : "1",
      });
      const response = await fetch(
        `/api/admin/notification-history?${params.toString()}`,
        {
          cache: "no-store",
          credentials: "include",
        },
      );
      const data = (await response.json()) as {
        history?: HistoryRow[];
        dailySummaries?: DailySummary[];
        shopStats30d?: ShopStat[];
        hasMore?: boolean;
        message?: string;
      };
      if (!response.ok) {
        throw new Error(data.message ?? "履歴の取得に失敗しました。");
      }
      setHistory((current) =>
        append ? [...current, ...(data.history ?? [])] : data.history ?? [],
      );
      if (!append) {
        setDailySummaries(data.dailySummaries ?? []);
        setShopStats(data.shopStats30d ?? []);
      }
      setHasMore(Boolean(data.hasMore));
      setLoadedOnce(true);
      console.timeEnd(timerLabel);
    } catch (err) {
      console.timeEnd(timerLabel);
      setError(err instanceof Error ? err.message : "履歴の取得に失敗しました。");
      if (!append) {
        setHistory([]);
        setDailySummaries([]);
        setShopStats([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    if (!active || loadedOnce) return;
    void load();
  }, [active, loadedOnce, load]);

  return (
    <section
      className={
        embedded
          ? "pt-1"
          : "mb-8 rounded-2xl border border-gold/25 bg-white p-5 shadow-gold sm:p-6"
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          {!embedded && (
            <h2 className="font-serif text-xl font-semibold text-charcoal">
              LINE通知履歴
            </h2>
          )}
          <p className={`${embedded ? "" : "mt-1"} text-xs text-muted`}>
            自動配信の送信日時・店舗・種類・件数を確認できます。
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load({ append: false })}
          disabled={loading}
          className="rounded-full border border-gold/40 bg-ivory px-4 py-2 text-xs font-semibold text-gold-dark disabled:opacity-60"
        >
          {loading ? "更新中..." : "再読み込み"}
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-charcoal">毎日PickUp配信サマリー</h3>
        {loading && dailySummaries.length === 0 ? (
          <div className="mt-3 h-20 animate-pulse rounded-xl bg-ivory" />
        ) : dailySummaries.length === 0 ? (
          <p className="mt-2 text-xs text-muted">まだ毎日PickUpの履歴はありません。</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-gold/25 text-muted">
                  <th className="px-2 py-2 font-semibold">配信日</th>
                  <th className="px-2 py-2 font-semibold">配信時刻</th>
                  <th className="px-2 py-2 font-semibold">店舗</th>
                  <th className="px-2 py-2 font-semibold">地域</th>
                  <th className="px-2 py-2 font-semibold">対象</th>
                  <th className="px-2 py-2 font-semibold">成功</th>
                  <th className="px-2 py-2 font-semibold">失敗</th>
                </tr>
              </thead>
              <tbody>
                {dailySummaries.map((row) => (
                  <tr key={row.id} className="border-b border-gold/10 text-charcoal">
                    <td className="whitespace-nowrap px-2 py-2">{row.deliveryDate}</td>
                    <td className="whitespace-nowrap px-2 py-2">{row.deliveryTime}</td>
                    <td className="px-2 py-2">{row.shopName}</td>
                    <td className="px-2 py-2">{row.district}</td>
                    <td className="px-2 py-2">{row.targetCount}</td>
                    <td className="px-2 py-2 text-[#047a3b]">{row.successCount}</td>
                    <td className="px-2 py-2 text-red-600">{row.failCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-8">
        <h3 className="text-sm font-semibold text-charcoal">直近30日 店舗別配信回数</h3>
        {loading && shopStats.length === 0 ? (
          <div className="mt-3 h-16 animate-pulse rounded-xl bg-ivory" />
        ) : shopStats.length === 0 ? (
          <p className="mt-2 text-xs text-muted">まだ集計できる配信はありません。</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {shopStats.slice(0, 15).map((row) => (
              <li
                key={row.jobId}
                className="flex items-center justify-between rounded-xl border border-gold/15 bg-ivory/40 px-3 py-2 text-sm"
              >
                <span className="text-charcoal">
                  {row.shopName}
                  <span className="ml-2 text-xs text-muted">{row.district}</span>
                </span>
                <span className="font-semibold text-gold-dark">{row.sendCount}回</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-8">
        <h3 className="text-sm font-semibold text-charcoal">通知バッチ履歴</h3>
        {loading && history.length === 0 ? (
          <div className="mt-3 h-24 animate-pulse rounded-xl bg-ivory" />
        ) : history.length === 0 ? (
          <p className="mt-2 text-xs text-muted">まだ通知履歴はありません。</p>
        ) : (
          <>
            <div className="mt-3 overflow-x-auto">
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
            {hasMore && (
              <button
                type="button"
                disabled={loadingMore}
                onClick={() => void load({ append: true })}
                className="mt-4 w-full rounded-full border border-gold/40 px-4 py-3 text-sm font-semibold text-gold-dark hover:bg-ivory disabled:opacity-60"
              >
                {loadingMore ? "読み込み中..." : "もっと見る（20件ずつ）"}
              </button>
            )}
          </>
        )}
      </div>
    </section>
  );
}
