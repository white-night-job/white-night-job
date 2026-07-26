"use client";

import { useEffect, useState } from "react";
import type { ShopImprovementReport as ReportPayload } from "@/lib/shop-improvement-report";

type ApiResponse = {
  report?: ReportPayload;
  message?: string;
};

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

export function ShopImprovementReport() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [report, setReport] = useState<ReportPayload | null>(null);

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

        if (!response.ok || !body.report) {
          throw new Error(
            body.message ?? "応募改善レポートの取得に失敗しました。",
          );
        }
        setReport(body.report);
      } catch (err) {
        if (cancelled) return;
        setReport(null);
        setError(
          err instanceof Error
            ? err.message
            : "応募改善レポートの取得に失敗しました。",
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const premium = report?.premium ?? null;

  return (
    <section className="mb-8 rounded-2xl border border-gold/25 bg-white p-5 shadow-gold sm:p-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-serif text-lg font-semibold text-charcoal">
            応募改善レポート
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            {report
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
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
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

            {premium?.topPriorityAction && (
              <div className="rounded-xl border border-charcoal/20 bg-charcoal px-4 py-3">
                <p className="text-[11px] font-medium text-gold">
                  最優先で対応したい項目
                </p>
                <p className="mt-1 text-sm font-semibold leading-relaxed text-white">
                  最優先：{premium.topPriorityAction}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
              <AdviceBlock
                title="良い点"
                tone="good"
                items={report.goodPoints}
                emptyText="来月に向けて数値を蓄積中です。"
              />
              <AdviceBlock
                title="改善できる点"
                tone="issue"
                items={report.issues}
                emptyText="大きな課題は見つかりませんでした。"
              />
              <AdviceBlock
                title="今月おすすめの対応"
                tone="action"
                items={report.actions}
                emptyText="現状の内容を維持しましょう。"
              />
            </div>

            {premium && (
              <div className="space-y-3 rounded-xl border border-gold/25 bg-ivory/40 p-4">
                <h3 className="text-sm font-semibold text-charcoal">
                  プレミアム限定の詳細分析
                </h3>

                <div>
                  <p className="text-xs font-medium text-muted">
                    優先度付きの改善案
                  </p>
                  {premium.prioritizedAdvices.length === 0 ? (
                    <p className="mt-1 text-sm text-muted">
                      改善が必要な項目は見つかりませんでした。
                    </p>
                  ) : (
                    <ol className="mt-2 space-y-2">
                      {premium.prioritizedAdvices.map((advice, index) => (
                        <li
                          key={advice.id}
                          className="flex gap-2.5 rounded-lg bg-white p-3 text-sm"
                        >
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold/20 text-xs font-semibold text-gold-dark">
                            {index + 1}
                          </span>
                          <span className="space-y-1">
                            <span className="block leading-relaxed text-charcoal">
                              {advice.action}
                            </span>
                            <span className="block text-xs leading-relaxed text-muted">
                              {advice.issue}
                            </span>
                          </span>
                        </li>
                      ))}
                    </ol>
                  )}
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
              応募クリック数は実際の応募完了人数ではなく、LINE・電話の応募ボタンのクリック数です。表示回数は同一ユーザーの2分以内の連続表示と、管理画面・プレビューからのアクセスを除外しています。
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
