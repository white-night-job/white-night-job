import type { SupabaseClient } from "@supabase/supabase-js";

export type JobApplicationType = "line" | "phone";

export type JobApplicationCounts = {
  line: number;
  phone: number;
  total: number;
};

export function emptyApplicationCounts(): JobApplicationCounts {
  return { line: 0, phone: 0, total: 0 };
}

export async function fetchApplicationStats(
  supabase: SupabaseClient,
): Promise<Record<string, JobApplicationCounts>> {
  const { data, error } = await supabase
    .from("job_applications")
    .select("job_id, type");

  if (error) throw error;
  return aggregateApplicationCounts(data ?? []);
}

export function fillApplicationStatsForJobs(
  jobs: { id: string }[],
  stats: Record<string, JobApplicationCounts>,
): Record<string, JobApplicationCounts> {
  const filled = { ...stats };
  for (const job of jobs) {
    if (!filled[job.id]) {
      filled[job.id] = emptyApplicationCounts();
    }
  }
  return filled;
}

export function aggregateApplicationCounts(
  rows: { job_id: string; type: string }[],
): Record<string, JobApplicationCounts> {
  const stats: Record<string, JobApplicationCounts> = {};

  for (const row of rows) {
    if (row.type !== "line" && row.type !== "phone") continue;
    const current = stats[row.job_id] ?? emptyApplicationCounts();
    if (row.type === "line") current.line += 1;
    else current.phone += 1;
    current.total = current.line + current.phone;
    stats[row.job_id] = current;
  }

  return stats;
}

export async function recordJobApplication(
  jobId: string,
  type: JobApplicationType,
): Promise<void> {
  try {
    await fetch(`/api/jobs/${jobId}/applications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    });
  } catch {
    // 記録失敗時も応募導線は継続する
  }
}
