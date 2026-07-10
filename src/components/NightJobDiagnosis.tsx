"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useUserSession } from "@/components/UserSessionProvider";
import {
  calculateDiagnosisResult,
  DIAGNOSIS_QUESTIONS,
  type DiagnosisAnswers,
  type DiagnosisResult,
  type DiagnosisResultItem,
} from "@/lib/job-type-diagnosis";

const EMPTY_ANSWERS: DiagnosisAnswers = {
  purpose: null,
  alcohol: null,
  serviceStyle: null,
  workTime: null,
  customerType: null,
  priority: null,
};

function MedalCard({
  rank,
  item,
  delayMs,
}: {
  rank: 1 | 2;
  item: DiagnosisResultItem;
  delayMs: number;
}) {
  const medal = rank === 1 ? "🥇" : "🥈";
  const rankLabel = rank === 1 ? "第1位" : "第2位";

  return (
    <article
      className={`job-diagnosis-result-card job-diagnosis-result-card-rank-${rank}`}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div className="job-diagnosis-result-medal" aria-hidden>
        {medal}
      </div>
      <p className="job-diagnosis-result-rank">{rankLabel}</p>
      <h3 className="job-diagnosis-result-job font-serif">{item.jobType}</h3>

      <div className="job-diagnosis-result-meter-wrap">
        <p className="job-diagnosis-result-meter-label">適性</p>
        <div className="job-diagnosis-result-meter">
          <div
            className="job-diagnosis-result-meter-fill"
            style={{ width: `${item.percent}%` }}
          />
        </div>
        <p className="job-diagnosis-result-percent">{item.percent}%</p>
      </div>

      <div className="job-diagnosis-result-block">
        <p className="job-diagnosis-result-block-title">おすすめ理由</p>
        <p className="job-diagnosis-result-block-text">{item.reason}</p>
      </div>

      <div className="job-diagnosis-result-block">
        <p className="job-diagnosis-result-block-title">向いているポイント</p>
        <ul className="job-diagnosis-result-list">
          {item.points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </div>

      <div className="job-diagnosis-result-block">
        <p className="job-diagnosis-result-block-title">メリット</p>
        <ul className="job-diagnosis-result-list">
          {item.merits.map((merit) => (
            <li key={merit}>{merit}</li>
          ))}
        </ul>
      </div>

      <Link href={item.jobsUrl} className="job-diagnosis-result-jobs-btn">
        この職種の求人を見る
      </Link>
    </article>
  );
}

export function NightJobDiagnosis() {
  const { isLoggedIn, ready } = useUserSession();
  const resultsRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<DiagnosisAnswers>(EMPTY_ANSWERS);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [phase, setPhase] = useState<"questions" | "transition" | "results">("questions");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

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
    setSaveMessage("");
  }

  async function saveToMyPage() {
    if (!result) return;

    if (!isLoggedIn) {
      const redirect = `${window.location.pathname}${window.location.search}#night-job-diagnosis`;
      window.location.href = `/api/line/login?redirect=${encodeURIComponent(redirect)}`;
      return;
    }

    setSaving(true);
    setSaveMessage("");
    try {
      const response = await fetch("/api/job-type-diagnosis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          diagnosedAt: result.diagnosedAt,
          firstJobType: result.topTwo[0].jobType,
          firstPercent: result.topTwo[0].percent,
          secondJobType: result.topTwo[1].jobType,
          secondPercent: result.topTwo[1].percent,
          answers,
        }),
      });
      const data = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(data.message ?? "保存に失敗しました。");
      }
      setSaveMessage("診断結果をマイページに保存しました。");
    } catch (error) {
      setSaveMessage(
        error instanceof Error ? error.message : "保存に失敗しました。",
      );
    } finally {
      setSaving(false);
    }
  }

  async function shareResult() {
    if (!result) return;

    const text = `あなたに合う職種診断の結果\n🥇 ${result.topTwo[0].jobType} ${result.topTwo[0].percent}%\n🥈 ${result.topTwo[1].jobType} ${result.topTwo[1].percent}%`;
    const url = `${window.location.origin}/#night-job-diagnosis`;

    if (navigator.share) {
      try {
        await navigator.share({ title: "あなたに合う職種診断", text, url });
        return;
      } catch {
        // fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setSaveMessage("結果をクリップボードにコピーしました。");
    } catch {
      setSaveMessage("シェアに失敗しました。");
    }
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
          <div ref={resultsRef} className="job-diagnosis-results job-diagnosis-results-visible">
            <p className="job-diagnosis-results-heading font-serif">診断結果</p>

            <MedalCard rank={1} item={result.topTwo[0]} delayMs={80} />
            <MedalCard rank={2} item={result.topTwo[1]} delayMs={180} />

            <section className="job-diagnosis-advice-card">
              <h3 className="job-diagnosis-advice-title font-serif">あなたへのアドバイス</h3>
              <ul className="job-diagnosis-advice-list">
                {result.advice.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </section>

            <div className="job-diagnosis-actions">
              <button
                type="button"
                onClick={() => void saveToMyPage()}
                disabled={saving || !ready}
                className="job-diagnosis-save-btn"
              >
                {saving ? "保存中..." : "診断結果をLINEへ保存"}
              </button>
              {saveMessage && (
                <p className="job-diagnosis-save-message">{saveMessage}</p>
              )}
              {!isLoggedIn && ready && (
                <p className="job-diagnosis-save-hint">
                  LINEログイン後、マイページでいつでも確認できます。
                </p>
              )}
            </div>

            <div className="job-diagnosis-secondary-actions">
              <button
                type="button"
                onClick={reset}
                className="job-diagnosis-secondary-btn"
              >
                もう一度診断する
              </button>
              <button
                type="button"
                onClick={() => void shareResult()}
                className="job-diagnosis-secondary-btn"
              >
                友達にシェア
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
