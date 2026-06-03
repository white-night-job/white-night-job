import type { MonthlyApplicationBucket } from "@/lib/job-applications";

type MonthlyApplicationChartProps = {
  data: MonthlyApplicationBucket[];
  filterDescription?: string;
};

export function MonthlyApplicationChart({
  data,
  filterDescription,
}: MonthlyApplicationChartProps) {
  const maxTotal = Math.max(...data.map((bucket) => bucket.total), 1);

  return (
    <section className="rounded-2xl border border-gold/25 bg-white p-4 shadow-gold sm:p-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-charcoal">月間応募数</h3>
          <p className="mt-1 text-xs text-muted">直近12ヶ月（日本時間）· 棒の高さは合計応募数</p>
        </div>
        {filterDescription && (
          <p className="text-xs font-medium text-gold-dark">{filterDescription}</p>
        )}
      </div>

      <div className="mb-4 flex flex-wrap gap-4 text-xs font-medium">
        <span className="inline-flex items-center gap-1.5 text-[#047a3b]">
          <span className="h-2.5 w-2.5 rounded-sm bg-[#06C755]" />
          LINE応募
        </span>
        <span className="inline-flex items-center gap-1.5 text-gold-dark">
          <span className="h-2.5 w-2.5 rounded-sm bg-gold" />
          電話応募
        </span>
        <span className="inline-flex items-center gap-1.5 text-charcoal">
          <span className="h-2.5 w-2.5 rounded-sm bg-charcoal/70" />
          合計
        </span>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-[720px] items-end gap-2 sm:gap-3">
          {data.map((bucket) => {
            const totalHeight = Math.max((bucket.total / maxTotal) * 100, 4);
            const lineHeight =
              bucket.total > 0 ? (bucket.line / bucket.total) * 100 : 0;
            const phoneHeight =
              bucket.total > 0 ? (bucket.phone / bucket.total) * 100 : 0;

            return (
              <div
                key={bucket.monthKey}
                className="flex min-w-[52px] flex-1 flex-col items-center"
              >
                <p className="mb-1 text-[10px] font-semibold text-charcoal sm:text-xs">
                  {bucket.total}件
                </p>
                <div
                  className="flex w-full max-w-[48px] flex-col justify-end rounded-t-md border border-gold/20 bg-ivory/50"
                  style={{ height: "9rem" }}
                >
                  <div
                    className="flex w-full flex-col justify-end overflow-hidden rounded-t-md"
                    style={{ height: `${totalHeight}%` }}
                  >
                    {bucket.phone > 0 && (
                      <div
                        className="w-full bg-gold"
                        style={{ height: `${phoneHeight}%` }}
                        title={`電話 ${bucket.phone}件`}
                      />
                    )}
                    {bucket.line > 0 && (
                      <div
                        className="w-full bg-[#06C755]"
                        style={{ height: `${lineHeight}%` }}
                        title={`LINE ${bucket.line}件`}
                      />
                    )}
                  </div>
                </div>
                <p className="mt-2 text-center text-[10px] font-medium leading-tight text-muted sm:text-xs">
                  {bucket.label}
                </p>
                <p className="mt-1 text-center text-[9px] text-muted">
                  L{bucket.line} / T{bucket.phone}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((bucket) => (
          <li
            key={`${bucket.monthKey}-summary`}
            className="rounded-lg border border-gold/15 bg-ivory/40 px-3 py-2 text-sm"
          >
            <span className="font-medium text-charcoal">{bucket.label}</span>
            <span className="ml-2 text-muted">
              合計 {bucket.total}件（LINE {bucket.line} / 電話 {bucket.phone}）
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
