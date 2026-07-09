"use client";

import Link from "next/link";
import { useState } from "react";
import { fetchJobs } from "@/lib/job-storage";
import type { Job } from "@/types/job";

type Answers = {
  beginner: boolean | null;
  canDrink: boolean | null;
  minSalary: string | null;
  frequency: string | null;
  agePreference: string | null;
};

const QUESTIONS = [
  {
    key: "beginner" as const,
    title: "ナイトワークは初めてですか？",
    options: [
      { label: "はい（未経験）", value: true },
      { label: "いいえ（経験あり）", value: false },
    ],
  },
  {
    key: "canDrink" as const,
    title: "お酒は飲めますか？",
    options: [
      { label: "飲める", value: true },
      { label: "飲めない", value: false },
    ],
  },
  {
    key: "minSalary" as const,
    title: "希望時給は？",
    options: [
      { label: "2,000円以上", value: "2000" },
      { label: "2,500円以上", value: "2500" },
      { label: "3,000円以上", value: "3000" },
      { label: "3,500円以上", value: "3500" },
    ],
  },
  {
    key: "frequency" as const,
    title: "働く頻度は？",
    options: [
      { label: "週1〜2日", value: "light" },
      { label: "週3〜4日", value: "medium" },
      { label: "週5日以上", value: "heavy" },
    ],
  },
  {
    key: "agePreference" as const,
    title: "お客様の年齢層の希望は？",
    options: [
      { label: "若い層が多いお店", value: "young" },
      { label: "落ち着いた層が多いお店", value: "mature" },
      { label: "こだわらない", value: "any" },
    ],
  },
];

function parseHourly(salary: string): number {
  const match = salary.match(/(\d[\d,]*)/);
  if (!match) return 0;
  return Number(match[1].replace(/,/g, ""));
}

function scoreJob(job: Job, answers: Answers): number {
  let score = 0;

  if (answers.beginner === true && job.benefits.includes("未経験者大歓迎")) {
    score += 20;
  }
  if (answers.beginner === false && job.benefits.includes("経験者優遇")) {
    score += 12;
  }
  if (answers.canDrink === false && job.benefits.includes("お酒飲めなくてもOK")) {
    score += 18;
  }
  if (answers.minSalary) {
    const hourly = parseHourly(job.salary);
    if (hourly >= Number(answers.minSalary)) score += 15;
  }
  if (answers.frequency === "light") {
    if (job.benefits.includes("週1出勤OK") || job.benefits.includes("月1出勤OK")) {
      score += 12;
    }
  }
  if (answers.agePreference === "young" && (job.customerAgeLevel ?? 0) >= 3) {
    score += 8;
  }
  if (answers.agePreference === "mature" && (job.customerAgeLevel ?? 0) <= 2) {
    score += 8;
  }
  if (job.isVerified) score += 5;
  if (job.pickupEnabled) score += 3;

  return score;
}

export function NightJobDiagnosis() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({
    beginner: null,
    canDrink: null,
    minSalary: null,
    frequency: null,
    agePreference: null,
  });
  const [results, setResults] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const current = QUESTIONS[step];

  async function finish(nextAnswers: Answers) {
    setLoading(true);
    try {
      const jobs = await fetchJobs();
      const ranked = jobs
        .map((job) => ({ job, score: scoreJob(job, nextAnswers) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map((item) => item.job);
      setResults(ranked);
      setDone(true);
    } finally {
      setLoading(false);
    }
  }

  function handleSelect(value: boolean | string) {
    const key = current.key;
    const next = { ...answers, [key]: value } as Answers;
    setAnswers(next);
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
      return;
    }
    void finish(next);
  }

  function reset() {
    setStep(0);
    setAnswers({
      beginner: null,
      canDrink: null,
      minSalary: null,
      frequency: null,
      agePreference: null,
    });
    setResults([]);
    setDone(false);
  }

  return (
    <section className="rounded-2xl border border-gold/25 bg-white p-5 shadow-gold sm:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-dark">
        Diagnosis
      </p>
      <h2 className="mt-1 font-serif text-xl font-semibold text-charcoal">
        あなたに合うお店診断
      </h2>

      {!done ? (
        <div className="mt-4">
          <p className="text-xs text-muted">
            質問 {step + 1} / {QUESTIONS.length}
          </p>
          <p className="mt-2 font-medium text-charcoal">{current.title}</p>
          <div className="mt-4 grid gap-2">
            {current.options.map((option) => (
              <button
                key={option.label}
                type="button"
                disabled={loading}
                onClick={() => handleSelect(option.value)}
                className="min-h-11 rounded-full border border-gold/35 bg-ivory px-4 text-sm font-semibold text-charcoal transition hover:border-gold hover:bg-white"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-muted">あなたにおすすめの店舗</p>
          {results.length === 0 ? (
            <p className="text-sm text-muted">該当する店舗が見つかりませんでした。</p>
          ) : (
            results.map((job) => (
              <article
                key={job.id}
                className="rounded-xl border border-gold/20 bg-ivory p-4"
              >
                <p className="font-serif font-semibold text-charcoal">{job.shopName}</p>
                <p className="mt-1 text-xs text-muted">
                  {job.district} · {job.jobType} · {job.salary}
                </p>
                <Link
                  href={`/jobs/${job.id}`}
                  className="mt-3 inline-flex min-h-10 items-center justify-center rounded-full bg-gradient-to-r from-gold to-gold-dark px-4 text-xs font-semibold text-white"
                >
                  詳細を見る
                </Link>
              </article>
            ))
          )}
          <button
            type="button"
            onClick={reset}
            className="text-sm font-medium text-gold-dark underline-offset-2 hover:underline"
          >
            もう一度診断する
          </button>
        </div>
      )}
    </section>
  );
}
