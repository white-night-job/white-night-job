import type { MonthlyViewBucket } from "@/lib/job-views";

type MonthlyViewChartProps = {
  data: MonthlyViewBucket[];
  filterDescription?: string;
  title?: string;
  compact?: boolean;
};

export function MonthlyViewChart({
  data,
  filterDescription,
  title = "月間表示回数",
  compact = false,
}: MonthlyViewChartProps) {
  const maxViews = Math.max(...data.map((bucket) => bucket.views), 1);
  const chartHeight = compact ? "6rem" : "9rem";

  return (
    <section
      className={
        compact
          ? ""
          : "rounded-2xl border border-gold/25 bg-white p-4 shadow-gold sm:p-5"
      }
    >
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3
            className={
              compact
                ? "text-xs font-medium text-gold-dark"
                : "text-base font-semibold text-charcoal"
            }
          >
            {title}
          </h3>
          <p className="mt-1 text-xs text-muted">
            直近12ヶ月（日本時間）
          </p>
        </div>
        {filterDescription && !compact && (
          <p className="text-xs font-medium text-gold-dark">{filterDescription}</p>
        )}
      </div>

      <div className="overflow-x-auto pb-2">
        <div
          className={`flex items-end gap-2 sm:gap-3 ${compact ? "min-w-[480px]" : "min-w-[720px]"}`}
        >
          {data.map((bucket) => {
            const height = Math.max((bucket.views / maxViews) * 100, bucket.views > 0 ? 8 : 0);

            return (
              <div
                key={bucket.monthKey}
                className={`flex flex-1 flex-col items-center ${compact ? "min-w-[40px]" : "min-w-[52px]"}`}
              >
                {bucket.views > 0 && (
                  <p className="mb-1 text-[10px] font-semibold text-charcoal sm:text-xs">
                    {bucket.views}
                  </p>
                )}
                <div
                  className="flex w-full max-w-[48px] flex-col justify-end rounded-t-md border border-gold/20 bg-ivory/50"
                  style={{ height: chartHeight }}
                >
                  <div
                    className="w-full rounded-t-md bg-charcoal/70"
                    style={{ height: `${height}%` }}
                    title={`${bucket.label}: ${bucket.views}回`}
                  />
                </div>
                <p className="mt-2 text-center text-[10px] font-medium leading-tight text-muted sm:text-xs">
                  {bucket.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
