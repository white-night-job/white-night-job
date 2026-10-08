"use client";

import { useEffect, useState } from "react";

export type NotificationSettingsState = {
  notifyNewJobs: boolean;
  notifyPickupJobs: boolean;
  notifyFavoriteUpdates: boolean;
  notifyDailyPickup: boolean;
};

export const EMPTY_NOTIFICATION_SETTINGS: NotificationSettingsState = {
  notifyNewJobs: true,
  notifyPickupJobs: true,
  notifyFavoriteUpdates: true,
  notifyDailyPickup: true,
};

export function NotificationPreferenceForm({
  settings,
  onChange,
  hideHeading = false,
}: {
  settings: NotificationSettingsState;
  onChange: (next: NotificationSettingsState) => void;
  /** マイページのアコーディオン見出しと重複する場合に隠す */
  hideHeading?: boolean;
}) {
  return (
    <div className="space-y-3">
      {!hideHeading && (
        <p className="text-sm font-semibold text-charcoal">通知設定</p>
      )}
      <label className="flex items-center justify-between gap-3 rounded-xl border border-gold/20 bg-ivory/40 px-3 py-3 text-sm text-charcoal">
        <span>新着求人通知</span>
        <input
          type="checkbox"
          checked={settings.notifyNewJobs}
          onChange={(event) =>
            onChange({ ...settings, notifyNewJobs: event.target.checked })
          }
        />
      </label>
      <label className="flex items-center justify-between gap-3 rounded-xl border border-gold/20 bg-ivory/40 px-3 py-3 text-sm text-charcoal">
        <span>お気に入り店舗通知</span>
        <input
          type="checkbox"
          checked={settings.notifyFavoriteUpdates}
          onChange={(event) =>
            onChange({
              ...settings,
              notifyFavoriteUpdates: event.target.checked,
            })
          }
        />
      </label>
      <label className="flex items-center justify-between gap-3 rounded-xl border border-gold/20 bg-ivory/40 px-3 py-3 text-sm text-charcoal">
        <span>PickUp店舗通知</span>
        <input
          type="checkbox"
          checked={settings.notifyPickupJobs}
          onChange={(event) =>
            onChange({ ...settings, notifyPickupJobs: event.target.checked })
          }
        />
      </label>
      <div className="rounded-xl border border-gold/20 bg-ivory/40 px-3 py-3">
        <label className="flex items-center justify-between gap-3 text-sm text-charcoal">
          <span>PickUp店舗の毎日通知</span>
          <input
            type="checkbox"
            checked={settings.notifyDailyPickup}
            onChange={(event) =>
              onChange({
                ...settings,
                notifyDailyPickup: event.target.checked,
              })
            }
          />
        </label>
        <p className="mt-2 text-xs leading-relaxed text-muted">
          希望エリアのおすすめPickUp店舗を、毎日20時に1店舗お届けします。
        </p>
      </div>
    </div>
  );
}

/** @deprecated Use NotificationPreferenceForm */
export function NotificationAreaSettings({
  settings,
  onChange,
}: {
  settings: NotificationSettingsState;
  onChange: (next: NotificationSettingsState) => void;
}) {
  return <NotificationPreferenceForm settings={settings} onChange={onChange} />;
}

export function useNotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettingsState>(
    EMPTY_NOTIFICATION_SETTINGS,
  );
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(true);

  useEffect(() => {
    fetch("/api/notification-settings", {
      cache: "no-store",
      credentials: "include",
    })
      .then(async (response) => {
        if (response.status === 401) {
          setAuthenticated(false);
          return null;
        }
        return (await response.json()) as NotificationSettingsState;
      })
      .then((data) => {
        if (data) {
          setSettings({
            notifyNewJobs: data.notifyNewJobs,
            notifyPickupJobs: data.notifyPickupJobs,
            notifyFavoriteUpdates: data.notifyFavoriteUpdates,
            notifyDailyPickup: data.notifyDailyPickup ?? false,
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return { settings, setSettings, loading, authenticated };
}
