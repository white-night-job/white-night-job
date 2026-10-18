import { DIAGNOSIS_JOB_TYPES, type DiagnosisJobType } from "@/lib/job-type-diagnosis-types";
import { createSupabaseAdmin } from "@/lib/supabase";
import type { JobType } from "@/types/job";

export type DiagnosisApplyTendency =
  | {
      status: "ready";
      metric: "apply_button";
      percent: number;
      jobType: DiagnosisJobType;
      jobTypeLabel: string;
      cohortSize: number;
      clickedSize: number;
    }
  | {
      status: "insufficient";
    };

const PAGE = 1000;
const MAX_ROWS = 8000;

function isDiagnosisJobType(value: string): value is DiagnosisJobType {
  return (DIAGNOSIS_JOB_TYPES as readonly string[]).includes(value);
}

function diagnosisLabel(type: DiagnosisJobType): string {
  if (type === "キャバクラ（ニュークラブ）") return "ニュークラブ";
  return type;
}

function toDiagnosisJobType(jobType: string): DiagnosisJobType | null {
  if (jobType === "ニュークラ") return "キャバクラ（ニュークラブ）";
  return isDiagnosisJobType(jobType) ? jobType : null;
}

function personKey(row: { anonymous_id?: string | null; user_id?: string | null }) {
  const userId = row.user_id?.trim();
  if (userId) return `user:${userId}`;
  const anonymousId = row.anonymous_id?.trim();
  if (anonymousId) return `anon:${anonymousId}`;
  return null;
}

function resultJobType(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object") return null;
  const value = (metadata as { result_job_type?: unknown }).result_job_type;
  return typeof value === "string" ? value.trim() : null;
}

async function fetchEvents(
  eventTypes: string[],
  columns: string,
) {
  const supabase = createSupabaseAdmin();
  const rows: Array<Record<string, unknown>> = [];
  for (let from = 0; from < MAX_ROWS; from += PAGE) {
    const { data, error } = await supabase
      .from("user_activity_events")
      .select(columns)
      .in("event_type", eventTypes)
      .range(from, from + PAGE - 1);
    if (error) throw error;
    const batch = (data ?? []) as unknown as Array<Record<string, unknown>>;
    rows.push(...batch);
    if (batch.length < PAGE) break;
  }
  return rows;
}

/**
 * 同じ第1位診断の人のうち、応募ボタンを押した割合。
 * job_applications / line_click は応募完了ではないため使わない。
 */
export async function computeDiagnosisApplyTendency(
  firstJobType: DiagnosisJobType,
): Promise<DiagnosisApplyTendency> {
  const diagnoses = await fetchEvents(
    ["job_diagnosis_complete"],
    "anonymous_id, user_id, metadata",
  );
  const cohort = new Set<string>();
  for (const row of diagnoses) {
    if (resultJobType(row.metadata) !== firstJobType) continue;
    const key = personKey(row);
    if (key) cohort.add(key);
  }
  if (cohort.size === 0) return { status: "insufficient" };

  const clicks = await fetchEvents(
    ["line_apply_click", "phone_apply_click"],
    "anonymous_id, user_id, job_id",
  );
  const clickedJobIds = new Set<string>();
  const clicksByPerson = new Map<string, Set<string>>();
  for (const row of clicks) {
    const key = personKey(row);
    const jobId = typeof row.job_id === "string" ? row.job_id : "";
    if (!key || !cohort.has(key) || !jobId) continue;
    clickedJobIds.add(jobId);
    const current = clicksByPerson.get(key) ?? new Set<string>();
    current.add(jobId);
    clicksByPerson.set(key, current);
  }
  if (clicksByPerson.size === 0 || clickedJobIds.size === 0) {
    return { status: "insufficient" };
  }

  const supabase = createSupabaseAdmin();
  const { data: jobs, error } = await supabase
    .from("jobs")
    .select("id, job_type")
    .in("id", [...clickedJobIds]);
  if (error) throw error;

  const jobTypeById = new Map<string, DiagnosisJobType>();
  for (const job of jobs ?? []) {
    const mapped = toDiagnosisJobType(String((job as { job_type?: JobType }).job_type ?? ""));
    if (mapped) jobTypeById.set(String((job as { id: string }).id), mapped);
  }

  const counts = new Map<DiagnosisJobType, number>();
  for (const jobIds of clicksByPerson.values()) {
    const types = new Set<DiagnosisJobType>();
    for (const jobId of jobIds) {
      const type = jobTypeById.get(jobId);
      if (type) types.add(type);
    }
    for (const type of types) {
      counts.set(type, (counts.get(type) ?? 0) + 1);
    }
  }

  let bestType: DiagnosisJobType | null = null;
  let bestCount = 0;
  for (const [type, count] of counts) {
    if (count > bestCount) {
      bestType = type;
      bestCount = count;
    }
  }
  if (!bestType || bestCount === 0) return { status: "insufficient" };

  return {
    status: "ready",
    metric: "apply_button",
    percent: Math.round((bestCount / cohort.size) * 100),
    jobType: bestType,
    jobTypeLabel: diagnosisLabel(bestType),
    cohortSize: cohort.size,
    clickedSize: clicksByPerson.size,
  };
}
