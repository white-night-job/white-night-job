"use client";

import { useCallback, useEffect, useState } from "react";

type AdminNotification = {
  id: string;
  type: string;
  storeId: string | null;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  shopName?: string | null;
};

function formatDateTime(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function typeLabel(type: string): string {
  switch (type) {
    case "stripe_new_contract":
      return "新規契約";
    case "stripe_invoice_paid":
      return "定期決済";
    case "stripe_payment_failed":
      return "決済失敗";
    case "stripe_canceled":
      return "解約";
    default:
      return type;
  }
}

export default function AdminNotificationsPage() {
  const [items, setItems] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (unreadOnly) params.set("unreadOnly", "1");
      const res = await fetch(`/api/admin/notifications?${params}`, {
        cache: "no-store",
        credentials: "include",
      });
      const data = (await res.json()) as {
        notifications?: AdminNotification[];
        unreadCount?: number;
        message?: string;
      };
      if (!res.ok) throw new Error(data.message ?? "取得に失敗しました。");
      setItems(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  }, [unreadOnly]);

  useEffect(() => {
    void load();
  }, [load]);

  async function markRead(id: string) {
    setBusyId(id);
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isRead: true }),
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) throw new Error(data.message ?? "更新に失敗しました。");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新に失敗しました。");
    } finally {
      setBusyId(null);
    }
  }

  async function markAllRead() {
    setBusyId("all");
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) throw new Error(data.message ?? "更新に失敗しました。");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新に失敗しました。");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <header className="admin-page-header">
        <h1>通知センター</h1>
        <p>Stripe決済・契約イベントなど、運営向け通知の履歴です。</p>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setUnreadOnly(false)}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
            !unreadOnly
              ? "border-gold/50 bg-ivory text-gold-dark"
              : "border-charcoal/20 text-charcoal"
          }`}
        >
          すべて
        </button>
        <button
          type="button"
          onClick={() => setUnreadOnly(true)}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
            unreadOnly
              ? "border-gold/50 bg-ivory text-gold-dark"
              : "border-charcoal/20 text-charcoal"
          }`}
        >
          未読のみ（{unreadCount}）
        </button>
        <button
          type="button"
          onClick={() => void markAllRead()}
          disabled={busyId === "all" || unreadCount === 0}
          className="rounded-full border border-charcoal/25 px-3 py-1.5 text-xs font-medium text-charcoal disabled:opacity-50"
        >
          {busyId === "all" ? "処理中…" : "すべて既読にする"}
        </button>
      </div>

      {error ? (
        <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="rounded-xl border border-gold/20 bg-white p-4">
        {loading ? (
          <p className="admin-muted">読み込み中...</p>
        ) : items.length === 0 ? (
          <p className="admin-muted">通知はまだありません。</p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <article
                key={item.id}
                className={`rounded-xl border p-4 ${
                  item.isRead
                    ? "border-gold/15 bg-white"
                    : "border-gold/35 bg-ivory/50"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-muted">
                      {typeLabel(item.type)} ／ {formatDateTime(item.createdAt)}
                      {item.shopName ? ` ／ ${item.shopName}` : ""}
                      {!item.isRead ? " ／ 未読" : ""}
                    </p>
                    <h2 className="mt-1 font-semibold text-charcoal">{item.title}</h2>
                  </div>
                  {!item.isRead ? (
                    <button
                      type="button"
                      onClick={() => void markRead(item.id)}
                      disabled={busyId === item.id}
                      className="rounded-full border border-gold/35 px-3 py-1.5 text-xs text-gold-dark disabled:opacity-50"
                    >
                      {busyId === item.id ? "処理中…" : "既読にする"}
                    </button>
                  ) : null}
                </div>
                <pre className="mt-3 whitespace-pre-wrap break-words rounded-lg border border-gold/10 bg-white px-3 py-2 text-sm leading-relaxed text-charcoal">
                  {item.message}
                </pre>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
