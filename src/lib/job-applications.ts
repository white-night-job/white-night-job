import type { SupabaseClient } from "@supabase/supabase-js";

export type JobApplicationType = "line" | "phone";

export type JobApplicationCounts = {
  line: number;
  phone: number;
  total: number;
};

export type JobApplicationHistoryItem = {
  type: JobApplicationType;
  createdAt: string;
};

export type JobApplicationDetail = JobApplicationCounts & {
  latestAt: string | null;
  history: JobApplicationHistoryItem[];
};

type ApplicationRow = {
  job_id: string;
  type: string;
  created_at: string;
};

export function emptyApplicationCounts(): JobApplicationCounts {
  return { line: 0, phone: 0, total: 0 };
}

export function emptyApplicationDetail(): JobApplicationDetail {
  return { ...emptyApplicationCounts(), latestAt: null, history: [] };
}

export function getApplicationTypeLabel(type: JobApplicationType): string {
  return type === "line" ? "LINE応募" : "電話応募";
}

export function formatApplicationDateTime(iso: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

function katakanaToHiragana(text: string): string {
  return text.replace(/[\u30a1-\u30f6]/g, (char) =>
    String.fromCharCode(char.charCodeAt(0) - 0x60),
  );
}

export function normalizeForSearch(text: string): string {
  return katakanaToHiragana(text.normalize("NFKC").toLowerCase());
}

export function matchesShopSearch(shopName: string, query: string): boolean {
  const trimmed = query.trim();
  if (!trimmed) return true;
  return normalizeForSearch(shopName).includes(normalizeForSearch(trimmed));
}

export function buildApplicationDetails(
  rows: ApplicationRow[],
): Record<string, JobApplicationDetail> {
  const details: Record<string, JobApplicationDetail> = {};

  for (const row of rows) {
    if (row.type !== "line" && row.type !== "phone") continue;
    const current = details[row.job_id] ?? emptyApplicationDetail();

    if (row.type === "line") current.line += 1;
    else current.phone += 1;
    current.total = current.line + current.phone;

    current.history.push({
      type: row.type,
      createdAt: row.created_at,
    });

    if (!current.latestAt || row.created_at > current.latestAt) {
      current.latestAt = row.created_at;
    }

    details[row.job_id] = current;
  }

  for (const detail of Object.values(details)) {
    detail.history.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  return details;
}

export function aggregateApplicationCounts(
  rows: Pick<ApplicationRow, "job_id" | "type">[],
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

export async function fetchApplicationRows(
  supabase: SupabaseClient,
): Promise<ApplicationRow[]> {
  const { data, error } = await supabase
    .from("job_applications")
    .select("job_id, type, created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function fetchApplicationStats(
  supabase: SupabaseClient,
): Promise<Record<string, JobApplicationCounts>> {
  const rows = await fetchApplicationRows(supabase);
  return aggregateApplicationCounts(rows);
}

export async function fetchApplicationDetails(
  supabase: SupabaseClient,
): Promise<Record<string, JobApplicationDetail>> {
  const rows = await fetchApplicationRows(supabase);
  return buildApplicationDetails(rows);
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

export function fillApplicationDetailsForJobs(
  jobs: { id: string }[],
  details: Record<string, JobApplicationDetail>,
): Record<string, JobApplicationDetail> {
  const filled = { ...details };
  for (const job of jobs) {
    if (!filled[job.id]) {
      filled[job.id] = emptyApplicationDetail();
    }
  }
  return filled;
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
