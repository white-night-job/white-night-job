import type { JobType } from "@/types/job";

export const DIAGNOSIS_JOB_TYPES = [
  "コンカフェ",
  "ガールズバー",
  "スナック",
  "ラウンジ",
  "クラブ",
  "キャバクラ（ニュークラブ）",
] as const;

export type DiagnosisJobType = (typeof DIAGNOSIS_JOB_TYPES)[number];

export type DiagnosisAnswers = {
  purpose: string | null;
  alcohol: string | null;
  serviceStyle: string | null;
  workTime: string | null;
  customerType: string | null;
  priority: string | null;
};

export type DiagnosisQuestion = {
  key: keyof DiagnosisAnswers;
  title: string;
  options: { label: string; value: string }[];
};

export const DIAGNOSIS_QUESTIONS: DiagnosisQuestion[] = [
  {
    key: "purpose",
    title: "働く目的は？",
    options: [
      { label: "楽しく働きたい", value: "fun" },
      { label: "しっかり稼ぎたい", value: "earn" },
      { label: "常連さんと長く付き合いたい", value: "regular" },
      { label: "接客スキルを身につけたい", value: "skill" },
    ],
  },
  {
    key: "alcohol",
    title: "お酒は？",
    options: [
      { label: "飲める", value: "yes" },
      { label: "少しだけ", value: "little" },
      { label: "飲めない", value: "no" },
    ],
  },
  {
    key: "serviceStyle",
    title: "どんな接客が好き？",
    options: [
      { label: "友達みたいに話したい", value: "friendly" },
      { label: "落ち着いて接客したい", value: "calm" },
      { label: "ワイワイ盛り上がりたい", value: "lively" },
      { label: "丁寧なおもてなしが好き", value: "hospitality" },
    ],
  },
  {
    key: "workTime",
    title: "働きたい時間",
    options: [
      { label: "夕方", value: "evening" },
      { label: "夜", value: "night" },
      { label: "深夜", value: "late" },
    ],
  },
  {
    key: "customerType",
    title: "どんなお客様がいい？",
    options: [
      { label: "若い方", value: "young" },
      { label: "会社員", value: "office" },
      { label: "経営者", value: "executive" },
      { label: "常連さん", value: "regular" },
    ],
  },
  {
    key: "priority",
    title: "一番重視すること",
    options: [
      { label: "働きやすさ", value: "comfort" },
      { label: "時給", value: "salary" },
      { label: "未経験歓迎", value: "beginner" },
      { label: "客層", value: "clientele" },
      { label: "自由さ", value: "freedom" },
    ],
  },
];

type ScoreMap = Record<DiagnosisJobType, number>;

const EMPTY_SCORES = (): ScoreMap =>
  Object.fromEntries(DIAGNOSIS_JOB_TYPES.map((type) => [type, 0])) as ScoreMap;

function addScores(target: ScoreMap, weights: Partial<Record<DiagnosisJobType, number>>) {
  for (const type of DIAGNOSIS_JOB_TYPES) {
    target[type] += weights[type] ?? 0;
  }
}

