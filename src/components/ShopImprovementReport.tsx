"use client";

import { useEffect, useState } from "react";
import { MonthlyApplicationChart } from "@/components/MonthlyApplicationChart";
import { ShopMonthlyImpressionBarChart } from "@/components/ShopMonthlyImpressionBarChart";
import type { MonthlyApplicationBucket } from "@/lib/job-applications";
import type {
  AdvicePriorityLevel,
  ImprovementAdvice,
  ShopImprovementReport as ReportPayload,
  ShopLightAnalyticsSummary,
} from "@/lib/shop-improvement-report";

type ApiResponse = {
  report?: ReportPayload;
  light?: ShopLightAnalyticsSummary;
  message?: string;
};

type ShopImprovementReportProps = {
  /** 月間応募数グラフ用。ダッシュボードが deferred API で取得済みのデータを受け取り、二重取得しない。 */
  monthlyApplications: MonthlyApplicationBucket[];
  monthlyApplicationsLoading: boolean;
  /** 見出しの初期表示用。実際の表示内容はサーバーのプラン判定（APIレスポンス）に従う。 */
  lightPlan: boolean;
};

const REPORT_LOAD_ERROR_MESSAGE =
  "レポートを読み込めませんでした。時間をおいて再度お試しください";

function formatCount(value: number): string {
  return value.toLocaleString("ja-JP");
}

function formatSignedCount(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toLocaleString("ja-JP")}`;
}

function formatSignedPoint(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value}pt`;
}

function diffToneClass(value: number): string {
  if (value > 0) return "text-[#047a3b]";
  if (value < 0) return "text-red-600";
  return "text-muted";
}

function ReportSkeleton() {
  return (
    <div className="space-y-3" aria-hidden="true">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-20 animate-pulse rounded-xl border border-gold/15 bg-ivory/60"
          />
        ))}
      </div>
      <div className="h-24 animate-pulse rounded-xl border border-gold/15 bg-ivory/60" />
      <div className="h-40 animate-pulse rounded-xl border border-gold/15 bg-ivory/60" />
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-gold/20 bg-ivory/50 p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-serif text-xl font-semibold text-charcoal sm:text-2xl">
        {formatCount(value)}
        <span className="ml-1 font-sans text-sm font-medium text-muted">回</span>
      </p>
    </div>
  );
}

function RateCard({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-gold/20 bg-white p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-serif text-xl font-semibold text-charcoal sm:text-2xl">
        {value}
        <span className="ml-0.5 font-sans text-sm font-medium text-muted">%</span>
      </p>
      <p className="mt-1 text-[11px] leading-relaxed text-muted">{description}</p>
    </div>
  );
}

