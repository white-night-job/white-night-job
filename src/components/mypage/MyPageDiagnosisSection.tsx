"use client";

import Link from "next/link";
import { MyPageSectionSkeleton } from "@/components/mypage/MyPageSkeletons";
import { useMyPageSection } from "@/components/mypage/useMyPageSection";
import {
  formatDiagnosisDate,
  type SavedDiagnosisResult,
} from "@/lib/job-type-diagnosis";

function parseDiagnosis(raw: unknown): SavedDiagnosisResult[] {
  const payload = (raw ?? {}) as {
    history?: unknown;
    diagnosis?: SavedDiagnosisResult | null;
  };
  if (Array.isArray(payload.history)) return payload.history as SavedDiagnosisResult[];
  return payload.diagnosis ? [payload.diagnosis] : [];
}

export function MyPageDiagnosisSection() {
  const { data, status } = useMyPageSection<SavedDiagnosisResult[]>({
    cacheKey: "mypage:diagnosis",
    url: "/api/job-type-diagnosis",
    parse: parseDiagnosis,
    fallback: [],
  });

  const history = Array.isArray(data) ? data : [];

  return (
    <section className="mt-5 rounded-2xl border border-gold/20 bg-white p-5 shadow-gold">
      <h2 className="font-serif text-lg font-semibold text-charcoal">診断結果</h2>

      {status === "loading" && (
        <div className="mt-3">
          <MyPageSectionSkeleton height="h-20" />
        </div>
      )}

      {status === "error" && (
        <p className="mt-2 text-sm text-muted">
          診断結果を読み込めませんでした。
        </p>
      )}

      {status === "ready" && history.length === 0 && (
        <p className="mt-2 text-sm text-muted">まだ職種診断の結果はありません。</p>
      )}

      {status === "ready" && history.length > 0 && (
        <ul className="mt-4 space-y-3">
          {history.map((entry) => (
            <li
              key={entry.id ?? entry.diagnosedAt}
              className="rounded-xl border border-gold/20 bg-ivory p-4 text-sm text-charcoal"
            >
              <p className="text-xs text-muted">
                診断日：{formatDiagnosisDate(entry.diagnosedAt)}
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold text-gold-dark">第1位</p>
                  <p className="mt-1 font-serif text-base font-semibold">
                    {entry.firstJobType}
                  </p>
                  <p className="mt-1 text-sm text-muted">適性 {entry.firstPercent}%</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gold-dark">第2位</p>
                  <p className="mt-1 font-serif text-base font-semibold">
                    {entry.secondJobType}
                  </p>
                  <p className="mt-1 text-sm text-muted">適性 {entry.secondPercent}%</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/diagnosis"
        className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-full border border-gold/40 bg-ivory px-4 text-sm font-semibold text-gold-dark"
      >
        もう一度診断する
      </Link>
    </section>
  );
}
