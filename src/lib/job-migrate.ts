import { DISTRICTS } from "@/data/districts";
import { FIXED_AREA, JOB_TYPES, type District, type Job, type JobType } from "@/types/job";

const LEGACY_JOB_TYPE_MAP: Record<string, JobType> = {
  キャバクラ: "クラブ",
  ニュークラブ: "ニュークラ",
  ホスト: "クラブ",
  ガールズバー: "ガールズバー",
  コンカフェ: "コンカフェ",
  ラウンジ: "ラウンジ",
  ニュークラ: "ニュークラ",
  クラブ: "クラブ",
  スナック: "スナック",
};

export function migrateJobType(value: string): JobType {
  const mapped = LEGACY_JOB_TYPE_MAP[value];
  if (mapped && JOB_TYPES.includes(mapped)) return mapped;
  return "ラウンジ";
}

export function inferDistrict(job: Partial<Job>): District {
  if (job.district && DISTRICTS.includes(job.district)) return job.district;
  const text = `${job.introductionText ?? ""} ${job.descriptionText ?? ""} ${job.title ?? ""}`;
  if (text.includes("すすきの")) return "すすきの";
  if (text.includes("琴似")) return "琴似";
  if (text.includes("24条")) return "24条";
  if (text.includes("手稲")) return "手稲";
  return "すすきの";
}

export function migrateJob(raw: Job): Job {
  return {
    ...raw,
    area: FIXED_AREA,
    district: inferDistrict(raw),
    jobType: migrateJobType(raw.jobType as string),
  };
}
