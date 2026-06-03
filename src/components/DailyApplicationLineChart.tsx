"use client";

import { useMemo, useState } from "react";
import type { DailyApplicationBucket } from "@/lib/job-applications";

type DailyApplicationLineChartProps = {
  data: DailyApplicationBucket[];
};

const LINE_COLOR = "#06C755";
const PHONE_COLOR = "#c9a962";
const TOTAL_COLOR = "rgba(55, 65, 81, 0.45)";

const CHART_HEIGHT = 168;
const PADDING = { top: 12, right: 8, bottom: 32, left: 36 };

type SeriesKey = "line" | "phone" | "total";

function getSeriesValue(bucket: DailyApplicationBucket, key: SeriesKey): number {
  return bucket[key];
}

function buildPath(
  data: DailyApplicationBucket[],
  key: SeriesKey,
  innerWidth: number,
  innerHeight: number,
  maxY: number,
): string {
  if (data.length === 0) return "";

  return data
    .map((bucket, index) => {
      const x =
        data.length === 1
          ? innerWidth / 2
          : (index / (data.length - 1)) * innerWidth;
      const value = getSeriesValue(bucket, key);
      const y = innerHeight - (value / maxY) * innerHeight;
      return `${index === 0 ? "M" : "L"} ${x + PADDING.left} ${y + PADDING.top}`;
    })
    .join(" ");
}

