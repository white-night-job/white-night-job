"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  formatRelativeTimeJa,
  getNotificationShopName,
  getNotificationSummary,
  getNotificationTypeMeta,
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

export function AdminNotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/notifications?limit=30", {
        cache: "no-store",
        credentials: "include",
      });
      const data = (await res.json()) as {
        notifications?: AdminNotification[];
        unreadCount?: number;
        message?: string;
      };
      if (!res.ok) throw new Error(data.message ?? "通知の取得に失敗しました。");
      setItems(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "通知の取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Supabase Realtime → SSE → バッジ/一覧を更新（リロード不要）
  useEffect(() => {
    const source = new EventSource("/api/admin/notifications/stream");
    const refresh = () => {
      void load();
    };
    source.addEventListener("change", refresh);
    source.addEventListener("error", () => {
      // 接続切れ時はポーリングで補完
    });
    const poll = window.setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 60_000);
    return () => {
      source.close();
      window.clearInterval(poll);
    };
  }, [load]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!panelRef.current) return;
      if (!panelRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  async function markRead(id: string) {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, isRead: true } : item)),
    );
    setUnreadCount((count) => Math.max(0, count - 1));
    try {
      await fetch("/api/admin/notifications", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isRead: true }),
      });
    } catch {
      void load();
    }
  }

  async function markAllRead() {
    setItems((current) => current.map((item) => ({ ...item, isRead: true })));
    setUnreadCount(0);
    try {
      await fetch("/api/admin/notifications", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
    } catch {
      void load();
    }
  }

  function handleOpenItem(item: AdminNotification) {
    if (!item.isRead) void markRead(item.id);
  }

  const badgeLabel = unreadCount > 99 ? "99+" : String(unreadCount);

  return (
    <div className="admin-notify" ref={panelRef}>
      <button
        type="button"
        className="admin-notify-bell"
        aria-label={
          unreadCount > 0 ? `通知（未読${unreadCount}件）` : "通知"
        }
        aria-expanded={open}
        onClick={() => {
          setOpen((value) => !value);
          if (!open) void load();
        }}
      >
        <Bell size={18} strokeWidth={2} aria-hidden />
        {unreadCount > 0 ? (
          <span className="admin-notify-badge">{badgeLabel}</span>
        ) : null}
      </button>

      {open ? (
        <>
          <button
            type="button"
            className="admin-notify-backdrop"
            aria-label="通知パネルを閉じる"
            onClick={() => setOpen(false)}
          />
          <div className="admin-notify-panel" role="dialog" aria-label="通知一覧">
            <div className="admin-notify-panel-header">
              <h2>通知</h2>
              <button
                type="button"
                className="admin-notify-link-btn"
                onClick={() => void markAllRead()}
                disabled={unreadCount === 0}
              >
                すべて既読
              </button>
            </div>

            <div className="admin-notify-list">
              {loading && items.length === 0 ? (
                <p className="admin-notify-empty">読み込み中...</p>
              ) : null}
              {error ? <p className="admin-notify-error">{error}</p> : null}
              {!loading && items.length === 0 ? (
                <p className="admin-notify-empty">通知はまだありません。</p>
              ) : null}
              {items.map((item) => {
                const meta = getNotificationTypeMeta(item.type);
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`admin-notify-item${item.isRead ? " is-read" : " is-unread"}`}
                    onClick={() => handleOpenItem(item)}
                  >
                    <p className="admin-notify-item-title">
                      <span aria-hidden>{meta.emoji}</span> {meta.label}
                    </p>
                    <p className="admin-notify-item-shop">
                      {getNotificationShopName(item)}
                    </p>
                    <p className="admin-notify-item-summary">
                      {getNotificationSummary(item)}
                    </p>
                    <p className="admin-notify-item-time">
                      {formatRelativeTimeJa(item.createdAt)}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="admin-notify-panel-footer">
              <Link
                href="/admin/notifications"
                className="admin-notify-history-link"
                onClick={() => setOpen(false)}
              >
                通知履歴を見る
              </Link>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
