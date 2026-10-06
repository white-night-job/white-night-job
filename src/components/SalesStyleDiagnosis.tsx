"use client";

import { useEffect, useRef, useState } from "react";
import { MemberGateModal } from "@/components/MemberGateModal";
import { SalesStyleDiagnosisResults } from "@/components/SalesStyleDiagnosisResults";
import { useUserSession } from "@/components/UserSessionProvider";
import { createDiagnosisCompletionKey } from "@/lib/job-diagnosis-track-client";
import { MEMBER_PATHS } from "@/lib/member-access";
import {
  calculateSalesStyleResult,
  SALES_STYLE_QUESTIONS,
  type SalesStyleAnswers,
  type SalesStyleResult,
} from "@/lib/sales-style-diagnosis";
import { trackSalesStyleDiagnosisCompleted } from "@/lib/sales-style-diagnosis-track-client";

type SalesStyleDiagnosisProps = {
  /** サーバー側でログイン済みと確認済みのページでは true */
  authenticated?: boolean;
};

export function SalesStyleDiagnosis({ authenticated = false }: SalesStyleDiagnosisProps) {
  const { isLoggedIn, ready } = useUserSession();
  const canUseDiagnosis = authenticated || isLoggedIn;
  const resultsRef = useRef<HTMLDivElement>(null);
  const completionKeyRef = useRef<string | null>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<SalesStyleAnswers>({});
  const [result, setResult] = useState<SalesStyleResult | null>(null);
  const [phase, setPhase] = useState<"questions" | "transition" | "results">("questions");
  const [gateOpen, setGateOpen] = useState(false);

  const total = SALES_STYLE_QUESTIONS.length;
  const current = SALES_STYLE_QUESTIONS[step];
  const progress = Math.round(((step + (phase === "results" ? 1 : 0)) / total) * 100);

  function handleSelect(value: string) {
    if (!canUseDiagnosis) {
      setGateOpen(true);
      return;
    }

    const next = { ...answers, [current.id]: value };
    setAnswers(next);

    if (step < total - 1) {
      setStep(step + 1);
      return;
    }

    const nextResult = calculateSalesStyleResult(next);
    if (!nextResult) return;
    completionKeyRef.current = createDiagnosisCompletionKey();
    setResult(nextResult);
    setPhase("transition");
    window.setTimeout(() => {
      setPhase("results");
    }, 450);
  }

  function reset() {
    setStep(0);
    setAnswers({});
    setResult(null);
    setPhase("questions");
    completionKeyRef.current = null;
  }

  useEffect(() => {
    if (phase !== "results" || !resultsRef.current) return;
    resultsRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [phase]);

  useEffect(() => {
    if (phase !== "results" || !result || !completionKeyRef.current) return;
    void trackSalesStyleDiagnosisCompleted({
      completionKey: completionKeyRef.current,
      mainType: result.mainType,
      subType: result.subType,
    });
  }, [phase, result]);

  const showGuestGate = ready && !canUseDiagnosis;

  return (
    <section id="sales-style-diagnosis" className="job-diagnosis-section scroll-mt-24">
      <div className="job-diagnosis-shell">
        <p className="job-diagnosis-eyebrow">Sales Style</p>
        <h2 className="job-diagnosis-title font-serif">あなたに合う営業スタイル診断</h2>
        <p className="job-diagnosis-subtitle">
          約1分・{total}の質問で
          <br />
          あなたらしい接客・営業スタイルが分かります。
        </p>

        {showGuestGate ? (
          <div className="job-diagnosis-guest-gate">
            <p className="job-diagnosis-guest-gate-badge">
              <span aria-hidden>🔒</span> LINE会員限定
            </p>
            <p className="job-diagnosis-guest-gate-text">
              営業スタイル診断はLINEログイン後に利用できます。診断結果を保存して、マイページでいつでも確認できます。
            </p>
            <button
              type="button"
              onClick={() => setGateOpen(true)}
              className="job-diagnosis-guest-gate-btn"
            >
              診断を始める
            </button>
          </div>
        ) : (
          <>
            <div className="job-diagnosis-progress" aria-hidden>
              <div
                className="job-diagnosis-progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>

            {phase === "questions" && (
              <div className="job-diagnosis-question-wrap">
                <p className="job-diagnosis-step">
                  Q{step + 1} / {total}
                </p>
                <p className="job-diagnosis-question font-serif">{current.title}</p>
                <div className="job-diagnosis-options">
                  {current.options.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleSelect(option.value)}
                      className="job-diagnosis-option"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {phase === "transition" && (
              <div className="job-diagnosis-transition" aria-live="polite">
                <p className="job-diagnosis-transition-text font-serif">結果を見る</p>
                <span className="job-diagnosis-transition-dot" />
              </div>
            )}

            {phase === "results" && result && (
              <div ref={resultsRef}>
                <SalesStyleDiagnosisResults
                  result={result}
                  answers={answers}
                  onReset={reset}
                />
              </div>
            )}
          </>
        )}
      </div>

      <MemberGateModal
        open={gateOpen}
        onClose={() => setGateOpen(false)}
        title="営業スタイル診断はLINEログイン後に利用できます"
        description="診断結果を保存して、マイページでいつでも確認できます。"
        redirectPath={MEMBER_PATHS.salesStyleDiagnosis}
        action="diagnosis"
      />
    </section>
  );
}