function scoreAnswers(answers: DiagnosisAnswers): ScoreMap {
  const scores = EMPTY_SCORES();

  switch (answers.purpose) {
    case "fun":
      addScores(scores, { コンカフェ: 4, ガールズバー: 3, スナック: 2 });
      break;
    case "earn":
      addScores(scores, { "キャバクラ（ニュークラブ）": 4, クラブ: 4, ラウンジ: 3 });
      break;
    case "regular":
      addScores(scores, { スナック: 5, ラウンジ: 2, ガールズバー: 2 });
      break;
    case "skill":
      addScores(scores, { ラウンジ: 4, "キャバクラ（ニュークラブ）": 3, クラブ: 3 });
      break;
  }

  switch (answers.alcohol) {
    case "yes":
      addScores(scores, { クラブ: 3, ラウンジ: 3, "キャバクラ（ニュークラブ）": 3 });
      break;
    case "little":
      addScores(scores, { ガールズバー: 3, スナック: 3, ラウンジ: 2 });
      break;
    case "no":
      addScores(scores, { コンカフェ: 4, ガールズバー: 3, スナック: 2 });
      break;
  }

  switch (answers.serviceStyle) {
    case "friendly":
      addScores(scores, { ガールズバー: 4, コンカフェ: 4, スナック: 2 });
      break;
    case "calm":
      addScores(scores, { ラウンジ: 4, スナック: 4, クラブ: 2 });
      break;
    case "lively":
      addScores(scores, { ガールズバー: 4, コンカフェ: 3, クラブ: 2 });
      break;
    case "hospitality":
      addScores(scores, { "キャバクラ（ニュークラブ）": 4, クラブ: 4, ラウンジ: 3 });
      break;
  }

  switch (answers.workTime) {
    case "evening":
      addScores(scores, { スナック: 4, コンカフェ: 3, ガールズバー: 2 });
      break;
    case "night":
      addScores(scores, { ガールズバー: 4, ラウンジ: 3, コンカフェ: 2 });
      break;
    case "late":
      addScores(scores, { クラブ: 4, "キャバクラ（ニュークラブ）": 4, ラウンジ: 2 });
      break;
  }

  switch (answers.customerType) {
    case "young":
      addScores(scores, { ガールズバー: 4, コンカフェ: 4 });
      break;
    case "office":
      addScores(scores, { ラウンジ: 4, ガールズバー: 3, スナック: 2 });
      break;
    case "executive":
      addScores(scores, { "キャバクラ（ニュークラブ）": 4, クラブ: 4, ラウンジ: 3 });
      break;
    case "regular":
      addScores(scores, { スナック: 5, ラウンジ: 2 });
      break;
  }

  switch (answers.priority) {
    case "comfort":
      addScores(scores, { スナック: 4, コンカフェ: 3, ガールズバー: 2 });
      break;
    case "salary":
      addScores(scores, { "キャバクラ（ニュークラブ）": 4, クラブ: 4, ラウンジ: 3 });
      break;
    case "beginner":
      addScores(scores, { ガールズバー: 4, コンカフェ: 4, スナック: 3 });
      break;
    case "clientele":
      addScores(scores, { ラウンジ: 4, "キャバクラ（ニュークラブ）": 3, クラブ: 3 });
      break;
    case "freedom":
      addScores(scores, { ガールズバー: 4, コンカフェ: 3, スナック: 2 });
      break;
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

const JOB_PROFILES: Record<
  DiagnosisJobType,
  { reason: string; points: string[]; merits: string[] }
> = {
  コンカフェ: {
    reason: "世界観を楽しみながら、フレンドリーな接客がしやすいタイプです。",
    points: ["お話好きな方に向いています", "お酒が苦手でも働きやすい", "未経験でも始めやすい"],
    merits: ["テーマ性があって楽しい", "接客のハードルが比較的低め", "シフトの自由度が高いことも"],
  },
  ガールズバー: {
    reason: "カジュアルな雰囲気の中で、会話を楽しみながら働きたい方に合います。",
    points: ["友達感覚の接客が得意", "夜の時間帯に働きたい", "未経験歓迎の店舗が多い"],
    merits: ["始めやすい職種のひとつ", "時給と働きやすさのバランスが良い", "接客経験を積みやすい"],
  },
  スナック: {
    reason: "常連さんとの距離が近く、落ち着いた雰囲気で長く働きたい方に向いています。",
    points: ["人との距離感が近い接客が好き", "夕方〜夜の時間帯が合う", "働きやすさを重視したい"],
    merits: ["アットホームな環境", "常連づくりのやりがい", "無理の少ないシフトも多い"],
  },
  ラウンジ: {
    reason: "落ち着いた接客と上品な雰囲気で、しっかりした接客スキルを身につけたい方に合います。",
    points: ["丁寧な接客が得意", "客層や雰囲気を重視", "安定感のある働き方がしたい"],
    merits: ["接客スキルが身につく", "落ち着いた店内が多い", "時給面も期待できる"],
  },
  クラブ: {
    reason: "しっかり稼ぎたい方や、ハイクラスな接客に挑戦したい方に向いています。",
    points: ["時給を重視", "深夜帯も問題ない", "お酒に強みがある"],
    merits: ["高単価を狙いやすい", "フォーマルな接客経験になる", "スキルアップの幅が広い"],
  },
  "キャバクラ（ニュークラブ）": {
    reason: "しっかり稼ぎたい方や、丁寧なホスピタリティを磨きたい方に最適です。",
    points: ["時給を最重視", "経営者・会社員との接客に興味", "身だしなみに自信がある"],
    merits: ["高収入を目指しやすい", "接客スキルが伸びやすい", "未経験歓迎の店舗も多い"],
  },
};

export type DiagnosisResultItem = {
  jobType: DiagnosisJobType;
  percent: number;
  reason: string;
  points: string[];
  merits: string[];
  jobsUrl: string;
};

export type DiagnosisResult = {
  diagnosedAt: string;
  ranked: DiagnosisResultItem[];
  topTwo: [DiagnosisResultItem, DiagnosisResultItem];
  advice: string[];
};

export function buildDiagnosisAdvice(
  answers: DiagnosisAnswers,
  top: DiagnosisResultItem,
): string[] {
  const advice: string[] = [];

  if (answers.priority === "beginner" || top.jobType === "ガールズバー" || top.jobType === "コンカフェ") {
    advice.push("未経験でも始めやすい職種です");
  }
  advice.push("まずは体験入店がおすすめです");
  if (answers.serviceStyle === "friendly" || answers.purpose === "fun") {
    advice.push("人と話すことが好きなあなたに向いています");
  }
  if (answers.priority === "salary") {
    advice.push("時給面を重視するなら、条件比較が大切です");
  }
  if (answers.alcohol === "no") {
    advice.push("お酒が苦手でも働きやすい店舗を優先して探しましょう");
  }
  if (answers.customerType === "regular") {
    advice.push("常連さんとの関係づくりがやりがいになる職種です");
  }

  return advice.slice(0, 4);
}

export function calculateDiagnosisResult(answers: DiagnosisAnswers): DiagnosisResult {
  const scores = scoreAnswers(answers);
  const percents = toPercentages(scores);

  const ranked = DIAGNOSIS_JOB_TYPES.map((type) => {
    const profile = JOB_PROFILES[type];
    return {
      jobType: type,
      percent: percents[type],
      reason: profile.reason,
      points: profile.points,
      merits: profile.merits,
      jobsUrl: buildDiagnosisJobsUrl(type),
    };
  }).sort((a, b) => b.percent - a.percent);

  const topTwo = [ranked[0], ranked[1]] as [DiagnosisResultItem, DiagnosisResultItem];

  return {
    diagnosedAt: new Date().toISOString(),
    ranked,
    topTwo,
    advice: buildDiagnosisAdvice(answers, topTwo[0]),
  };
}

export type SavedDiagnosisResult = {
  diagnosedAt: string;
  firstJobType: DiagnosisJobType;
  firstPercent: number;
  secondJobType: DiagnosisJobType;
  secondPercent: number;
};

export function formatDiagnosisDate(value: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}
