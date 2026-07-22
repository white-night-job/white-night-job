"use client";

import { useCallback, useEffect, useState } from "react";
import { ShopAnalyticsDualLineChart } from "@/components/ShopAnalyticsDualLineChart";
import type {
  AnalyticsCounts,
  AnalyticsPeriod,
  MonthlyAnalyticsBucket,
} from "@/lib/job-analytics";

const PERIOD_OPTIONS: Array<{ value: AnalyticsPeriod; label: string }> = [
  { value: "this_month", label: "今月" },
  { value: "last_month", label: "先月" },
  { value: "last_3_months", label: "直近3か月" },
  { value: "last_6_months", label: "直近6か月" },
  { value: "last_12_months", label: "直近12か月" },
];

type AnalyticsPayload = {
  period: AnalyticsPeriod;
  periodLabel: string;
  current: AnalyticsCounts;
  changes: Record<string, number | null> | null;
  monthly: MonthlyAnalyticsBucket[];
  message?: string;
};

function formatChange(value: number | null | undefined): string | null {
  if (value == null) return null;
  const sign = value > 0 ? "+" : "";
  return `前月比 ${sign}${value}%`;
}

function StatCard({
  label,
  value,
  change,
}: {
  label: string;
  value: number;
  change?: number | null;
}) {
  const changeText = formatChange(change);
  return (
    <div className="rounded-xl border border-gold/20 bg-ivory/50 p-3 sm:p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-serif text-xl font-semibold text-charcoal sm:text-2xl">
        {value.toLocaleString("ja-JP")}
        <span className="ml-1 text-sm font-sans font-medium text-muted">回</span>
      </p>
      {changeText && (
        <p
          className={`mt-1 text-xs font-medium ${
            (change ?? 0) >= 0 ? "text-[#047a3b]" : "text-red-600"
          }`}
        >
          {changeText}
        </p>
      )}
    </div>
  );
}

export function ShopAnalyticsSection() {
  const [period, setPeriod] = useState<AnalyticsPeriod>("this_month");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<AnalyticsPayload | null>(null);

  const load = useCallback(async (nextPeriod: AnalyticsPeriod) => {
    setLoading(true);
    setError("");
    console.time("shop-dashboard:analytics-fetch");
    try {
      const response = await fetch(
        `/api/shop-dashboard/analytics?period=${nextPeriod}`,
        { cache: "no-store", credentials: "include" },
      );
      const body = (await response.json()) as AnalyticsPayload;
      if (!response.ok) {
        throw new Error(body.message ?? "分析データの取得に失敗しました。");
      }
      setData(body);
      console.timeEnd("shop-dashboard:analytics-fetch");
    } catch (err) {
      console.timeEnd("shop-dashboard:analytics-fetch");
      setData(null);
      setError(err instanceof Error ? err.message : "分析データの取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(period);
  }, [load, period]);

  const current = data?.current;
  const changes = data?.changes;
  const showMom = period === "this_month";

  return (
    <section className="mb-8 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-serif text-lg font-semibold text-charcoal">
            アクセス・応募分析
          </h2>
          <p className="mt-1 text-xs text-muted">
            表示回数は一覧での露出、クリック回数は店舗詳細の開封です（別集計）。
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PERIOD_OPTIONS.map((option) => {
            const active = period === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setPeriod(option.value)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  active
                    ? "bg-charcoal text-white"
                    : "border border-gold/30 bg-white text-gold-dark"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {loading && (
        <div className="h-40 animate-pulse rounded-2xl border border-gold/15 bg-white" />
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && current && (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard
              label={`${data?.periodLabel ?? ""}の表示回数`}
              value={current.impressions}
              change={showMom ? changes?.impressions : null}
            />
            <StatCard
              label={`${data?.periodLabel ?? ""}の店舗詳細クリック`}
              value={current.detailClicks}
              change={showMom ? changes?.detailClicks : null}
            />
            <StatCard
              label={`${data?.periodLabel ?? ""}のLINE応募クリック`}
              value={current.lineClicks}
              change={showMom ? changes?.lineClicks : null}
            />
            <StatCard
              label={`${data?.periodLabel ?? ""}の電話応募クリック`}
              value={current.phoneClicks}
              change={showMom ? changes?.phoneClicks : null}
            />
            <StatCard
              label={`${data?.periodLabel ?? ""}の応募クリック合計`}
              value={current.applyTotal}
              change={showMom ? changes?.applyTotal : null}
            />
          </div>

          <ShopAnalyticsDualLineChart
            title="応募クリック数"
            data={data?.monthly ?? []}
            series={[
              { key: "lineClicks", label: "LINE応募クリック", color: "#047a3b" },
              { key: "phoneClicks", label: "電話応募クリック", color: "#b45309" },
            ]}
          />
        </>
      )}
    </section>
  );
}
