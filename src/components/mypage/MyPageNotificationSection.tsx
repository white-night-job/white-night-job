"use client";

import { useState } from "react";
import {
  EMPTY_NOTIFICATION_SETTINGS,
  NotificationPreferenceForm,
  type NotificationSettingsState,
} from "@/components/NotificationAreaSettings";
import { MyPageSectionSkeleton } from "@/components/mypage/MyPageSkeletons";
import { useMyPageSection } from "@/components/mypage/useMyPageSection";

function parseSettings(raw: unknown): NotificationSettingsState {
  const payload = (raw ?? {}) as Partial<NotificationSettingsState>;
  return {
    notifyNewJobs: Boolean(payload.notifyNewJobs),
    notifyPickupJobs: Boolean(payload.notifyPickupJobs),
    notifyFavoriteUpdates: Boolean(payload.notifyFavoriteUpdates),
    notifyDailyPickup: Boolean(payload.notifyDailyPickup),
    notificationAreas: Array.isArray(payload.notificationAreas)
      ? payload.notificationAreas
      : [],
    notificationJobTypes: Array.isArray(payload.notificationJobTypes)
      ? payload.notificationJobTypes
      : [],
    minHourlyWage: Number(payload.minHourlyWage ?? 0) || 0,
  };
}

export function MyPageNotificationSection() {
  const { data, setData, status } = useMyPageSection<NotificationSettingsState>({
    cacheKey: "mypage:notification-settings",
    url: "/api/notification-settings",
    parse: parseSettings,
    fallback: EMPTY_NOTIFICATION_SETTINGS,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function saveSettings() {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/notification-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("保存に失敗しました。");
      setMessage("通知設定を保存しました。");
    } catch (error) {
      console.error("[mypage] settings save failed:", error);
      setMessage("通知設定の保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  }

  if (status === "loading") {
    return (
      <section className="mt-5">
        <MyPageSectionSkeleton height="h-48" />
      </section>
    );
  }

  return (
    <section className="mt-5 rounded-2xl border border-gold/20 bg-white p-5 shadow-gold">
      {status === "error" && (
        <p className="mb-3 text-sm text-muted">
          通知設定を読み込めませんでした。保存すると現在の内容で上書きされます。
        </p>
      )}
      <NotificationPreferenceForm settings={data} onChange={setData} />
      <button
        type="button"
        onClick={() => void saveSettings()}
        disabled={saving}
        className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-gradient-to-r from-gold to-gold-dark px-4 text-sm font-semibold text-white disabled:opacity-60"
      >
        {saving ? "保存中..." : "通知設定を保存"}
      </button>
      {message && <p className="mt-2 text-sm text-muted">{message}</p>}
    </section>
  );
}
