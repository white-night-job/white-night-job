"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  MetricAvailability,
  UserActivityEvent,
  UserActivityPeriod,
  UserActivityShopStat,
} from "@/lib/admin-user-activity";

type Summary = {
  siteVisits: MetricAvailability;
  jobDetailViews: MetricAvailability;
  lineClicks: MetricAvailability;
  phoneClicks: MetricAvailability;
  diagnosisUses: MetricAvailability;
  aiChatUses: MetricAvailability;
  blackReports: MetricAvailability;
};

type ActivityResponse = {
  message?: string;
  period: {
    key: UserActivityPeriod;
    label: string;
    startIso: string;
    endIso: string;
  };
  summary: Summary;
  shopStats: UserActivityShopStat[];
  recentEvents: UserActivityEvent[];
};

const PERIOD_OPTIONS: Array<{ value: UserActivityPeriod; label: string }> = [
  { value: "today", label: "今日" },
  { value: "last_7_days", label: "過去7日" },
  { value: "last_30_days", label: "過去30日" },
  { value: "this_month", label: "今月" },
  { value: "last_month", label: "先月" },
  { value: "custom", label: "期間指定" },
];

const SUMMARY_CARDS: Array<{
  key: keyof Summary;
  label: string;
}> = [
  { key: "siteVisits", label: "サイト訪問数" },
  { key: "jobDetailViews", label: "求人詳細の閲覧数" },
  { key: "lineClicks", label: "LINE応募クリック数" },
  { key: "phoneClicks", label: "電話応募クリック数" },
  { key: "diagnosisUses", label: "職種診断の利用回数" },
  { key: "aiChatUses", label: "AI相談の利用回数" },
  { key: "blackReports", label: "ブラック店報告の件数" },
];

