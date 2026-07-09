"use client";

import { useState } from "react";
import {
  NotificationAreaSettings,
  useNotificationSettings,
} from "@/components/NotificationAreaSettings";

export default function NotificationSettingsPage() {
  const { settings, setSettings, loading, authenticated } = useNotificationSettings();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/notification-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(settings),
      });
      if (!response.ok) throw new Error("保存に失敗しました。");
      setMessage("通知設定を保存しました。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="h-48 animate-pulse rounded-2xl bg-white" />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="mx-auto max-w-md px-4 py-10">
        <div className="rounded-2xl border border-gold/25 bg-white p-6 text-center shadow-gold">
          <h1 className="font-serif text-xl font-semibold text-charcoal">
            通知設定
          </h1>
          <p className="mt-2 text-sm text-muted">
            通知設定はLINEログイン後に利用できます。
          </p>
          <a
            href="/api/line/login?redirect=/notification-settings"
            className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#06c755] px-5 text-sm font-semibold text-white"
          >
            LINEでログイン
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="font-serif text-2xl font-semibold text-charcoal">通知設定</h1>
      <p className="mt-2 text-sm text-muted">
        LINEログイン済みユーザー向けの通知設定です。
      </p>

      <div className="mt-5 space-y-4">
        <div className="space-y-3 rounded-2xl border border-gold/20 bg-white p-5 shadow-gold">
          <label className="flex items-center gap-3 text-sm text-charcoal">
            <input
              type="checkbox"
              checked={settings.notifyNewJobs}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  notifyNewJobs: event.target.checked,
                }))
              }
            />
            新着店舗通知
          </label>
          <label className="flex items-center gap-3 text-sm text-charcoal">
            <input
              type="checkbox"
              checked={settings.notifyPickupJobs}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  notifyPickupJobs: event.target.checked,
                }))
              }
            />
            PICK UP店舗通知
          </label>
          <label className="flex items-center gap-3 text-sm text-charcoal">
            <input
              type="checkbox"
              checked={settings.notifyFavoriteUpdates}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  notifyFavoriteUpdates: event.target.checked,
                }))
              }
            />
            お気に入り店舗の更新通知
          </label>
        </div>

        <NotificationAreaSettings settings={settings} onChange={setSettings} />
      </div>

      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-gradient-to-r from-gold to-gold-dark px-6 text-sm font-semibold text-white disabled:opacity-60"
      >
        {saving ? "保存中..." : "保存する"}
      </button>
      {message && <p className="mt-3 text-sm text-muted">{message}</p>}
    </div>
  );
}