export function DailyApplicationLineChart({ data }: DailyApplicationLineChartProps) {
  const [activeDay, setActiveDay] = useState<number | null>(null);

  const hasApplications = data.some((bucket) => bucket.total > 0);
  const chartWidth = Math.max(320, data.length * 18);
  const innerWidth = chartWidth - PADDING.left - PADDING.right;
  const innerHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;

  const maxY = useMemo(
    () =>
      Math.max(
        ...data.flatMap((bucket) => [bucket.line, bucket.phone, bucket.total]),
        1,
      ),
    [data],
  );

  const linePath = useMemo(
    () => buildPath(data, "line", innerWidth, innerHeight, maxY),
    [data, innerWidth, innerHeight, maxY],
  );
  const phonePath = useMemo(
    () => buildPath(data, "phone", innerWidth, innerHeight, maxY),
    [data, innerWidth, innerHeight, maxY],
  );
  const totalPath = useMemo(
    () => buildPath(data, "total", innerWidth, innerHeight, maxY),
    [data, innerWidth, innerHeight, maxY],
  );

  const yTicks = useMemo(() => {
    if (maxY <= 1) return [0, 1];
    const step = maxY <= 5 ? 1 : Math.ceil(maxY / 4);
    const ticks: number[] = [];
    for (let value = 0; value <= maxY; value += step) {
      ticks.push(value);
    }
    if (ticks[ticks.length - 1] !== maxY) ticks.push(maxY);
    return ticks;
  }, [maxY]);

  const activeBucket =
    activeDay !== null ? data.find((bucket) => bucket.day === activeDay) : null;

  if (!hasApplications) {
    return (
      <div className="rounded-xl border border-gold/15 bg-ivory/30 px-3 py-4 text-center text-sm text-muted">
        この月の応募はありません
      </div>
    );
  }

  return (
    <div>
      <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium">
        <li className="inline-flex items-center gap-1.5 text-[#047a3b]">
          <span
            className="inline-block h-0.5 w-5 rounded-full"
            style={{ backgroundColor: LINE_COLOR }}
          />
          LINE応募
        </li>
        <li className="inline-flex items-center gap-1.5 text-gold-dark">
          <span
            className="inline-block h-0.5 w-5 rounded-full"
            style={{ backgroundColor: PHONE_COLOR }}
          />
          電話応募
        </li>
        <li className="inline-flex items-center gap-1.5 text-muted">
          <span
            className="inline-block h-0.5 w-5 rounded-full border border-dashed border-charcoal/30"
            style={{ backgroundColor: TOTAL_COLOR }}
          />
          合計
        </li>
      </ul>

      <div className="overflow-x-auto pb-1">
        <div className="relative" style={{ width: chartWidth, minWidth: "100%" }}>
          {activeBucket && (
            <div
              className="pointer-events-none absolute top-0 z-10 rounded-lg border border-gold/25 bg-white px-3 py-2 text-center text-xs shadow-gold"
              style={{
                left: (() => {
                  const index = data.findIndex((b) => b.day === activeBucket.day);
                  const x =
                    data.length === 1
                      ? innerWidth / 2
                      : (index / (data.length - 1)) * innerWidth;
                  const anchor = PADDING.left + x;
                  return Math.min(Math.max(anchor - 56, 4), chartWidth - 112);
                })(),
              }}
            >
              <p className="font-semibold text-charcoal">{activeBucket.label}</p>
              <p className="mt-0.5 text-[#047a3b]">LINE応募: {activeBucket.line}件</p>
              <p className="text-gold-dark">電話応募: {activeBucket.phone}件</p>
              <p className="text-muted">合計: {activeBucket.total}件</p>
            </div>
          )}

          <svg
            width={chartWidth}
            height={CHART_HEIGHT}
            className="mt-14 block sm:mt-0"
            role="img"
            aria-label="日別応募数の折れ線グラフ"
          >
            {yTicks.map((tick) => {
              const y =
                PADDING.top + innerHeight - (tick / maxY) * innerHeight;
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

            <path
              d={totalPath}
              fill="none"
              stroke={TOTAL_COLOR}
              strokeWidth={2}
              strokeDasharray="4 3"
            />
            <path
              d={phonePath}
              fill="none"
              stroke={PHONE_COLOR}
              strokeWidth={2.5}
            />
            <path
              d={linePath}
              fill="none"
              stroke={LINE_COLOR}
              strokeWidth={2.5}
            />

            {data.map((bucket, index) => {
              const x =
                PADDING.left +
                (data.length === 1
                  ? innerWidth / 2
                  : (index / (data.length - 1)) * innerWidth);
              const isActive = activeDay === bucket.day;
              const hitWidth =
                data.length > 1 ? innerWidth / (data.length - 1) : innerWidth;

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
                    onFocus={() => setActiveDay(bucket.day)}
                    onBlur={() => setActiveDay(null)}
                    onClick={() =>
                      setActiveDay((current) =>
                        current === bucket.day ? null : bucket.day,
                      )
                    }
                  />
                  {isActive && (
                    <>
                      <line
                        x1={x}
                        y1={PADDING.top}
                        x2={x}
                        y2={PADDING.top + innerHeight}
                        stroke="rgba(201, 169, 98, 0.45)"
                        strokeWidth={1}
                        strokeDasharray="3 3"
                      />
                      {bucket.line > 0 && (
                        <circle
                          cx={x}
                          cy={
                            PADDING.top +
                            innerHeight -
                            (bucket.line / maxY) * innerHeight
                          }
                          r={4}
                          fill={LINE_COLOR}
                        />
                      )}
                      {bucket.phone > 0 && (
                        <circle
                          cx={x}
                          cy={
                            PADDING.top +
                            innerHeight -
                            (bucket.phone / maxY) * innerHeight
                          }
                          r={4}
                          fill={PHONE_COLOR}
                        />
                      )}
                      {bucket.total > 0 && (
                        <circle
                          cx={x}
                          cy={
                            PADDING.top +
                            innerHeight -
                            (bucket.total / maxY) * innerHeight
                          }
                          r={3.5}
                          fill="#6b7280"
                        />
                      )}
                    </>
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
      <p className="mt-2 text-[10px] text-muted sm:hidden">
        横にスクロールして全日程を確認できます。日付をタップすると内訳が表示されます。
      </p>
      <p className="mt-2 hidden text-[10px] text-muted sm:block">
        日付にカーソルを合わせると LINE / 電話 / 合計 が表示されます
      </p>
    </div>
  );
}
