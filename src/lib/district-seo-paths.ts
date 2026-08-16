import type { District, JobType } from "@/types/job";

type JobTypeSlug =
  | "girls-bar"
  | "new-club"
  | "lounge"
  | "snack"
  | "concept-cafe";

const JOB_TYPE_SLUGS: Array<{ slug: JobTypeSlug; jobType: JobType; displayName: string }> = [
  { slug: "girls-bar", jobType: "ガールズバー", displayName: "ガールズバー" },
  { slug: "new-club", jobType: "ニュークラ", displayName: "ニュークラブ" },
  { slug: "lounge", jobType: "ラウンジ", displayName: "ラウンジ" },
  { slug: "snack", jobType: "スナック", displayName: "スナック" },
  { slug: "concept-cafe", jobType: "コンカフェ", displayName: "コンカフェ" },
];

const AREA_META: Array<{
  district: District;
  areaLabel: string;
  areaPath: string;
}> = [
  { district: "すすきの", areaLabel: "すすきの", areaPath: "/sapporo/susukino" },
  { district: "琴似", areaLabel: "琴似", areaPath: "/sapporo/kotoni" },
  { district: "24条", areaLabel: "北24条", areaPath: "/sapporo/kita24jo" },
  { district: "手稲", areaLabel: "手稲", areaPath: "/sapporo/teine" },
];

function jobTypeSlugFromJobType(jobType: JobType): JobTypeSlug | null {
  return JOB_TYPE_SLUGS.find((item) => item.jobType === jobType)?.slug ?? null;
}

/** Lightweight area / job-type paths for breadcrumbs & internal links (client-safe). */
export function resolveDistrictSeoPaths(input: {
  district: District;
  jobType: JobType;
}): {
  areaPath: string | null;
  areaLabel: string;
  jobTypePath: string | null;
  jobTypeLabel: string;
} {
  const area = AREA_META.find((item) => item.district === input.district);
  const jobTypeMeta = JOB_TYPE_SLUGS.find((item) => item.jobType === input.jobType);
  const jobTypeSlug = jobTypeSlugFromJobType(input.jobType);

  if (!area) {
    return {
      areaPath: null,
      areaLabel: input.district,
      jobTypePath: null,
      jobTypeLabel: jobTypeMeta?.displayName ?? input.jobType,
    };
  }

  return {
    areaPath: area.areaPath,
    areaLabel: area.areaLabel,
    jobTypePath: jobTypeSlug ? `${area.areaPath}/${jobTypeSlug}` : null,
    jobTypeLabel: jobTypeMeta?.displayName ?? input.jobType,
  };
}
