"use client";

import { useEffect, useRef, useState } from "react";
import { JobTypeDiagnosisResults } from "@/components/JobTypeDiagnosisResults";
import { MemberGateModal } from "@/components/MemberGateModal";
import { useUserSession } from "@/components/UserSessionProvider";
import {
  createDiagnosisCompletionKey,
  trackJobDiagnosisCompleted,
} from "@/lib/job-diagnosis-track-client";
import {
  calculateDiagnosisResult,
  DIAGNOSIS_QUESTIONS,
  type DiagnosisAnswers,
  type DiagnosisPreferredArea,
  type DiagnosisResult,
} from "@/lib/job-type-diagnosis";
import { DIAGNOSIS_PREFERRED_AREA_OPTIONS } from "@/lib/job-type-diagnosis-types";
import { MEMBER_PATHS } from "@/lib/member-access";

const EMPTY_ANSWERS: DiagnosisAnswers = {
  preferredAreas: null,
  priority: null,
  experience: null,
  age: null,
  alcohol: null,
  serviceStyle: null,
  customerType: null,
  goal: null,
  atmosphere: null,
  schedule: null,
  outfit: null,
  personality: null,
};

const ALLOWED_AREAS = new Set(
  DIAGNOSIS_PREFERRED_AREA_OPTIONS.map((option) => option.value),
);

type NightJobDiagnosisProps = {
  /** サーバー側でログイン済みと確認済みのページでは true */
  authenticated?: boolean;
};

export function NightJobDiagnosis({ authenticated = false }: NightJobDiagnosisProps) {
  const { isLoggedIn, ready } = useUserSession();
  const canUseDiagnosis = authenticated || isLoggedIn;
  const resultsRef = useRef<HTMLDivElement>(null);
  const completionKeyRef = useRef<string | null>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<DiagnosisAnswers>(EMPTY_ANSWERS);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [phase, setPhase] = useState<"questions" | "transition" | "results">("questions");
  const [gateOpen, setGateOpen] = useState(false);
  const [areaError, setAreaError] = useState("");

  const current = DIAGNOSIS_QUESTIONS[step];
  const progress = Math.round(
    ((step + (phase === "results" ? 1 : 0)) / DIAGNOSIS_QUESTIONS.length) * 100,
  );
  const selectedAreas = answers.preferredAreas ?? [];

  function finishWithAnswers(nextAnswers: DiagnosisAnswers) {
    const nextResult = calculateDiagnosisResult(nextAnswers);
    completionKeyRef.current = createDiagnosisCompletionKey();
    setResult(nextResult);
    setPhase("transition");
    window.setTimeout(() => {
      setPhase("results");
    }, 450);
  }

  function handleSelect(value: string) {
    if (!canUseDiagnosis) {
      setGateOpen(true);
      return;
    }

    const key = current.key;
    if (key === "preferredAreas") return;

    const next = { ...answers, [key]: value } as DiagnosisAnswers;
    setAnswers(next);

    if (step < DIAGNOSIS_QUESTIONS.length - 1) {
      setStep(step + 1);
      return;
    }

    finishWithAnswers(next);
  }

  function togglePreferredArea(value: string) {
    if (!canUseDiagnosis) {
      setGateOpen(true);
      return;
    }
    if (!ALLOWED_AREAS.has(value as DiagnosisPreferredArea)) return;

    const area = value as DiagnosisPreferredArea;
    const currentAreas = answers.preferredAreas ?? [];
    const nextAreas = currentAreas.includes(area)
      ? currentAreas.filter((item) => item !== area)
      : [...currentAreas, area];

    setAnswers({ ...answers, preferredAreas: nextAreas });
    setAreaError("");
  }

  function confirmPreferredAreas() {
    if (!canUseDiagnosis) {
      setGateOpen(true);
      return;
    }
    const areas = answers.preferredAreas ?? [];
    if (areas.length === 0) {
      setAreaError("希望エリアを1つ以上選んでください。");
      return;
    }
    if (step < DIAGNOSIS_QUESTIONS.length - 1) {
      setStep(step + 1);
      return;
    }
    finishWithAnswers(answers);
  }

  function reset() {
    setStep(0);
    setAnswers(EMPTY_ANSWERS);
    setResult(null);
    setPhase("questions");
    setAreaError("");
    completionKeyRef.current = null;
  }

  useEffect(() => {
    if (phase !== "results" || !resultsRef.current) return;
    resultsRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [phase]);

  useEffect(() => {
    if (phase !== "results" || !result || !completionKeyRef.current) return;
    const areas = answers.preferredAreas ?? [];
    void trackJobDiagnosisCompleted({
      completionKey: completionKeyRef.current,
      resultJobType: result.topTwo[0]?.jobType ?? null,
      area: areas[0] ?? null,
    });
  }, [phase, result, answers.preferredAreas]);

  const showGuestGate = ready && !canUseDiagnosis;

  return (
    <section
      id="night-job-diagnosis"
      className="job-diagnosis-section scroll-mt-24"
    >
      <div className="job-diagnosis-shell">
        <p className="job-diagnosis-eyebrow">Diagnosis</p>
        <h2 className="job-diagnosis-title font-serif">あなたに合う職種診断</h2>
        <p className="job-diagnosis-subtitle">
          約1分・{DIAGNOSIS_QUESTIONS.length}の質問で
          <br />
          あなたに向いている夜職が分かります。
        </p>

        {showGuestGate ? (
          <div className="job-diagnosis-guest-gate">
            <p className="job-diagnosis-guest-gate-badge">
              <span aria-hidden>🔒</span> LINE会員限定
            </p>
            <p className="job-diagnosis-guest-gate-text">
              職種診断はLINEログイン後に利用できます。診断結果を保存して、あなたに合う職種や求人をいつでも確認できます。
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

            {phase !== "results" && phase !== "transition" && (
              <div className="job-diagnosis-question-wrap">
                <p className="job-diagnosis-step">
                  Q{step + 1} / {DIAGNOSIS_QUESTIONS.length}
                </p>
                <p className="job-diagnosis-question font-serif">{current.title}</p>
                {current.hint ? (
                  <p className="job-diagnosis-question-hint">{current.hint}</p>
                ) : null}

                {current.multiSelect ? (
                  <div className="job-diagnosis-multi">
                    <div
                      className="job-diagnosis-options job-diagnosis-options-multi"
                      role="group"
                      aria-label={current.title}
                    >
                      {current.options.map((option) => {
                        const checked = selectedAreas.includes(
                          option.value as DiagnosisPreferredArea,
                        );
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => togglePreferredArea(option.value)}
                            className={`job-diagnosis-option job-diagnosis-option-check ${
                              checked ? "is-selected" : ""
                            }`}
                            aria-pressed={checked}
                          >
                            <span className="job-diagnosis-checkbox" aria-hidden>
                              {checked ? "☑" : "□"}
                            </span>
                            <span>{option.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    {areaError ? (
                      <p className="job-diagnosis-multi-error" role="alert">
                        {areaError}
                      </p>
                    ) : null}
                    <button
                      type="button"
                      onClick={confirmPreferredAreas}
                      className="job-diagnosis-multi-next"
                    >
                      次へ
                    </button>
                  </div>
                ) : (
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
                )}
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
                <JobTypeDiagnosisResults
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
        title="職種診断はLINEログイン後に利用できます"
        description="診断結果を保存して、あなたに合う職種や求人をいつでも確認できます。"
        redirectPath={MEMBER_PATHS.diagnosis}
        action="diagnosis"
      />
    </section>
  );
}
