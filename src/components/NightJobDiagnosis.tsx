"use client";

import { useEffect, useRef, useState } from "react";
import { JobTypeDiagnosisResults } from "@/components/JobTypeDiagnosisResults";
import {
  calculateDiagnosisResult,
  DIAGNOSIS_QUESTIONS,
  type DiagnosisAnswers,
  type DiagnosisResult,
} from "@/lib/job-type-diagnosis";

const EMPTY_ANSWERS: DiagnosisAnswers = {
  purpose: null,
  alcohol: null,
  serviceStyle: null,
  workTime: null,
  customerType: null,
  priority: null,
};

export function NightJobDiagnosis() {
  const resultsRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<DiagnosisAnswers>(EMPTY_ANSWERS);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [phase, setPhase] = useState<"questions" | "transition" | "results">("questions");

  const current = DIAGNOSIS_QUESTIONS[step];
  const progress = Math.round(((step + (phase === "results" ? 1 : 0)) / DIAGNOSIS_QUESTIONS.length) * 100);

  function handleSelect(value: string) {
    const key = current.key;
    const next = { ...answers, [key]: value } as DiagnosisAnswers;
    setAnswers(next);

    if (step < DIAGNOSIS_QUESTIONS.length - 1) {
      setStep(step + 1);
      return;
    }

    const nextResult = calculateDiagnosisResult(next);
    setResult(nextResult);
    setPhase("transition");

    window.setTimeout(() => {
      setPhase("results");
    }, 450);
  }

  function reset() {
    setStep(0);
    setAnswers(EMPTY_ANSWERS);
    setResult(null);
    setPhase("questions");
  }

  useEffect(() => {
    if (phase !== "results" || !resultsRef.current) return;
    resultsRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [phase]);

  return (
    <section
      id="night-job-diagnosis"
      className="job-diagnosis-section scroll-mt-24"
    >
      <div className="job-diagnosis-shell">
        <p className="job-diagnosis-eyebrow">Diagnosis</p>
        <h2 className="job-diagnosis-title font-serif">あなたに合う職種診断</h2>
        <p className="job-diagnosis-subtitle">
          約30秒・6つの質問で
          <br />
          あなたに向いている夜職が分かります。
        </p>

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
            <JobTypeDiagnosisResults
              result={result}
              answers={answers}
              onReset={reset}
            />
          </div>
        )}
      </div>
    </section>
  );
}
