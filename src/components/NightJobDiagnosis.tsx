"use client";

import {
  Award,
  Briefcase,
  Calendar,
  CalendarCheck,
  CalendarDays,
  Check,
  CircleQuestionMark,
  Clock,
  Coffee,
  Coins,
  Crown,
  Flower2,
  Gem,
  GlassWater,
  HandHeart,
  Heart,
  Home,
  Layers,
  Hourglass,
  MessageCircle,
  Moon,
  PartyPopper,
  Shirt,
  Smile,
  Sparkles,
  Sprout,
  Sun,
  Trophy,
  Users,
  Wine,
  type LucideIcon,
} from "lucide-react";
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
  type DiagnosisResult,
} from "@/lib/job-type-diagnosis";
import { MEMBER_PATHS } from "@/lib/member-access";
import { usePreferredAreas } from "@/lib/preferred-areas-client";

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

const OPTION_ICONS: Record<string, Record<string, LucideIcon>> = {
  priority: {
    earn_money: Gem,
    fun: Smile,
    comfort: Clock,
    clientele: Users,
    freedom: Calendar,
  },
  experience: {
    none: Sprout,
    short: Hourglass,
    medium: CalendarDays,
    long: Award,
    veteran: Crown,
  },
  age: {
    age_18_20: Flower2,
    age_21_24: Sparkles,
    age_25_29: Heart,
    age_30_plus: Crown,
  },
  alcohol: {
    yes: Wine,
    little: GlassWater,
    no: Coffee,
  },
  serviceStyle: {
    friendly: Smile,
    lively: PartyPopper,
    calm: Moon,
    hospitality: HandHeart,
  },
  customerType: {
    young: Users,
    office: Briefcase,
    executive: Crown,
    regular: Heart,
  },
  goal: {
    pocket_money: Coins,
    living: Home,
    high_income: Gem,
    skill: Sparkles,
  },
  atmosphere: {
    cute: Flower2,
    bright: Sun,
    calm_space: Moon,
    luxury: Gem,
  },
  schedule: {
    week1_2: Calendar,
    week3_4: CalendarDays,
    week5_plus: CalendarCheck,
    undecided: CircleQuestionMark,
  },
  outfit: {
    uniform: Shirt,
    casual: Sparkles,
    dress: Flower2,
    onepiece: Heart,
    any: Layers,
  },
  personality: {
    outgoing: Smile,
    shy_warm: Heart,
    good_listener: MessageCircle,
    fashionable: Sparkles,
    competitive: Trophy,
  },
};

function optionIcon(questionKey: string, value: string) {
  return OPTION_ICONS[questionKey]?.[value] ?? Sparkles;
}

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
  const { areas: preferredAreas } = usePreferredAreas();

  const current = DIAGNOSIS_QUESTIONS[step];
  const questionTotal = DIAGNOSIS_QUESTIONS.length;
  const progress = Math.round(((step + 1) / questionTotal) * 100);
  const questionLabel = String(step + 1).padStart(2, "0");
  const questionTotalLabel = String(questionTotal).padStart(2, "0");

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

    const next = { ...answers, [current.key]: value } as DiagnosisAnswers;
    setAnswers(next);

    if (step < DIAGNOSIS_QUESTIONS.length - 1) {
      setStep(step + 1);
      return;
    }

    finishWithAnswers(next);
  }

  function goBack() {
    if (phase !== "questions" || step === 0) return;
    setStep(step - 1);
  }

  function reset() {
    setStep(0);
    setAnswers(EMPTY_ANSWERS);
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
    void trackJobDiagnosisCompleted({
      completionKey: completionKeyRef.current,
      resultJobType: result.topTwo[0]?.jobType ?? null,
      area: preferredAreas[0] ?? null,
    });
  }, [phase, result, preferredAreas]);

  const showGuestGate = ready && !canUseDiagnosis;

  return (
    <section
      id="night-job-diagnosis"
      className="job-diagnosis-section scroll-mt-24"
    >
      <div className="job-diagnosis-shell">
        <div className="job-diagnosis-decor" aria-hidden>
          <span className="job-diagnosis-glow" />
          <span className="job-diagnosis-petal job-diagnosis-petal-a" />
          <span className="job-diagnosis-petal job-diagnosis-petal-b" />
          <span className="job-diagnosis-petal job-diagnosis-petal-c" />
          <span className="job-diagnosis-spark job-diagnosis-spark-a" />
          <span className="job-diagnosis-spark job-diagnosis-spark-b" />
        </div>
        <div className="job-diagnosis-heading">
          <p className="job-diagnosis-eyebrow">Diagnosis</p>
          <span className="job-diagnosis-gold-line" aria-hidden />
          <h2 className="job-diagnosis-title font-serif">あなたに向いている職種診断</h2>
          <p className="job-diagnosis-subtitle">
            約1分・{questionTotal}の質問で
            <br />
            あなたに向いている夜職が分かります。
          </p>
        </div>

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
            {phase === "questions" && (
              <div className="job-diagnosis-progress-block">
                <div className="job-diagnosis-progress-meta">
                  <p className="job-diagnosis-progress-count">
                    {questionLabel}
                    <span> / {questionTotalLabel}</span>
                  </p>
                  <p className="job-diagnosis-progress-percent">{progress}%</p>
                </div>
                <div
                  className="job-diagnosis-progress"
                  role="progressbar"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`質問 ${step + 1} / ${questionTotal}`}
                >
                  <div
                    className="job-diagnosis-progress-fill"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {phase === "questions" && (
              <div key={current.key} className="job-diagnosis-question-wrap">
                <p className="job-diagnosis-question font-serif">{current.title}</p>

                <div className="job-diagnosis-options">
                  {current.options.map((option) => {
                    const selected = answers[current.key] === option.value;
                    const Icon = optionIcon(current.key, option.value);
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleSelect(option.value)}
                        className={`job-diagnosis-option${
                          selected ? " sales-style-option-selected" : ""
                        }`}
                        aria-pressed={selected}
                      >
                        <span className="job-diagnosis-option-icon" aria-hidden>
                          <Icon strokeWidth={1.5} />
                        </span>
                        <span className="job-diagnosis-option-label">{option.label}</span>
                        <span
                          className={`job-diagnosis-option-check${
                            selected ? " is-on" : ""
                          }`}
                          aria-hidden
                        >
                          <Check strokeWidth={2.25} />
                        </span>
                      </button>
                    );
                  })}
                </div>

                {step > 0 ? (
                  <button
                    type="button"
                    onClick={goBack}
                    className="job-diagnosis-back-btn"
                  >
                    ← 前の質問へ
                  </button>
                ) : null}
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
