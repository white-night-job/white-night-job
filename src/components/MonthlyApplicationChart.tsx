"use client";

import { useMemo } from "react";
import { useChartScrollToEnd } from "@/hooks/useChartScrollToEnd";
import type { MonthlyApplicationBucket } from "@/lib/job-applications";

type MonthlyApplicationChartProps = {
  data: MonthlyApplicationBucket[];
  filterDescription?: string;
  compact?: boolean;
};

const LINE_COLOR = "#06C755";
const PHONE_COLOR = "#c9a962";
const TOTAL_COLOR = "#9ca3af";

const LINE_DASH = "7 4";
const PHONE_DASH = "3 3";
const CHART_HEIGHT = 220;
const AXIS_WIDTH = 40;
const PADDING = { top: 36, right: 16, bottom: 36, left: 8 };
const MONTH_SLOT = 72;

type SeriesKey = "line" | "phone" | "total";
type MarkerKind = "line" | "phone" | "total";

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

function getPointY(value: number, innerHeight: number, maxY: number): number {
  return PADDING.top + innerHeight - (value / maxY) * innerHeight;
}

function buildPath(
  data: MonthlyApplicationBucket[],
  key: SeriesKey,
  innerWidth: number,
  innerHeight: number,
  maxY: number,
): string {
  if (data.length === 0) return "";

  return data
    .map((bucket, index) => {
      const x = getPointX(index, data.length, innerWidth);
      const y = getPointY(bucket[key], innerHeight, maxY);
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
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

/** Offset labels so LINE / phone / total stay readable when values coincide. */
function valueLabelOffset(
  kind: MarkerKind,
  bucket: MonthlyApplicationBucket,
): { dx: number; dy: number } {
  const sameLinePhone = bucket.line === bucket.phone;
  const sameAll =
    bucket.line === bucket.phone && bucket.phone === bucket.total;

  if (kind === "total") {
    return { dx: 0, dy: sameAll ? -26 : -20 };
  }
  if (kind === "line") {
    return {
      dx: sameLinePhone || sameAll ? -11 : -8,
      dy: sameAll ? -14 : -10,
    };
  }
  return {
    dx: sameLinePhone || sameAll ? 11 : 8,
    dy: sameAll ? -14 : -10,
  };
}

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
        <polygon points="14,2 17,6 14,10 11,6" fill={PHONE_COLOR} />
      </svg>
    );
  }

  return (
    <svg width={28} height={12} aria-hidden className="shrink-0">
      <line x1={0} y1={6} x2={28} y2={6} stroke={TOTAL_COLOR} strokeWidth={1.5} />
      <circle cx={14} cy={6} r={3.5} fill={TOTAL_COLOR} />
    </svg>
  );
}

export function MonthlyApplicationChart({
  data,
  filterDescription,
  compact = false,
}: MonthlyApplicationChartProps) {
  const hasData = data.length > 0;
  const chartWidth = compact
    ? Math.max(480, data.length * MONTH_SLOT)
    : Math.max(720, data.length * MONTH_SLOT);
  const scrollKey = useMemo(
    () =>
      hasData
        ? data
            .map(
              (bucket) =>
                `${bucket.monthKey}:${bucket.line}:${bucket.phone}:${bucket.total}`,
            )
            .join("|")
        : "",
    [data, hasData],
  );
  const chartScrollRef = useChartScrollToEnd(scrollKey);
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

  const yTicks = useMemo(() => buildYTicks(maxY), [maxY]);

  const content = !hasData ? (
    <div className="rounded-xl border border-gold/15 bg-ivory/30 px-3 py-4 text-center text-sm text-muted">
      直近12ヶ月の応募はありません
    </div>
  ) : (
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

      <div className="flex items-stretch">
        {/* Fixed Y-axis — outside horizontal scroll */}
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

        <div className="min-w-0 flex-1">
          <div ref={chartScrollRef} className="overflow-x-auto pb-1">
            <div style={{ width: chartWidth, minWidth: "100%" }}>
              <svg
                width={chartWidth}
                height={CHART_HEIGHT}
                className="block"
                role="img"
                aria-label="月別応募数の折れ線グラフ"
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
                  d={totalPath}
                  fill="none"
                  stroke={TOTAL_COLOR}
                  strokeWidth={1.5}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                <path
                  d={phonePath}
                  fill="none"
                  stroke={PHONE_COLOR}
                  strokeWidth={2.5}
                  strokeDasharray={PHONE_DASH}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                <path
                  d={linePath}
                  fill="none"
                  stroke={LINE_COLOR}
                  strokeWidth={2.5}
                  strokeDasharray={LINE_DASH}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />

                {data.map((bucket, index) => {
                  const x = getPointX(index, data.length, innerWidth);
                  const lineY = getPointY(bucket.line, innerHeight, maxY);
                  const phoneY = getPointY(bucket.phone, innerHeight, maxY);
                  const totalY = getPointY(bucket.total, innerHeight, maxY);
                  const phoneMarkerOffset =
                    bucket.line === bucket.phone ? { dx: 6, dy: -6 } : { dx: 0, dy: 0 };
                  const lineOffset = valueLabelOffset("line", bucket);
                  const phoneOffset = valueLabelOffset("phone", bucket);
                  const totalOffset = valueLabelOffset("total", bucket);

                  return (
                    <g key={bucket.monthKey}>
                      <SeriesMarker kind="total" cx={x} cy={totalY} />
                      <SeriesMarker
                        kind="phone"
                        cx={x + phoneMarkerOffset.dx}
                        cy={phoneY + phoneMarkerOffset.dy}
                      />
                      <SeriesMarker kind="line" cx={x} cy={lineY} />

                      <text
                        x={x + totalOffset.dx}
                        y={Math.max(11, totalY + totalOffset.dy)}
                        textAnchor="middle"
                        className="fill-muted text-[9px] font-semibold"
                      >
                        {bucket.total.toLocaleString("ja-JP")}
                      </text>
                      <text
                        x={x + lineOffset.dx}
                        y={Math.max(11, lineY + lineOffset.dy)}
                        textAnchor="middle"
                        className="fill-[#047a3b] text-[9px] font-semibold"
                      >
                        {bucket.line.toLocaleString("ja-JP")}
                      </text>
                      <text
                        x={x + phoneOffset.dx}
                        y={Math.max(11, phoneY + phoneOffset.dy)}
                        textAnchor="middle"
                        className="fill-gold-dark text-[9px] font-semibold"
                      >
                        {bucket.phone.toLocaleString("ja-JP")}
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
  );

  if (compact) {
    return (
      <div>
        <p className="mb-3 text-xs font-medium text-gold-dark">月別応募数（折れ線）</p>
        {content}
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-gold/25 bg-white p-4 shadow-gold sm:p-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-charcoal">月間応募数</h3>
          <p className="mt-1 text-xs text-muted">直近12ヶ月（日本時間）</p>
        </div>
        {filterDescription && (
          <p className="text-xs font-medium text-gold-dark">{filterDescription}</p>
        )}
      </div>
      {content}
    </section>
  );
}
