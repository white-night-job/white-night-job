"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Summary = {
  unreadCount: number;
  newContract: number;
  paymentFailed: number;
  canceled: number;
  invoicePaid: number;
  system: number;
};

const EMPTY: Summary = {
  unreadCount: 0,
  newContract: 0,
  paymentFailed: 0,
  canceled: 0,
  invoicePaid: 0,
  system: 0,
};

const SUMMARY_CACHE_TTL_MS = 45_000;

type SummaryCache = { summary: Summary; savedAt: number };

let memoryCache: SummaryCache | null = null;

function readSummaryCache(): Summary | null {
  if (!memoryCache) return null;
  if (Date.now() - memoryCache.savedAt > SUMMARY_CACHE_TTL_MS) {
    memoryCache = null;
    return null;
  }
  return memoryCache.summary;
}

function writeSummaryCache(summary: Summary) {
  memoryCache = { summary, savedAt: Date.now() };
}

function clearSummaryCache() {
  memoryCache = null;
}

const ROWS: Array<{
  key: keyof Pick<
    Summary,
    "newContract" | "paymentFailed" | "canceled" | "invoicePaid"
  >;
  type: string;
  emoji: string;
  label: string;
  alwaysShow?: boolean;
}> = [
  {
    key: "newContract",
    type: "stripe_new_contract",
    emoji: "🔴",
    label: "新規契約",
    alwaysShow: true,
  },
  {
    key: "paymentFailed",
    type: "stripe_payment_failed",
    emoji: "🟠",
    label: "決済失敗",
    alwaysShow: true,
  },
  {
    key: "canceled",
    type: "stripe_canceled",
    emoji: "⚫",
    label: "解約",
    alwaysShow: true,
  },
  {
    key: "invoicePaid",
    type: "stripe_invoice_paid",
    emoji: "🟢",
    label: "定期決済成功",
  },
];

export function AdminNotificationSummaryCard() {
  const [summary, setSummary] = useState<Summary>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/notifications/summary", {
        cache: "no-store",
        credentials: "include",
      });
      const data = (await res.json()) as { summary?: Summary };
      if (res.ok && data.summary) {
        setSummary(data.summary);
        writeSummaryCache(data.summary);
        setHasData(true);
      }
    } catch {
      // Keep the reserved layout; counts stay pending until a successful fetch.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const cached = readSummaryCache();
    if (cached) {
      setSummary(cached);
      setHasData(true);
      setLoading(false);
      void load();
    } else {
      void load();
    }

    const source = new EventSource("/api/admin/notifications/stream");
    source.addEventListener("change", () => {
      clearSummaryCache();
      void load();
    });
    return () => source.close();
  }, [load]);

  const countsPending = !hasData;
  const visibleRows = ROWS.filter((row) => {
    if (row.alwaysShow) return true;
    if (countsPending) return false;
    return summary[row.key] > 0;
  });

  return (
    <div
      className="admin-notify-summary-card"
      aria-busy={countsPending || loading}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2>通知サマリー</h2>
        <Link
          href="/admin/notifications"
          className="text-xs font-medium text-gold-dark underline-offset-2 hover:underline"
        >
          すべて見る
        </Link>
      </div>
      <ul className="admin-notify-summary-list">
        {visibleRows.map((row) => {
          const count = summary[row.key];
          const href = `/admin/notifications?type=${encodeURIComponent(row.type)}&unreadOnly=1`;
          return (
            <li key={row.type}>
              <Link
                href={href}
                className="flex items-center justify-between gap-2 rounded-md px-1 py-0.5 text-inherit no-underline hover:bg-gold/10"
              >
                <span>
                  <span aria-hidden>{row.emoji}</span> {row.label}
                </span>
                <span
                  className={`admin-notify-summary-count${
                    countsPending ? " is-pending" : ""
                  }`}
                >
                  {countsPending ? "…" : `${count}件`}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      <p className="admin-notify-summary-note">
        各行をクリックすると、該当する未読通知一覧へ移動します
      </p>
    </div>
  );
}
