"use client";

import { useMemo, useState } from "react";
import type { DailyApplicationBucket } from "@/lib/job-applications";

type DailyApplicationLineChartProps = {
  data: DailyApplicationBucket[];
};

const LINE_COLOR = "#06C755";
const PHONE_COLOR = "#c9a962";
const TOTAL_COLOR = "#9ca3af";

const LINE_DASH = "7 4";
const PHONE_DASH = "3 3";
const CHART_HEIGHT = 168;
const PADDING = { top: 12, right: 8, bottom: 32, left: 36 };

type SeriesKey = "line" | "phone" | "total";

function getSeriesValue(bucket: DailyApplicationBucket, key: SeriesKey): number {
  return bucket[key];
}

function getPointX(
  index: number,
  dataLength: number,
  innerWidth: number,
): number {
  return (
    PADDING.left +
    (dataLength === 1 ? innerWidth / 2 : (index / (dataLength - 1)) * innerWidth)
  );
}

function getPointY(
  value: number,
  innerHeight: number,
  maxY: number,
): number {
  return PADDING.top + innerHeight - (value / maxY) * innerHeight;
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
      const x = getPointX(index, data.length, innerWidth) - PADDING.left;
      const value = getSeriesValue(bucket, key);
      const y = innerHeight - (value / maxY) * innerHeight;
      return `${index === 0 ? "M" : "L"} ${x + PADDING.left} ${y + PADDING.top}`;
    })
    .join(" ");
}

function shouldOffsetPhoneMarker(bucket: DailyApplicationBucket): boolean {
  return bucket.line === bucket.phone;
}

function getPhoneMarkerOffset(bucket: DailyApplicationBucket): {
  dx: number;
  dy: number;
} {
  if (!shouldOffsetPhoneMarker(bucket)) {
    return { dx: 0, dy: 0 };
  }
  return { dx: 6, dy: -7 };
}

type MarkerKind = "line" | "phone" | "total";

function SeriesMarker({
  kind,
  cx,
  cy,
}: {
  kind: MarkerKind;
  cx: number;
  cy: number;
}) {
  const size = 7;

  if (kind === "line") {
    return (
      <rect
        x={cx - size / 2}
        y={cy - size / 2}
        width={size}
        height={size}
        fill={LINE_COLOR}
        stroke="#fff"
        strokeWidth={1}
      />
    );
  }

  if (kind === "phone") {
    const half = size / 2;
    return (
      <polygon
        points={`${cx},${cy - half} ${cx + half},${cy} ${cx},${cy + half} ${cx - half},${cy}`}
        fill={PHONE_COLOR}
        stroke="#fff"
        strokeWidth={1}
      />
    );
  }

  return (
    <circle
      cx={cx}
      cy={cy}
      r={size / 2}
      fill={TOTAL_COLOR}
      stroke="#fff"
      strokeWidth={1}
    />
  );
}

function LegendSample({ kind }: { kind: MarkerKind }) {
  if (kind === "line") {
    return (
      <svg width={28} height={12} aria-hidden className="shrink-0">
        <line
          x1={0}
          y1={6}
          x2={28}
          y2={6}
          stroke={LINE_COLOR}
          strokeWidth={2}
          strokeDasharray={LINE_DASH}
        />
        <rect x={10} y={3.5} width={7} height={7} fill={LINE_COLOR} />
      </svg>
    );
  }

  if (kind === "phone") {
    return (
      <svg width={28} height={12} aria-hidden className="shrink-0">
        <line
          x1={0}
          y1={6}
          x2={28}
          y2={6}
          stroke={PHONE_COLOR}
          strokeWidth={2}
          strokeDasharray={PHONE_DASH}
        />
        <polygon
          points="14,2 17,6 14,10 11,6"
          fill={PHONE_COLOR}
        />
      </svg>
    );
  }

  return (
    <svg width={28} height={12} aria-hidden className="shrink-0">
      <line
        x1={0}
        y1={6}
        x2={28}
        y2={6}
        stroke={TOTAL_COLOR}
        strokeWidth={1.5}
      />
      <circle cx={14} cy={6} r={3.5} fill={TOTAL_COLOR} />
    </svg>
  );
}

function ApplicationTooltip({ bucket }: { bucket: DailyApplicationBucket }) {
  return (
    <div className="pointer-events-none absolute top-0 z-10 min-w-[9.5rem] rounded-lg border border-gold/25 bg-white px-3 py-2 text-xs shadow-gold">
      <p className="font-semibold text-charcoal">{bucket.label}</p>
      <ol className="mt-1.5 space-y-0.5">
        <li className="text-[#047a3b]">LINE応募: {bucket.line}件</li>
        <li className="text-gold-dark">電話応募: {bucket.phone}件</li>
        <li className="text-muted">合計: {bucket.total}件</li>
      </ol>
    </div>
  );
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

  const tooltipLeft = useMemo(() => {
    if (!activeBucket) return 4;
    const index = data.findIndex((bucket) => bucket.day === activeBucket.day);
    const anchor = getPointX(index, data.length, innerWidth);
    return Math.min(Math.max(anchor - 56, 4), chartWidth - 120);
  }, [activeBucket, chartWidth, data, innerWidth]);

  if (!hasApplications) {
    return (
      <div className="rounded-xl border border-gold/15 bg-ivory/30 px-3 py-4 text-center text-sm text-muted">
        この月の応募はありません
      </div>
    );
  }

  return (
    <div>
      <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium">
        <li className="inline-flex items-center gap-2 text-[#047a3b]">
          <LegendSample kind="line" />
          LINE応募
        </li>
        <li className="inline-flex items-center gap-2 text-gold-dark">
          <LegendSample kind="phone" />
          電話応募
        </li>
        <li className="inline-flex items-center gap-2 text-muted">
          <LegendSample kind="total" />
          合計
        </li>
      </ul>

      <div className="overflow-x-auto pb-1">
        <div className="relative" style={{ width: chartWidth, minWidth: "100%" }}>
          {activeBucket && (
            <div style={{ left: tooltipLeft }} className="absolute">
              <ApplicationTooltip bucket={activeBucket} />
            </div>
          )}

          <svg
            width={chartWidth}
            height={CHART_HEIGHT}
            className="mt-[4.75rem] block sm:mt-0"
            role="img"
            aria-label="日別応募数の折れ線グラフ"
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

            <path
              d={totalPath}
              fill="none"
              stroke={TOTAL_COLOR}
              strokeWidth={1.5}
            />
            <path
              d={phonePath}
              fill="none"
              stroke={PHONE_COLOR}
              strokeWidth={2.5}
              strokeDasharray={PHONE_DASH}
            />
            <path
              d={linePath}
              fill="none"
              stroke={LINE_COLOR}
              strokeWidth={2.5}
              strokeDasharray={LINE_DASH}
            />

            {data.map((bucket, index) => {
              const x = getPointX(index, data.length, innerWidth);
              const isActive = activeDay === bucket.day;
              const hitWidth =
                data.length > 1 ? innerWidth / (data.length - 1) : innerWidth;
              const phoneOffset = getPhoneMarkerOffset(bucket);
              const lineY = getPointY(bucket.line, innerHeight, maxY);
              const phoneY = getPointY(bucket.phone, innerHeight, maxY);
              const totalY = getPointY(bucket.total, innerHeight, maxY);

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
                      <SeriesMarker kind="total" cx={x} cy={totalY} />
                      <SeriesMarker
                        kind="phone"
                        cx={x + phoneOffset.dx}
                        cy={phoneY + phoneOffset.dy}
                      />
                      <SeriesMarker kind="line" cx={x} cy={lineY} />
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