function formatDateTime(value: string) {
  try {
    return new Intl.DateTimeFormat("ja-JP", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function MetricCard({
  label,
  metric,
}: {
  label: string;
  metric: MetricAvailability;
}) {
  return (
    <div className="rounded-2xl border border-gold/25 bg-white p-4 shadow-gold sm:p-5">
      <p className="text-sm font-medium text-muted">{label}</p>
      {metric.available ? (
        <>
          <p className="mt-2 font-serif text-3xl font-semibold text-charcoal">
            {(metric.value ?? 0).toLocaleString("ja-JP")}
          </p>
          {metric.note ? (
            <p className="mt-2 text-xs text-muted">{metric.note}</p>
          ) : null}
        </>
      ) : (
        <p className="mt-3 text-sm font-medium text-gold-dark">
          {metric.note ?? "現在取得していません"}
        </p>
      )}
    </div>
  );
}

export function UserActivityPanel() {
  const [period, setPeriod] = useState<UserActivityPeriod>("last_7_days");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<ActivityResponse | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ period });
      if (period === "custom") {
        if (from) params.set("from", from);
        if (to) params.set("to", to);
      }
      const response = await fetch(
        `/api/admin/user-activity?${params.toString()}`,
        { cache: "no-store", credentials: "include" },
      );
      const body = (await response.json()) as ActivityResponse;
      if (!response.ok) {
        throw new Error(body.message ?? "取得に失敗しました。");
      }
      setData(body);
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : "取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  }, [period, from, to]);

  useEffect(() => {
    if (period === "custom" && (!from || !to)) {
      setLoading(false);
      setData(null);
      setError("");
      return;
    }
    void load();
  }, [load, period, from, to]);

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-gold/25 bg-white p-4 shadow-gold sm:p-5">
        <h2 className="text-base font-semibold text-charcoal">期間</h2>
        <p className="mt-1 text-xs text-muted">
          匿名の利用状況を集計します。個人を特定する情報は表示しません。
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {PERIOD_OPTIONS.map((option) => {
            const selected = period === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setPeriod(option.value)}
                aria-pressed={selected}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                  selected
                    ? "border-gold bg-gradient-to-r from-gold to-gold-dark text-white"
                    : "border-gold/35 bg-ivory text-gold-dark hover:bg-ivory/80"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        {period === "custom" ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="activity-from" className="mb-1 block text-xs text-muted">
                開始日
              </label>
              <input
                id="activity-from"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full rounded-xl border border-gold/30 bg-ivory px-3 py-2 text-sm outline-none focus:border-gold"
              />
            </div>
            <div>
              <label htmlFor="activity-to" className="mb-1 block text-xs text-muted">
                終了日
              </label>
              <input
                id="activity-to"
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full rounded-xl border border-gold/30 bg-ivory px-3 py-2 text-sm outline-none focus:border-gold"
              />
            </div>
          </div>
        ) : null}
        {data?.period ? (
          <p className="mt-3 text-xs text-muted">表示期間: {data.period.label}</p>
        ) : null}
      </section>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {period === "custom" && (!from || !to) ? (
        <p className="rounded-xl border border-dashed border-gold/30 bg-white px-4 py-8 text-center text-sm text-muted">
          開始日と終了日を選択してください。
        </p>
      ) : loading && !data ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 7 }).map((_, index) => (
            <div
              key={index}
              className="h-28 animate-pulse rounded-2xl border border-gold/20 bg-white"
            />
          ))}
        </div>
      ) : data ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {SUMMARY_CARDS.map((card) => (
              <MetricCard
                key={card.key}
                label={card.label}
                metric={data.summary[card.key]}
              />
            ))}
          </section>

          <section className="rounded-2xl border border-gold/25 bg-white p-4 shadow-gold sm:p-5">
            <h2 className="text-base font-semibold text-charcoal">
              店舗別の閲覧・応募クリック
            </h2>
            <p className="mt-1 text-xs text-muted">
              期間内に閲覧または応募クリックがあった店舗です。
            </p>
            {data.shopStats.length === 0 ? (
              <p className="mt-4 text-sm text-muted">該当データがありません。</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gold/20 text-xs text-muted">
                      <th className="px-2 py-2 font-medium">店舗名</th>
                      <th className="px-2 py-2 font-medium">エリア</th>
                      <th className="px-2 py-2 font-medium">閲覧回数</th>
                      <th className="px-2 py-2 font-medium">応募クリック数</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.shopStats.map((row) => (
                      <tr
                        key={row.jobId}
                        className="border-b border-gold/10 text-charcoal"
                      >
                        <td className="px-2 py-2.5 break-words font-medium">
                          {row.shopName}
                        </td>
                        <td className="px-2 py-2.5 text-muted">
                          {row.district || row.area || "—"}
                        </td>
                        <td className="px-2 py-2.5">
                          {row.views.toLocaleString("ja-JP")}
                        </td>
                        <td className="px-2 py-2.5">
                          {row.applyClicks.toLocaleString("ja-JP")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-gold/25 bg-white p-4 shadow-gold sm:p-5">
            <h2 className="text-base font-semibold text-charcoal">
              最近の利用状況
            </h2>
            <p className="mt-1 text-xs text-muted">
              利用日時・機能・店舗・端末種別（取得できる場合）を表示します。
            </p>
            {data.recentEvents.length === 0 ? (
              <p className="mt-4 text-sm text-muted">該当データがありません。</p>
            ) : (
              <ul className="mt-4 space-y-2">
                {data.recentEvents.map((event) => (
                  <li
                    key={event.id}
                    className="rounded-xl border border-gold/15 bg-ivory/40 px-3 py-3 text-sm"
                  >
                    <p className="font-medium text-charcoal">{event.feature}</p>
                    <dl className="mt-2 grid gap-1 text-xs text-muted sm:grid-cols-2">
                      <div className="flex gap-2">
                        <dt className="shrink-0">利用日時</dt>
                        <dd>{formatDateTime(event.at)}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="shrink-0">店舗名</dt>
                        <dd className="break-words">
                          {event.shopName?.trim() || "—"}
                        </dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="shrink-0">エリア</dt>
                        <dd>{event.district || event.area || "—"}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="shrink-0">端末種別</dt>
                        <dd>
                          {event.deviceType ?? "現在取得していません"}
                        </dd>
                      </div>
                    </dl>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
