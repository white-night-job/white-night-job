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

export function AdminNotificationSummaryCard() {
  const [summary, setSummary] = useState<Summary>(EMPTY);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/notifications/summary", {
        cache: "no-store",
        credentials: "include",
      });
      const data = (await res.json()) as { summary?: Summary };
      if (res.ok && data.summary) setSummary(data.summary);
    } catch {
      /* ignore */
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
    <Link href="/admin/notifications" className="admin-notify-summary-card">
      <h2>通知サマリー</h2>
      {loading ? (
        <p className="admin-muted">読み込み中...</p>
      ) : (
        <ul className="admin-notify-summary-list">
          <li>
            <span aria-hidden>🔴</span> 新規契約 {summary.newContract}件
          </li>
          <li>
            <span aria-hidden>🟠</span> 決済失敗 {summary.paymentFailed}件
          </li>
          <li>
            <span aria-hidden>⚫</span> 解約 {summary.canceled}件
          </li>
          {summary.invoicePaid > 0 ? (
            <li>
              <span aria-hidden>🟢</span> 定期決済成功 {summary.invoicePaid}件
            </li>
          ) : null}
        </ul>
      )}
      <p className="admin-notify-summary-note">クリックで通知一覧へ</p>
    </Link>
  );
}
