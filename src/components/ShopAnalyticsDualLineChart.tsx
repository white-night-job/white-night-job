"use client";

import { useMemo, useState } from "react";
import { useChartScrollToEnd } from "@/hooks/useChartScrollToEnd";
import type { MonthlyAnalyticsBucket } from "@/lib/job-analytics";

type SeriesKey = "impressions" | "detailClicks" | "lineClicks" | "phoneClicks";

type DualLineChartProps = {
  title: string;
  data: MonthlyAnalyticsBucket[];
  series: Array<{ key: SeriesKey; label: string; color: string }>;
};

const CHART_HEIGHT = 180;
const PADDING = { top: 12, right: 8, bottom: 40, left: 36 };

export function ShopAnalyticsDualLineChart({
  title,
  data,
  series,
}: DualLineChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const hasData = data.some((bucket) =>
    series.some((item) => bucket[item.key] > 0),
  );
  const chartWidth = Math.max(640, data.length * 56);
  const scrollKey = useMemo(
    () =>
      data
        .map((bucket) =>
          series.map((item) => `${item.key}:${bucket[item.key]}`).join(","),
        )
        .join("|"),
    [data, series],
  );
  const chartScrollRef = useChartScrollToEnd(hasData ? scrollKey : "");
  const innerWidth = chartWidth - PADDING.left - PADDING.right;
  const innerHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;

  const maxY = useMemo(() => {
    let max = 1;
    for (const bucket of data) {
      for (const item of series) {
        max = Math.max(max, bucket[item.key]);
      }
    }
    return max;
  }, [data, series]);

  const paths = useMemo(() => {
    return series.map((item) => {
      if (data.length === 0) return { key: item.key, d: "" };
      const d = data
        .map((bucket, index) => {
          const x = getPointX(index, data.length, innerWidth);
          const y = getPointY(bucket[item.key], innerHeight, maxY);
          return `${index === 0 ? "M" : "L"} ${x} ${y}`;
        })
        .join(" ");
      return { key: item.key, d, color: item.color };
    });
  }, [data, series, innerWidth, innerHeight, maxY]);

  const yTicks = useMemo(() => {
    if (maxY <= 1) return [0, 1];
    const step = maxY <= 5 ? 1 : Math.ceil(maxY / 4);
    const ticks: number[] = [];
    for (let value = 0; value <= maxY; value += step) ticks.push(value);
    if (ticks[ticks.length - 1] !== maxY) ticks.push(maxY);
    return ticks;
  }, [maxY]);

  const active = activeIndex !== null ? data[activeIndex] : null;
  const tooltipLeft = useMemo(() => {
    if (activeIndex === null) return 4;
    const anchor = getPointX(activeIndex, data.length, innerWidth);
    return Math.min(Math.max(anchor - 48, 4), chartWidth - 120);
  }, [activeIndex, chartWidth, data.length, innerWidth]);

  return (
    <section className="rounded-2xl border border-gold/25 bg-white p-4 shadow-gold sm:p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-charcoal">{title}</h3>
        <p className="mt-1 text-xs text-muted">直近12か月（日本時間）</p>
      </div>

      {!hasData ? (
        <div className="rounded-xl border border-gold/15 bg-ivory/30 px-3 py-4 text-center text-sm text-muted">
          直近12か月のデータはまだありません
        </div>
      ) : (
        <div>
          <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium">
            {series.map((item) => (
              <li
                key={item.key}
                className="inline-flex items-center gap-1.5 text-charcoal"
              >
                <span
                  className="inline-block h-0.5 w-5 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                {item.label}
              </li>
            ))}
          </ul>

          <div ref={chartScrollRef} className="overflow-x-auto pb-1">
            <div
              className="relative"
              style={{ width: chartWidth, minWidth: "100%" }}
            >
              {active && (
                <div
                  className="pointer-events-none absolute top-0 z-10 rounded-lg border border-gold/25 bg-white px-3 py-2 text-xs shadow-gold"
                  style={{ left: tooltipLeft }}
                >
                  <p className="font-semibold text-charcoal">{active.label}</p>
                  {series.map((item) => (
                    <p key={item.key} className="mt-1 text-muted">
                      {item.label}: {active[item.key].toLocaleString("ja-JP")}回
                    </p>
                  ))}
                </div>
              )}

              <svg
                width={chartWidth}
                height={CHART_HEIGHT}
                className="mt-10 block sm:mt-0"
                role="img"
                aria-label={title}
              >
                {yTicks.map((tick) => {
                  const y = getPointY(tick, innerHeight, maxY);
                  return (
                    <g key={tick}>
                      <line
                        x1={PADDING.left}
                        y1={y}
                        x2={PADDING.left + innerWidth}
                        y2={y}
                        stroke="rgba(201, 169, 98, 0.2)"
                        strokeWidth={1}
                      />
                      <text
                        x={PADDING.left - 6}
                        y={y + 4}
                        textAnchor="end"
                        className="fill-muted text-[10px]"
                      >
                        {tick}
                      </text>
                    </g>
                  );
                })}

                {paths.map((path) => (
                  <path
                    key={path.key}
                    d={path.d}
                    fill="none"
                    stroke={path.color}
                    strokeWidth={2.5}
                  />
                ))}

                {data.map((bucket, index) => {
                  const x = getPointX(index, data.length, innerWidth);
                  const isActive = activeIndex === index;
                  const hitWidth =
                    data.length > 1 ? innerWidth / (data.length - 1) : innerWidth;

                  return (
                    <g key={bucket.monthKey}>
                      <rect
                        x={x - hitWidth / 2}
                        y={PADDING.top}
                        width={hitWidth}
                        height={innerHeight}
                        fill="transparent"
                        className="cursor-pointer"
                        onMouseEnter={() => setActiveIndex(index)}
                        onMouseLeave={() =>
                          setActiveIndex((current) =>
                            current === index ? null : current,
                          )
                        }
                        onFocus={() => setActiveIndex(index)}
                        onBlur={() => setActiveIndex(null)}
                        onClick={() =>
                          setActiveIndex((current) =>
                            current === index ? null : index,
                          )
                        }
                      />
                      {isActive && (
                        <line
                          x1={x}
                          y1={PADDING.top}
                          x2={x}
                          y2={PADDING.top + innerHeight}
                          stroke="rgba(201, 169, 98, 0.45)"
                          strokeWidth={1}
                          strokeDasharray="3 3"
                        />
                      )}
                      <text
                        x={x}
                        y={CHART_HEIGHT - 8}
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
            月をタップ・ホバーすると数値が確認できます
          </p>
        </div>
      )}
    </section>
  );
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
