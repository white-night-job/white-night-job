"use client";

import { useEffect, useState } from "react";
import { NOTIFICATION_AREA_OPTIONS } from "@/lib/notification-areas";
import {
  MIN_HOURLY_WAGE_OPTIONS,
  NOTIFICATION_JOB_TYPE_OPTIONS,
} from "@/lib/notification-preferences";

export type NotificationSettingsState = {
  notifyNewJobs: boolean;
  notifyPickupJobs: boolean;
  notifyFavoriteUpdates: boolean;
  notificationAreas: string[];
  notificationJobTypes: string[];
  minHourlyWage: number;
};

export const EMPTY_NOTIFICATION_SETTINGS: NotificationSettingsState = {
  notifyNewJobs: true,
  notifyPickupJobs: true,
  notifyFavoriteUpdates: true,
  notificationAreas: [],
  notificationJobTypes: [],
  minHourlyWage: 0,
};

export function NotificationPreferenceForm({
  settings,
  onChange,
}: {
  settings: NotificationSettingsState;
  onChange: (next: NotificationSettingsState) => void;
}) {
  function toggleArea(area: string) {
    onChange({
      ...settings,
      notificationAreas: settings.notificationAreas.includes(area)
        ? settings.notificationAreas.filter((item) => item !== area)
        : [...settings.notificationAreas, area],
    });
  }

  function toggleJobType(jobType: string) {
    onChange({
      ...settings,
      notificationJobTypes: settings.notificationJobTypes.includes(jobType)
        ? settings.notificationJobTypes.filter((item) => item !== jobType)
        : [...settings.notificationJobTypes, jobType],
    });
  }

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <p className="text-sm font-semibold text-charcoal">通知設定</p>
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
      </div>

      <div>
        <p className="text-sm font-semibold text-charcoal">地域（複数選択可）</p>
        <p className="mt-1 text-xs text-muted">
          未選択の場合はすべての地域が対象になります。
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {NOTIFICATION_AREA_OPTIONS.filter((area) => area !== "その他").map(
            (area) => (
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
            ),
          )}
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-charcoal">職種（複数選択可）</p>
        <p className="mt-1 text-xs text-muted">
          未選択の場合はすべての職種が対象になります。
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {NOTIFICATION_JOB_TYPE_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="inline-flex items-center gap-2 rounded-full border border-gold/25 bg-ivory/50 px-3 py-2 text-sm text-charcoal"
            >
              <input
                type="checkbox"
                checked={settings.notificationJobTypes.includes(option.value)}
                onChange={() => toggleJobType(option.value)}
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-charcoal">最低時給</p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <label className="inline-flex items-center gap-2 rounded-xl border border-gold/25 bg-ivory/50 px-3 py-2 text-sm text-charcoal">
            <input
              type="radio"
              name="minHourlyWage"
              checked={settings.minHourlyWage === 0}
              onChange={() => onChange({ ...settings, minHourlyWage: 0 })}
            />
            指定なし
          </label>
          {MIN_HOURLY_WAGE_OPTIONS.map((wage) => (
            <label
              key={wage}
              className="inline-flex items-center gap-2 rounded-xl border border-gold/25 bg-ivory/50 px-3 py-2 text-sm text-charcoal"
            >
              <input
                type="radio"
                name="minHourlyWage"
                checked={settings.minHourlyWage === wage}
                onChange={() => onChange({ ...settings, minHourlyWage: wage })}
              />
              {wage.toLocaleString("ja-JP")}円〜
            </label>
          ))}
        </div>
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
            notificationAreas: data.notificationAreas ?? [],
            notificationJobTypes: data.notificationJobTypes ?? [],
            minHourlyWage: Number(data.minHourlyWage ?? 0),
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return { settings, setSettings, loading, authenticated };
}
