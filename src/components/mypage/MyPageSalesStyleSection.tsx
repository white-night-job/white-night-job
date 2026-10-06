"use client";

import Link from "next/link";
import { MyPageSectionSkeleton } from "@/components/mypage/MyPageSkeletons";
import {
  MyPageAccordionSection,
  type MyPageAccordionProps,
} from "@/components/mypage/MyPageAccordionSection";
import { useMyPageSection } from "@/components/mypage/useMyPageSection";
import { formatDiagnosisDate } from "@/lib/job-type-diagnosis";
import { MEMBER_PATHS } from "@/lib/member-access";
import {
  isSalesStyleType,
  SALES_STYLE_PROFILES,
  type SavedSalesStyleResult,
} from "@/lib/sales-style-diagnosis";

function parseHistory(raw: unknown): SavedSalesStyleResult[] {
  const payload = (raw ?? {}) as { history?: unknown };
  if (!Array.isArray(payload.history)) return [];
  return (payload.history as SavedSalesStyleResult[]).filter((entry) =>
    isSalesStyleType(entry?.mainType),
  );
}

export function MyPageSalesStyleSection({ open, onToggle }: MyPageAccordionProps) {
  const { data, status } = useMyPageSection<SavedSalesStyleResult[]>({
    cacheKey: "mypage:sales-style-diagnosis",
    url: "/api/sales-style-diagnosis",
    parse: parseHistory,
    fallback: [],
  });

  const history = Array.isArray(data) ? data : [];

  return (
    <MyPageAccordionSection title="営業スタイル診断結果" open={open} onToggle={onToggle}>
      {status === "loading" && <MyPageSectionSkeleton height="h-20" />}

      {status === "error" && (
        <p className="text-sm text-muted">診断結果を読み込めませんでした。</p>
      )}

      {status === "ready" && history.length === 0 && (
        <p className="text-sm text-muted">まだ営業スタイル診断の結果はありません。</p>
      )}

      {status === "ready" && history.length > 0 && (
        <ul className="space-y-3">
          {history.map((entry) => {
            const main = SALES_STYLE_PROFILES[entry.mainType];
            const sub = entry.subType ? SALES_STYLE_PROFILES[entry.subType] : null;
            return (
              <li
                key={entry.id ?? entry.diagnosedAt}
                className="rounded-xl border border-gold/20 bg-ivory p-4 text-sm text-charcoal"
              >
                <p className="text-xs text-muted">
                  診断日：{formatDiagnosisDate(entry.diagnosedAt)}
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold text-gold-dark">
                      {sub ? "メインタイプ" : "営業スタイル"}
                    </p>
                    <p className="mt-1 font-serif text-base font-semibold">{main.name}</p>
                  </div>
                  {sub ? (
                    <div>
                      <p className="text-xs font-semibold text-gold-dark">サブタイプ</p>
                      <p className="mt-1 font-serif text-base font-semibold">{sub.name}</p>
                    </div>
                  ) : null}
                </div>
                <p className="mt-3 text-sm text-charcoal">
                  <span className="text-xs font-semibold text-gold-dark">相性の良い職種</span>
                  <span className="mt-1 block">
                    {main.jobTypes.map((jobType) => jobType.label).join("・")}
                  </span>
                </p>
              </li>
            );
          })}
        </ul>
      )}

      <Link
        href={MEMBER_PATHS.salesStyleDiagnosis}
        className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-full border border-gold/40 bg-ivory px-4 text-sm font-semibold text-gold-dark"
      >
        もう一度診断する
      </Link>
    </MyPageAccordionSection>
  );
}
