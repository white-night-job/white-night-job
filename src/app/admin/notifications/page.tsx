"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  formatRelativeTimeJa,
  getNotificationShopName,
  getNotificationSummary,
  getNotificationTypeMeta,
  getPaymentFailedDetailLines,
} from "@/lib/admin-notification-ui";

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

const TYPE_FILTERS: Array<{ type: string | null; label: string }> = [
  { type: null, label: "すべて" },
  { type: "stripe_new_contract", label: "新規契約" },
  { type: "stripe_payment_failed", label: "決済失敗" },
  { type: "stripe_canceled", label: "解約" },
  { type: "stripe_invoice_paid", label: "定期決済成功" },
];

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

function buildListHref(opts: {
  type: string | null;
  unreadOnly: boolean;
}): string {
  const params = new URLSearchParams();
  if (opts.type) params.set("type", opts.type);
  if (opts.unreadOnly) params.set("unreadOnly", "1");
  const qs = params.toString();
  return qs ? `/admin/notifications?${qs}` : "/admin/notifications";
}

function AdminNotificationsPageInner() {
  const searchParams = useSearchParams();
  const typeFilter = searchParams.get("type")?.trim() || null;
  const unreadOnly = searchParams.get("unreadOnly") === "1";

  const [items, setItems] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const typeLabel = useMemo(() => {
    const found = TYPE_FILTERS.find((item) => item.type === typeFilter);
    return found?.label ?? "通知";
  }, [typeFilter]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (unreadOnly) params.set("unreadOnly", "1");
      if (typeFilter) params.set("type", typeFilter);
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
  }, [unreadOnly, typeFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const source = new EventSource("/api/admin/notifications/stream");
    source.addEventListener("change", () => {
      void load();
    });
    return () => source.close();
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

  async function openItem(item: AdminNotification) {
    setExpandedId((current) => (current === item.id ? null : item.id));
    if (!item.isRead) await markRead(item.id);
  }

  return (
    <div>
      <header className="admin-page-header">
        <h1>通知履歴</h1>
        <p>
          Stripe決済・契約イベントなど、運営向け通知の履歴です。
          {typeFilter
            ? `（表示中: ${typeLabel}${unreadOnly ? "・未読のみ" : ""}）`
            : null}
        </p>
      </header>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        {TYPE_FILTERS.map((filter) => {
          const active = filter.type === typeFilter;
          return (
            <Link
              key={filter.label}
              href={buildListHref({ type: filter.type, unreadOnly })}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium no-underline ${
                active
                  ? "border-gold/50 bg-ivory text-gold-dark"
                  : "border-charcoal/20 text-charcoal"
              }`}
            >
              {filter.label}
            </Link>
          );
        })}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link
          href={buildListHref({ type: typeFilter, unreadOnly: false })}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium no-underline ${
            !unreadOnly
              ? "border-gold/50 bg-ivory text-gold-dark"
              : "border-charcoal/20 text-charcoal"
          }`}
        >
          既読含む
        </Link>
        <Link
          href={buildListHref({ type: typeFilter, unreadOnly: true })}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium no-underline ${
            unreadOnly
              ? "border-gold/50 bg-ivory text-gold-dark"
              : "border-charcoal/20 text-charcoal"
          }`}
        >
          未読のみ（{unreadCount}）
        </Link>
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
          <p className="admin-muted">
            {unreadOnly || typeFilter
              ? "該当する通知はありません。"
              : "通知はまだありません。"}
          </p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const meta = getNotificationTypeMeta(item.type);
              const paymentFailedLines =
                item.type === "stripe_payment_failed"
                  ? getPaymentFailedDetailLines(item)
                  : [];
              return (
                <article
                  key={item.id}
                  className={`rounded-xl border p-4 ${
                    item.isRead
                      ? "border-gold/15 bg-white"
                      : "border-red-200 bg-red-50/70"
                  }`}
                >
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => void openItem(item)}
                  >
                    <p className="text-sm font-semibold text-charcoal">
                      <span aria-hidden>{meta.emoji}</span> {meta.label}
                      {!item.isRead ? (
                        <span className="ml-2 text-xs font-medium text-red-700">
                          未読
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-1 text-sm font-medium text-charcoal">
                      {getNotificationShopName(item)}
                    </p>
                    {paymentFailedLines.length > 0 ? (
                      <ul className="mt-1.5 space-y-0.5 text-sm text-muted">
                        {paymentFailedLines.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-0.5 text-sm text-muted">
                        {getNotificationSummary(item)}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-muted">
                      {formatRelativeTimeJa(item.createdAt)} ／{" "}
                      {formatDateTime(item.createdAt)}
                    </p>
                  </button>
                  {expandedId === item.id ? (
                    <pre className="mt-3 whitespace-pre-wrap break-words rounded-lg border border-gold/10 bg-white px-3 py-2 text-sm leading-relaxed text-charcoal">
                      {item.message}
                    </pre>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminNotificationsPage() {
  return (
    <Suspense
      fallback={
        <div>
          <header className="admin-page-header">
            <h1>通知履歴</h1>
            <p className="admin-muted">読み込み中...</p>
          </header>
        </div>
      }
    >
      <AdminNotificationsPageInner />
    </Suspense>
  );
}