function AdviceBlock({
  title,
  tone,
  items,
  emptyText,
}: {
  title: string;
  tone: "good" | "issue" | "action";
  items: string[];
  emptyText: string;
}) {
  const toneClass =
    tone === "good"
      ? "border-[#047a3b]/25 bg-[#047a3b]/5"
      : tone === "issue"
        ? "border-amber-300/60 bg-amber-50"
        : "border-gold/30 bg-ivory/60";

  return (
    <div className={`rounded-xl border p-4 ${toneClass}`}>
      <h4 className="text-sm font-semibold text-charcoal">{title}</h4>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-muted">{emptyText}</p>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {items.map((item) => (
            <li
              key={item}
              className="flex gap-2 text-sm leading-relaxed text-charcoal"
            >
              <span aria-hidden="true" className="text-gold-dark">
                ・
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const PRIORITY_LABEL: Record<AdvicePriorityLevel, string> = {
  high: "高",
  medium: "中",
  low: "低",
};

const PRIORITY_TONE: Record<AdvicePriorityLevel, string> = {
  high: "bg-red-50 text-red-800 border-red-200",
  medium: "bg-amber-50 text-amber-900 border-amber-200",
  low: "bg-slate-50 text-slate-700 border-slate-200",
};

function groupAdvicesByPriority(advices: ImprovementAdvice[]) {
  const groups: Record<AdvicePriorityLevel, ImprovementAdvice[]> = {
    high: [],
    medium: [],
    low: [],
  };
  for (const advice of advices) {
    groups[advice.priorityLevel].push(advice);
  }
  return groups;
}

function ConcreteAdviceList({ advices }: { advices: ImprovementAdvice[] }) {
  if (advices.length === 0) {
    return (
      <p className="mt-2 text-sm text-muted">
        大きな改善提案はありません。現状維持で問題ありません。
      </p>
    );
  }

  return (
    <ol className="mt-2 space-y-3">
      {advices.map((advice, index) => (
        <li
          key={advice.id}
          className="rounded-xl border border-gold/20 bg-white p-3.5"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold/20 text-xs font-semibold text-gold-dark">
              {index + 1}
            </span>
            <span
              className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${PRIORITY_TONE[advice.priorityLevel]}`}
            >
              優先度：{PRIORITY_LABEL[advice.priorityLevel]}
            </span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-charcoal">
            {advice.action}
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-muted">
            {advice.issue}
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-charcoal/80">
            期待効果：{advice.expectedEffect}
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted">
            理由：{advice.reason}
          </p>
        </li>
      ))}
    </ol>
  );
}

export function ShopImprovementReport({
  monthlyApplications,
  monthlyApplicationsLoading,
  lightPlan,
}: ShopImprovementReportProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [report, setReport] = useState<ReportPayload | null>(null);
  const [light, setLight] = useState<ShopLightAnalyticsSummary | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const response = await fetch("/api/shop-dashboard/improvement-report", {
          cache: "no-store",
          credentials: "include",
        });
        const body = (await response.json()) as ApiResponse;
        if (cancelled) return;

        if (!response.ok || (!body.report && !body.light)) {
          // 401/403 はプラン案内など店舗向け文言をそのまま表示。
          // それ以外（DBエラー等）は固定メッセージにし、英語の詳細は出さない。
          if (response.status === 401 || response.status === 403) {
            setError(body.message ?? REPORT_LOAD_ERROR_MESSAGE);
          } else {
            setError(REPORT_LOAD_ERROR_MESSAGE);
          }
          setReport(null);
          setLight(null);
          return;
        }
        setReport(body.report ?? null);
        setLight(body.report ? null : (body.light ?? null));
        setError("");
      } catch (err) {
        if (cancelled) return;
        setReport(null);
        setLight(null);
        console.error("[ShopImprovementReport] fetch failed", err);
        setError(REPORT_LOAD_ERROR_MESSAGE);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const premium = report?.premium ?? null;
  // サーバーのプラン判定（レスポンス種別）を優先し、読み込み中は props で見出しを出し分ける。
  const isLightView = light != null || (lightPlan && !report);

  // 月間応募数はダッシュボード側で取得済みのデータを使うため、レポート取得失敗時も表示できる。
  const monthlyApplicationsBlock = (
    <div>
      <h3 className="text-sm font-semibold text-charcoal">月間応募数</h3>
      <p className="mt-1 text-xs text-muted">月次の応募推移です。</p>
      <div className="mt-2">
        {monthlyApplicationsLoading ? (
          <div className="h-48 animate-pulse rounded-2xl border border-gold/15 bg-ivory/60" />
        ) : (
          <MonthlyApplicationChart data={monthlyApplications} />
        )}
      </div>
    </div>
  );

  return (
    <section className="mb-8 rounded-2xl border border-gold/25 bg-white p-5 shadow-gold sm:p-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-serif text-lg font-semibold text-charcoal">
            {isLightView ? "アクセス・応募分析" : "アクセス・応募分析・レポート"}
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            {isLightView
              ? `${light?.monthLabel ?? "今月"}のアクセスと応募クリックの状況です。`
              : report
                ? `${report.monthLabel}の数値と求人内容から、応募を増やすための改善案をご提案します。`
                : "今月の数値と求人内容から、応募を増やすための改善案をご提案します。"}
          </p>
        </div>
        {premium && (
          <span className="self-start rounded-full bg-charcoal px-3 py-1 text-[11px] font-medium text-white sm:self-auto">
            プレミアム詳細分析
          </span>
        )}
      </div>

      <div className="mt-4">
        {loading && <ReportSkeleton />}

        {!loading && error && (
          <div className="space-y-5">
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
            {monthlyApplicationsBlock}
          </div>
        )}

        {!loading && light && (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-charcoal">
                基本的なアクセス・応募状況
              </h3>
              <p className="mt-1 text-xs text-muted">
                対象期間：{light.periodLabel || light.monthLabel}
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2 lg:grid-cols-4">
                <MetricCard label="表示回数" value={light.current.impressions} />
                <MetricCard
                  label="LINE応募数"
                  value={light.current.lineClicks}
                />
                <MetricCard
                  label="電話応募数"
                  value={light.current.phoneClicks}
                />
                <MetricCard
                  label="応募数"
                  value={light.current.applyTotal}
                />
              </div>
            </div>

            <p className="text-[11px] leading-relaxed text-muted">
              応募数は実際の応募完了人数ではなく、LINE・電話の応募ボタンのクリック数です。表示回数は同一ユーザーの1分以内の連続表示と、管理画面・プレビューからのアクセスを除外しています。詳細クリック数や改善レポートはスタンダード以上のプランでご利用いただけます。
            </p>
          </div>
        )}

        {!loading && report && (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-charcoal">
                {report.monthLabel}の状況
              </h3>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                <MetricCard label="表示回数" value={report.current.impressions} />
                <MetricCard
                  label="店舗詳細クリック"
                  value={report.current.detailClicks}
                />
                <MetricCard
                  label="LINE応募クリック"
                  value={report.current.lineClicks}
                />
                <MetricCard
                  label="電話応募クリック"
                  value={report.current.phoneClicks}
                />
                <MetricCard
                  label="応募クリック合計"
                  value={report.current.applyTotal}
                />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-charcoal">応募率</h3>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <RateCard
                  label="詳細クリック率"
                  value={report.rates.detailClickRate}
                  description="店舗詳細クリック数 ÷ 表示回数"
                />
                <RateCard
                  label="応募クリック率"
                  value={report.rates.applyClickRate}
                  description="応募クリック合計 ÷ 店舗詳細クリック数"
                />
              </div>
            </div>

            <ShopMonthlyImpressionBarChart data={report.monthly ?? []} />

            {monthlyApplicationsBlock}

            <div>
              <h3 className="text-sm font-semibold text-charcoal">
                {report.previousMonthLabel}との比較
              </h3>
              <ul className="mt-2 divide-y divide-gold/15 overflow-hidden rounded-xl border border-gold/20">
                {report.comparison.map((item) => (
                  <li
                    key={item.label}
                    className="flex items-center justify-between gap-3 bg-white px-3 py-2.5 text-sm"
                  >
                    <span className="text-charcoal">{item.label}</span>
                    <span className="flex items-baseline gap-2 text-right">
                      <span className="text-xs text-muted">
                        {item.unit === "percent"
                          ? `${item.previous}% → ${item.current}%`
                          : `${formatCount(item.previous)} → ${formatCount(item.current)}`}
                      </span>
                      <span
                        className={`font-medium ${diffToneClass(item.diff)}`}
                      >
                        {item.unit === "percent"
                          ? formatSignedPoint(item.diff)
                          : formatSignedCount(item.diff)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-charcoal">現在の状況</h3>
              <ul className="mt-2 space-y-1.5 rounded-xl border border-gold/20 bg-ivory/40 p-4">
                {(report.situationSummary ?? []).map((line) => (
                  <li
                    key={line}
                    className="flex gap-2 text-sm leading-relaxed text-charcoal"
                  >
                    <span aria-hidden="true" className="text-gold-dark">
                      ・
                    </span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
              {report.peerComparison && (
                <p className="mt-2 text-[11px] leading-relaxed text-muted">
                  同業比較は同一エリア・同一業種の公開求人
                  {report.peerComparison.sampleSize}件
                  {report.peerComparison.isReference
                    ? "に基づく参考値です。件数が少ないため断定には使いません。"
                    : "の平均値です。"}
                </p>
              )}
            </div>

            <AdviceBlock
              title="良い点"
              tone="good"
              items={report.goodPoints}
              emptyText="来月に向けて数値を蓄積中です。"
            />

            <div className="rounded-xl border border-gold/20 bg-ivory/40 p-4">
              <h3 className="text-sm font-semibold text-charcoal">改善優先度</h3>
              {(() => {
                const groups = groupAdvicesByPriority(report.advices ?? []);
                const levels: AdvicePriorityLevel[] = ["high", "medium", "low"];
                const hasAny = levels.some((level) => groups[level].length > 0);
                if (!hasAny) {
                  return (
                    <p className="mt-2 text-sm text-muted">
                      優先して直す項目はありません（現状維持）。
                    </p>
                  );
                }
                return (
                  <div className="mt-3 space-y-3">
                    {levels.map((level) =>
                      groups[level].length === 0 ? null : (
                        <div key={level}>
                          <p className="text-xs font-medium text-muted">
                            {PRIORITY_LABEL[level]}
                          </p>
                          <ul className="mt-1 space-y-1">
                            {groups[level].map((advice) => (
                              <li
                                key={advice.id}
                                className="text-sm leading-relaxed text-charcoal"
                              >
                                ・{advice.issue}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ),
                    )}
                  </div>
                );
              })()}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-charcoal">
                具体的な改善内容
              </h3>
              <p className="mt-1 text-xs text-muted">
                影響が大きい順に最大3件まで表示します。
              </p>
              <ConcreteAdviceList advices={report.advices ?? []} />
            </div>

            <div className="rounded-xl border border-[#047a3b]/20 bg-[#047a3b]/5 p-4">
              <h3 className="text-sm font-semibold text-charcoal">
                改善後に期待できること
              </h3>
              {(report.advices ?? []).length === 0 ? (
                <p className="mt-2 text-sm text-muted">
                  現状維持により、既存の閲覧率・応募率を保てます。
                </p>
              ) : (
                <ul className="mt-2 space-y-1.5">
                  {[
                    ...new Set(
                      (report.advices ?? []).map((a) => a.expectedEffect),
                    ),
                  ].map((effect) => (
                    <li
                      key={effect}
                      className="flex gap-2 text-sm leading-relaxed text-charcoal"
                    >
                      <span aria-hidden="true" className="text-gold-dark">
                        ・
                      </span>
                      <span>{effect}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {premium && (
              <div className="space-y-3 rounded-xl border border-gold/25 bg-ivory/40 p-4">
                <h3 className="text-sm font-semibold text-charcoal">
                  プレミアム限定の詳細分析
                </h3>

                <div>
                  <p className="text-xs font-medium text-muted">現在の強み</p>
                  {premium.strengths?.length ? (
                    <ul className="mt-1 space-y-1">
                      {premium.strengths.map((item) => (
                        <li
                          key={item}
                          className="text-sm leading-relaxed text-charcoal"
                        >
                          ・{item}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1 text-sm text-muted">計測を蓄積中です。</p>
                  )}
                </div>

                {premium.mainChallenge && (
                  <div className="rounded-xl border border-charcoal/20 bg-charcoal px-4 py-3">
                    <p className="text-[11px] font-medium text-gold">
                      最大の課題
                    </p>
                    <p className="mt-1 text-sm font-semibold leading-relaxed text-white">
                      {premium.mainChallenge}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-xs font-medium text-muted">
                    優先して直す項目
                  </p>
                  {premium.priorityFixes?.length ? (
                    <ol className="mt-2 space-y-2">
                      {premium.priorityFixes.map((fix, index) => (
                        <li
                          key={`${index}-${fix.slice(0, 24)}`}
                          className="flex gap-2.5 rounded-lg bg-white p-3 text-sm leading-relaxed text-charcoal"
                        >
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold/20 text-xs font-semibold text-gold-dark">
                            {index + 1}
                          </span>
                          <span>{fix}</span>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="mt-1 text-sm text-muted">
                      優先して直す項目はありません。
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-xs font-medium text-muted">
                    競合平均との差
                  </p>
                  {premium.peerGaps?.length ? (
                    <ul className="mt-1 space-y-1">
                      {premium.peerGaps.map((gap) => (
                        <li
                          key={gap}
                          className="text-sm leading-relaxed text-charcoal"
                        >
                          ・{gap}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1 text-sm text-muted">
                      同一エリア・同一業種の比較対象が足りないため、今回は省略しています。
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-xs font-medium text-muted">
                    次に確認すべき数値
                  </p>
                  <ul className="mt-1 flex flex-wrap gap-1.5">
                    {(premium.nextMetricsToWatch ?? []).map((metric) => (
                      <li
                        key={metric}
                        className="rounded-full border border-gold/30 bg-white px-2.5 py-1 text-xs text-charcoal"
                      >
                        {metric}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted">
                    求人情報の未入力・不足項目
                  </p>
                  {premium.missingFields.length === 0 ? (
                    <p className="mt-1 text-sm text-muted">
                      すべての項目が入力済みです。
                    </p>
                  ) : (
                    <ul className="mt-2 flex flex-wrap gap-1.5">
                      {premium.missingFields.map((field) => (
                        <li
                          key={field}
                          className="rounded-full border border-amber-300/70 bg-amber-50 px-2.5 py-1 text-xs text-amber-900"
                        >
                          {field}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            <p className="text-[11px] leading-relaxed text-muted">
              応募クリック数は実際の応募完了人数ではなく、LINE・電話の応募ボタンのクリック数です。表示回数は同一ユーザーの1分以内の連続表示と、管理画面・プレビューからのアクセスを除外しています。
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
