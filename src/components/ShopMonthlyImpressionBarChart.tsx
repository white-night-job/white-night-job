"use client";

import { useMemo } from "react";
import { useChartScrollToEnd } from "@/hooks/useChartScrollToEnd";
import type { MonthlyAnalyticsBucket } from "@/lib/job-analytics";

type ShopMonthlyImpressionBarChartProps = {
  data: MonthlyAnalyticsBucket[];
};

const BAR_COLOR = "#c9a962";
const CHART_HEIGHT = 200;
const PADDING = { top: 28, right: 12, bottom: 36, left: 12 };
const BAR_SLOT = 52;

function formatCount(value: number): string {
  if (value >= 10_000) {
    const man = value / 10_000;
    const text =
      man >= 10 ? String(Math.round(man)) : man.toFixed(1).replace(/\.0$/, "");
    return `${text}万`;
  }
  return value.toLocaleString("ja-JP");
}

export function ShopMonthlyImpressionBarChart({
  data,
}: ShopMonthlyImpressionBarChartProps) {
  const hasData = data.some((bucket) => bucket.impressions > 0);
  const total = useMemo(
    () => data.reduce((sum, bucket) => sum + bucket.impressions, 0),
    [data],
  );

  const chartWidth = Math.max(560, data.length * BAR_SLOT + PADDING.left + PADDING.right);
  const scrollKey = useMemo(
    () => data.map((bucket) => `${bucket.monthKey}:${bucket.impressions}`).join("|"),
    [data],
  );
  const chartScrollRef = useChartScrollToEnd(hasData ? scrollKey : "");

  const innerWidth = chartWidth - PADDING.left - PADDING.right;
  const innerHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;
  const maxY = useMemo(
    () => Math.max(...data.map((bucket) => bucket.impressions), 1),
    [data],
  );

  const barWidth = Math.min(
    28,
    data.length > 0 ? Math.max(12, (innerWidth / data.length) * 0.55) : 28,
  );

  return (
    <section className="rounded-2xl border border-gold/25 bg-white p-4 shadow-gold sm:p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-charcoal">
          表示回数の月別推移
        </h3>
        <p className="mt-1 text-xs text-muted">
          直近12か月（同一端末・同一求人は3分以内1回／管理・プレビュー除外）
        </p>
      </div>

      {!hasData ? (
        <div className="rounded-xl border border-gold/15 bg-ivory/30 px-3 py-4 text-center text-sm text-muted">
          直近12か月の表示はまだありません
        </div>
      ) : (
        <div className="flex items-stretch gap-3">
          {/* Fixed total — outside horizontal scroll */}
          <div className="flex w-[5.5rem] shrink-0 flex-col justify-center rounded-xl border border-gold/25 bg-ivory/60 px-2.5 py-3 sm:w-28 sm:px-3">
            <p className="text-[10px] font-medium text-muted sm:text-xs">表示回数</p>
            <p className="mt-1 font-serif text-lg font-semibold leading-tight text-charcoal sm:text-2xl">
              {total.toLocaleString("ja-JP")}
              <span className="ml-0.5 text-xs font-sans font-medium text-muted sm:text-sm">
                回
              </span>
            </p>
            <p className="mt-1 text-[10px] text-muted">直近12か月計</p>
          </div>

          {/* Chart body scrolls independently */}
          <div className="min-w-0 flex-1">
            <div ref={chartScrollRef} className="overflow-x-auto pb-1">
              <div style={{ width: chartWidth, minWidth: "100%" }}>
                <svg
                  width={chartWidth}
                  height={CHART_HEIGHT}
                  className="block"
                  role="img"
                  aria-label="表示回数の月別棒グラフ"
                >
                  {data.map((bucket, index) => {
                    const slot = innerWidth / Math.max(data.length, 1);
                    const x = PADDING.left + slot * index + slot / 2;
                    const barHeight =
                      maxY > 0
                        ? (bucket.impressions / maxY) * innerHeight
                        : 0;
                    const y = PADDING.top + innerHeight - barHeight;
                    const label = formatCount(bucket.impressions);

                    return (
                      <g key={bucket.monthKey}>
                        <rect
                          x={x - barWidth / 2}
                          y={y}
                          width={barWidth}
                          height={Math.max(barHeight, bucket.impressions > 0 ? 2 : 0)}
                          rx={3}
                          fill={BAR_COLOR}
                          opacity={0.92}
                        />
                        <text
                          x={x}
                          y={Math.max(12, y - 6)}
                          textAnchor="middle"
                          className="fill-charcoal text-[9px] font-semibold sm:text-[10px]"
                        >
                          {bucket.impressions > 0 ? label : "0"}
                        </text>
                        <text
                          x={x}
                          y={CHART_HEIGHT - 10}
                          textAnchor="middle"
                          className="fill-muted text-[9px]"
                        >
                          {bucket.label.replace(/^\d{4}年/, "")}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
            <p className="mt-2 text-[10px] text-muted">
              グラフは横にスクロールできます（左側の合計は固定）
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
