import type { DailyApplicationBucket } from "@/lib/job-applications";

type DailyApplicationChartProps = {
  data: DailyApplicationBucket[];
  monthLabel: string;
  compact?: boolean;
};

function buildTooltip(bucket: DailyApplicationBucket): string {
  return `${bucket.label}\nLINE応募: ${bucket.line}件\n電話応募: ${bucket.phone}件\n合計: ${bucket.total}件`;
}

export function DailyApplicationChart({
  data,
  monthLabel,
  compact = false,
}: DailyApplicationChartProps) {
  const maxTotal = Math.max(...data.map((bucket) => bucket.total), 1);
  const hasApplications = data.some((bucket) => bucket.total > 0);
  const chartHeight = compact ? "6.5rem" : "8rem";
  const minBarWidth = compact ? 14 : 16;

  if (!hasApplications) {
    return (
      <div className="rounded-xl border border-gold/15 bg-ivory/30 px-3 py-4 text-center text-sm text-muted">
        この月の応募はありません
      </div>
    );
  }

  return (
    <div>
      <p className="mb-2 text-xs font-medium text-gold-dark">{monthLabel}の日別応募数</p>
      <div className="overflow-x-auto pb-1">
        <div
          className="flex items-end gap-0.5 sm:gap-1"
          style={{ minWidth: `${data.length * (minBarWidth + 4)}px` }}
        >
          {data.map((bucket) => {
            const totalHeight = Math.max((bucket.total / maxTotal) * 100, bucket.total > 0 ? 8 : 0);

            return (
              <div
                key={bucket.day}
                className="flex flex-col items-center"
                style={{ width: minBarWidth }}
                title={buildTooltip(bucket)}
              >
                {bucket.total > 0 && (
                  <p className="mb-0.5 text-[8px] font-semibold leading-none text-charcoal sm:text-[9px]">
                    {bucket.total}
                  </p>
                )}
                <div
                  className="flex w-full flex-col justify-end rounded-t-sm border border-gold/15 bg-ivory/60"
                  style={{ height: chartHeight }}
                >
                  <div
                    className="w-full rounded-t-sm bg-charcoal/75 transition-opacity hover:bg-charcoal"
                    style={{ height: `${totalHeight}%` }}
                    title={buildTooltip(bucket)}
                  />
                </div>
                <p className="mt-1 text-[8px] leading-none text-muted sm:text-[9px]">
                  {bucket.day}
                </p>
              </div>
            );
          })}
        </div>
      </div>
      <p className="mt-2 text-[10px] text-muted">
        棒にカーソルを合わせると LINE / 電話 / 合計 が表示されます
      </p>
    </div>
  );
}
