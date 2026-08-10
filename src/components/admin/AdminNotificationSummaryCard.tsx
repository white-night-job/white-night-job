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
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/notifications/summary", {
        cache: "no-store",
        credentials: "include",
      });
      const data = (await res.json()) as { summary?: Summary };
      if (res.ok && data.summary) {
        setSummary(data.summary);
        setLoadError(false);
      } else {
        setLoadError(true);
      }
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const source = new EventSource("/api/admin/notifications/stream");
    source.addEventListener("change", () => {
      void load();
    });
    return () => source.close();
  }, [load]);

  return (
    <div className="admin-notify-summary-card">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2>通知サマリー</h2>
        <Link
          href="/admin/notifications"
          className="text-xs font-medium text-gold-dark underline-offset-2 hover:underline"
        >
          すべて見る
        </Link>
      </div>
      {loading ? (
        <p className="admin-muted">読み込み中...</p>
      ) : loadError ? (
        <p className="admin-muted">サマリーを取得できませんでした。再読み込みしてください。</p>
      ) : (
        <ul className="admin-notify-summary-list">
          {ROWS.map((row) => {
            const count = summary[row.key];
            if (!row.alwaysShow && count <= 0) return null;
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
                  <span className="font-semibold tabular-nums">{count}件</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      <p className="admin-notify-summary-note">
        各行をクリックすると、該当する未読通知一覧へ移動します
      </p>
    </div>
  );
}
