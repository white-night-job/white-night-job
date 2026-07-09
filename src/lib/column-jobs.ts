import { rowToJob } from "@/lib/job-db";
import { createSupabaseAdmin } from "@/lib/supabase";
import type { Job } from "@/types/job";

export type ColumnJobFilter = {
  jobType?: string;
  benefit?: string;
  district?: string;
  pickup?: boolean;
  limit?: number;
};

export async function fetchColumnRecommendedJobs(
  filter: ColumnJobFilter = {},
): Promise<Job[]> {
  const supabase = createSupabaseAdmin();
  const limit = filter.limit ?? 3;

  let query = supabase
    .from("jobs")
    .select("*")
    .eq("published", true)
    .order("pickup_enabled", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (filter.jobType) query = query.eq("job_type", filter.jobType);
  if (filter.district) query = query.eq("district", filter.district);
  if (filter.pickup) query = query.eq("pickup_enabled", true);

  const { data, error } = await query;
  if (error || !data) return [];

  let jobs = data.map((row) => rowToJob(row));

  if (filter.benefit) {
    jobs = jobs.filter((job) => job.benefits.includes(filter.benefit!));
  }

  return jobs.slice(0, limit);
}
