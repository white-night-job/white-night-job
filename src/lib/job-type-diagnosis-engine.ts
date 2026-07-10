import { JOB_TYPE_DIAGNOSIS_CONFIG } from "@/data/job-type-diagnosis/config";
import type {
  DiagnosisAnswers,
  DiagnosisJobType,
  DiagnosisResult,
  DiagnosisResultItem,
} from "@/lib/job-type-diagnosis-types";
import { DIAGNOSIS_JOB_TYPES } from "@/lib/job-type-diagnosis-types";
import type { JobType } from "@/types/job";

type ScoreMap = Record<DiagnosisJobType, number>;

const EMPTY_SCORES = (): ScoreMap =>
  Object.fromEntries(DIAGNOSIS_JOB_TYPES.map((type) => [type, 0])) as ScoreMap;

function scoreAnswers(answers: DiagnosisAnswers): ScoreMap {
  const scores = EMPTY_SCORES();

  for (const rule of JOB_TYPE_DIAGNOSIS_CONFIG.scoringRules) {
    if (answers[rule.key] !== rule.value) continue;
    for (const type of DIAGNOSIS_JOB_TYPES) {
      scores[type] += rule.weights[type] ?? 0;
    }
  }

  return scores;
}

function toPercentages(scores: ScoreMap): Record<DiagnosisJobType, number> {
  const entries = DIAGNOSIS_JOB_TYPES.map((type) => [type, scores[type]] as const);
  const max = Math.max(...entries.map(([, score]) => score));
  const min = Math.min(...entries.map(([, score]) => score));
  const spread = max - min || 1;

  const percents = Object.fromEntries(
    entries.map(([type, score]) => {
      const value = Math.round(((score - min) / spread) * 46 + 48);
      return [type, Math.min(96, Math.max(48, value))];
    }),
  ) as Record<DiagnosisJobType, number>;

  const ranked = [...entries].sort((a, b) => b[1] - a[1]);
  const first = ranked[0][0];
  const second = ranked[1][0];
  if (percents[first] <= percents[second]) {
    percents[first] = Math.min(96, percents[second] + 7);
  }

  return percents;
}

export function mapDiagnosisJobTypeToFilter(type: DiagnosisJobType): JobType {
  if (type === "キャバクラ（ニュークラブ）") return "ニュークラ";
  return type;
}

export function buildDiagnosisJobsUrl(type: DiagnosisJobType): string {
  const jobType = mapDiagnosisJobTypeToFilter(type);
  return `/jobs?jobType=${encodeURIComponent(jobType)}`;
}

export function buildDiagnosisTrialJobsUrl(type: DiagnosisJobType): string {
  const jobType = mapDiagnosisJobTypeToFilter(type);
  const params = new URLSearchParams({
    jobType,
    benefit: "未経験者大歓迎",
  });
  return `/jobs?${params.toString()}`;
}

function buildDiagnosisAdvice(
  answers: DiagnosisAnswers,
  top: DiagnosisResultItem,
): string[] {
  const advice: string[] = [];

  if (
    answers.experience === "none" ||
    top.jobType === "ガールズバー" ||
    top.jobType === "コンカフェ"
  ) {
    advice.push("未経験でも始めやすい職種です");
  }
  advice.push("まずは体験入店がおすすめです");
  if (answers.serviceStyle === "friendly" || answers.priority === "fun") {
    advice.push("人と話すことが好きなあなたに向いています");
  }
  if (answers.priority === "earn_money" || answers.goal === "high_income") {
    advice.push("時給面を重視するなら、条件比較が大切です");
  }
  if (answers.alcohol === "no") {
    advice.push("お酒が苦手でも働きやすい店舗を優先して探しましょう");
  }
  if (answers.customerType === "regular") {
    advice.push("常連さんとの関係づくりがやりがいになる職種です");
  }
  if (answers.schedule === "week1_2" || answers.schedule === "undecided") {
    advice.push("週1〜2日から始められる店舗も多いので、無理のないペースで探しましょう");
  }

  return advice.slice(0, 4);
}

export function buildResultSignature(
  first: DiagnosisJobType,
  second: DiagnosisJobType,
): string {
  return `${first}|${second}`;
}

export function calculateDiagnosisResult(answers: DiagnosisAnswers): DiagnosisResult {
  const scores = scoreAnswers(answers);
  const percents = toPercentages(scores);

  const ranked = DIAGNOSIS_JOB_TYPES.map((type) => {
    const profile = JOB_TYPE_DIAGNOSIS_CONFIG.jobProfiles[type];
    return {
      jobType: type,
      percent: percents[type],
      reason: profile.reason,
      points: profile.points,
      merits: profile.merits,
      cautions: profile.cautions,
      jobsUrl: buildDiagnosisJobsUrl(type),
    };
  }).sort((a, b) => b.percent - a.percent);

  const topTwo = [ranked[0], ranked[1]] as [DiagnosisResultItem, DiagnosisResultItem];

  return {
    diagnosedAt: new Date().toISOString(),
    ranked,
    topTwo,
    advice: buildDiagnosisAdvice(answers, topTwo[0]),
    resultSignature: buildResultSignature(topTwo[0].jobType, topTwo[1].jobType),
  };
}

export function getSocialProofApplyRate(firstJobType: DiagnosisJobType): {
  percent: number;
  source: "dummy" | "live";
} {
  return {
    percent: JOB_TYPE_DIAGNOSIS_CONFIG.socialProofApplyRates[firstJobType],
    source: "dummy",
  };
}

export async function computeLiveSocialProofApplyRate(): Promise<number | null> {
  return null;
}

export function formatDiagnosisDate(value: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}

export const DIAGNOSIS_QUESTIONS = JOB_TYPE_DIAGNOSIS_CONFIG.questions;
