"use client";

import { useEffect, useState } from "react";
import { NOTIFICATION_AREA_OPTIONS } from "@/lib/notification-areas";

type Settings = {
  notifyNewJobs: boolean;
  notifyPickupJobs: boolean;
  notifyFavoriteUpdates: boolean;
  notificationAreas: string[];
};

export function NotificationAreaSettings({
  settings,
  onChange,
}: {
  settings: Settings;
  onChange: (next: Settings) => void;
}) {
  function toggleArea(area: string) {
    onChange({
      ...settings,
      notificationAreas: settings.notificationAreas.includes(area)
        ? settings.notificationAreas.filter((item) => item !== area)
        : [...settings.notificationAreas, area],
    });
  }

  return (
    <div className="rounded-2xl border border-gold/20 bg-white p-4 shadow-gold sm:p-5">
      <p className="text-sm font-semibold text-charcoal">通知エリア（複数選択可）</p>
      <p className="mt-1 text-xs text-muted">
        選択したエリアの店舗情報をLINEで受け取れます。
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {NOTIFICATION_AREA_OPTIONS.map((area) => (
          <label
            key={area}
            className="inline-flex items-center gap-2 rounded-full border border-gold/25 bg-ivory/50 px-3 py-2 text-sm text-charcoal"
          >
            <input
              type="checkbox"
              checked={settings.notificationAreas.includes(area)}
              onChange={() => toggleArea(area)}
            />
            {area}
          </label>
        ))}
      </div>
    </div>
  );
}

export function useNotificationSettings() {
  const [settings, setSettings] = useState<Settings>({
    notifyNewJobs: true,
    notifyPickupJobs: true,
    notifyFavoriteUpdates: true,
    notificationAreas: [],
  });
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
        return (await response.json()) as Settings;
      })
      .then((data) => {
        if (data) {
          setSettings({
            notifyNewJobs: data.notifyNewJobs,
            notifyPickupJobs: data.notifyPickupJobs,
            notifyFavoriteUpdates: data.notifyFavoriteUpdates,
            notificationAreas: data.notificationAreas ?? [],
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return { settings, setSettings, loading, authenticated };
}
