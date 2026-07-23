"use client";

import { useMemo } from "react";
import { useChartScrollToEnd } from "@/hooks/useChartScrollToEnd";
import type { MonthlyAnalyticsBucket } from "@/lib/job-analytics";

type ShopMonthlyImpressionBarChartProps = {
  data: MonthlyAnalyticsBucket[];
};

const LINE_COLOR = "#c9a962";
const CHART_HEIGHT = 200;
const AXIS_WIDTH = 40;
const PADDING = { top: 28, right: 16, bottom: 36, left: 8 };
const MONTH_SLOT = 64;

function formatCount(value: number): string {
  if (value >= 10_000) {
    const man = value / 10_000;
    const text =
      man >= 10 ? String(Math.round(man)) : man.toFixed(1).replace(/\.0$/, "");
    return `${text}万`;
  }
  return value.toLocaleString("ja-JP");
}

function getPointX(index: number, dataLength: number, innerWidth: number): number {
  return (
    PADDING.left +
    (dataLength === 1 ? innerWidth / 2 : (index / (dataLength - 1)) * innerWidth)
  );
}

function getPointY(value: number, innerHeight: number, maxY: number): number {
  return PADDING.top + innerHeight - (value / maxY) * innerHeight;
}

function buildYTicks(maxY: number): number[] {
  if (maxY <= 1) return [0, 1];
  if (maxY <= 5) {
    return Array.from({ length: maxY + 1 }, (_, i) => i);
  }
  const rough = maxY / 4;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const normalized = rough / magnitude;
  const stepBase =
    normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  const step = stepBase * magnitude;
  const ticks: number[] = [];
  for (let value = 0; value <= maxY; value += step) {
    ticks.push(value);
  }
  if (ticks[ticks.length - 1] !== maxY) ticks.push(maxY);
  return ticks;
}

/**
 * Impression line chart with a fixed Y-axis (outside scroll) and a
 * horizontally scrollable plot (line, points, month labels, values).
 */
export function ShopMonthlyImpressionBarChart({
  data,
}: ShopMonthlyImpressionBarChartProps) {
  const hasData = data.some((bucket) => bucket.impressions > 0);

  const chartWidth = Math.max(
    560,
    data.length * MONTH_SLOT + PADDING.left + PADDING.right,
  );
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
  const yTicks = useMemo(() => buildYTicks(maxY), [maxY]);

  const linePath = useMemo(() => {
    if (data.length === 0) return "";
    return data
      .map((bucket, index) => {
        const x = getPointX(index, data.length, innerWidth);
        const y = getPointY(bucket.impressions, innerHeight, maxY);
        return `${index === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
  }, [data, innerWidth, innerHeight, maxY]);

  return (
    <section className="rounded-2xl border border-gold/25 bg-white p-4 shadow-gold sm:p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-charcoal">
          表示回数の月別推移
        </h3>
        <p className="mt-1 text-xs text-muted">
          直近12か月（連続表示・管理・プレビュー除外）
        </p>
      </div>

      {!hasData ? (
        <div className="rounded-xl border border-gold/15 bg-ivory/30 px-3 py-4 text-center text-sm text-muted">
          直近12か月の表示はまだありません
        </div>
      ) : (
        <div>
          <div className="flex items-stretch">
            {/* Fixed Y-axis labels — outside horizontal scroll */}
            <svg
              width={AXIS_WIDTH}
              height={CHART_HEIGHT}
              className="shrink-0"
              aria-hidden
            >
              {yTicks.map((tick) => {
                const y = getPointY(tick, innerHeight, maxY);
                return (
                  <text
                    key={`axis-${tick}`}
                    x={AXIS_WIDTH - 6}
                    y={y + 3}
                    textAnchor="end"
                    className="fill-muted text-[10px]"
                  >
                    {tick.toLocaleString("ja-JP")}
                  </text>
                );
              })}
            </svg>

            {/* Scrollable plot */}
            <div className="min-w-0 flex-1">
              <div ref={chartScrollRef} className="overflow-x-auto pb-1">
                <div style={{ width: chartWidth, minWidth: "100%" }}>
                  <svg
                    width={chartWidth}
                    height={CHART_HEIGHT}
                    className="block"
                    role="img"
                    aria-label="表示回数の月別折れ線グラフ"
                  >
                    {yTicks.map((tick) => {
                      const y = getPointY(tick, innerHeight, maxY);
                      return (
                        <line
                          key={`grid-${tick}`}
                          x1={PADDING.left}
                          y1={y}
                          x2={PADDING.left + innerWidth}
                          y2={y}
                          stroke="rgba(201, 169, 98, 0.2)"
                          strokeWidth={1}
                        />
                      );
                    })}

                    <path
                      d={linePath}
                      fill="none"
                      stroke={LINE_COLOR}
                      strokeWidth={2.5}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />

                    {data.map((bucket, index) => {
                      const x = getPointX(index, data.length, innerWidth);
                      const y = getPointY(bucket.impressions, innerHeight, maxY);
                      const valueLabel = formatCount(bucket.impressions);

                      return (
                        <g key={bucket.monthKey}>
                          <circle
                            cx={x}
                            cy={y}
                            r={4}
                            fill={LINE_COLOR}
                            stroke="#fff"
                            strokeWidth={1.5}
                          />
                          <text
                            x={x}
                            y={Math.max(12, y - 10)}
                            textAnchor="middle"
                            className="fill-charcoal text-[9px] font-semibold sm:text-[10px]"
                          >
                            {valueLabel}
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
            </div>
          </div>
          <p className="mt-2 text-[10px] text-muted">
            グラフは横にスクロールできます（左側の目盛りは固定）
          </p>
        </div>
      )}
    </section>
  );
}
