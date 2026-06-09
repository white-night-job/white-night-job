"use client";

import { useMemo, useState } from "react";
import type { DailyViewBucket } from "@/lib/job-views";

type DailyViewLineChartProps = {
  data: DailyViewBucket[];
};

const VIEW_COLOR = "#4b5563";
const CHART_HEIGHT = 168;
const PADDING = { top: 12, right: 8, bottom: 32, left: 36 };

export function DailyViewLineChart({ data }: DailyViewLineChartProps) {
  const [activeDay, setActiveDay] = useState<number | null>(null);

  const hasViews = data.some((bucket) => bucket.views > 0);
  const chartWidth = Math.max(320, data.length * 18);
  const innerWidth = chartWidth - PADDING.left - PADDING.right;
  const innerHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;

  const maxY = useMemo(
    () => Math.max(...data.map((bucket) => bucket.views), 1),
    [data],
  );

  const viewPath = useMemo(() => {
    if (data.length === 0) return "";

    return data
      .map((bucket, index) => {
        const x =
          data.length === 1
            ? innerWidth / 2
            : (index / (data.length - 1)) * innerWidth;
        const y = innerHeight - (bucket.views / maxY) * innerHeight;
        return `${index === 0 ? "M" : "L"} ${x + PADDING.left} ${y + PADDING.top}`;
      })
      .join(" ");
  }, [data, innerWidth, innerHeight, maxY]);

  const activeBucket =
    activeDay !== null ? data.find((bucket) => bucket.day === activeDay) : null;

  if (!hasViews) {
    return (
      <div className="rounded-xl border border-gold/15 bg-ivory/30 px-3 py-4 text-center text-sm text-muted">
        この月の表示はありません
      </div>
    );
  }

  return (
    <div>
      <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium">
        <li className="inline-flex items-center gap-1.5 text-charcoal">
          <span
            className="inline-block h-0.5 w-5 rounded-full"
            style={{ backgroundColor: VIEW_COLOR }}
          />
          表示回数
        </li>
      </ul>

      <div className="overflow-x-auto pb-1">
        <div className="relative" style={{ width: chartWidth, minWidth: "100%" }}>
          {activeBucket && (
            <div
              className="pointer-events-none absolute top-0 z-10 rounded-lg border border-gold/25 bg-white px-3 py-2 text-xs shadow-gold"
              style={{
                left: (() => {
                  const index = data.findIndex((b) => b.day === activeBucket.day);
                  const x =
                    data.length === 1
                      ? innerWidth / 2
                      : (index / (data.length - 1)) * innerWidth;
                  const anchor = PADDING.left + x;
                  return Math.min(Math.max(anchor - 40, 4), chartWidth - 100);
                })(),
              }}
            >
              <p className="font-semibold text-charcoal">{activeBucket.label}</p>
              <p className="mt-0.5 text-charcoal">表示回数: {activeBucket.views}回</p>
            </div>
          )}

          <svg
            width={chartWidth}
            height={CHART_HEIGHT}
            className="mt-12 block sm:mt-0"
            role="img"
            aria-label="日別表示回数の折れ線グラフ"
          >
            <path
              d={viewPath}
              fill="none"
              stroke={VIEW_COLOR}
              strokeWidth={2.5}
            />

            {data.map((bucket, index) => {
              const x =
                PADDING.left +
                (data.length === 1
                  ? innerWidth / 2
                  : (index / (data.length - 1)) * innerWidth);
              const hitWidth =
                data.length > 1 ? innerWidth / (data.length - 1) : innerWidth;
              const isActive = activeDay === bucket.day;
              const y =
                PADDING.top + innerHeight - (bucket.views / maxY) * innerHeight;

              return (
                <g key={bucket.day}>
                  <rect
                    x={x - hitWidth / 2}
                    y={PADDING.top}
                    width={hitWidth}
                    height={innerHeight}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setActiveDay(bucket.day)}
                    onMouseLeave={() =>
                      setActiveDay((current) =>
                        current === bucket.day ? null : current,
                      )
                    }
                    onClick={() =>
                      setActiveDay((current) =>
                        current === bucket.day ? null : bucket.day,
                      )
                    }
                  />
                  {isActive && bucket.views > 0 && (
                    <circle cx={x} cy={y} r={4} fill={VIEW_COLOR} />
                  )}
                  <text
                    x={x}
                    y={CHART_HEIGHT - 8}
                    textAnchor="middle"
                    className="fill-muted text-[9px]"
                  >
                    {bucket.day}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}
