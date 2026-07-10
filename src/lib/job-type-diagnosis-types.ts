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
  resultSignature: string;
};

export type SavedDiagnosisResult = {
  id?: string;
  diagnosedAt: string;
  firstJobType: DiagnosisJobType | string;
  firstPercent: number;
  secondJobType: DiagnosisJobType | string;
  secondPercent: number;
};

export type RecommendedDiagnosisShop = {
  jobId: string;
  shopName: string;
  imageUrl: string | null;
  areaLabel: string;
  salary: string;
  jobType: JobType;
  reason: string;
  detailUrl: string;
};
