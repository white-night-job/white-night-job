import type { SupabaseClient } from "@supabase/supabase-js";

export type InsertJobViewInput = {
  jobId: string;
  userAgent?: string | null;
  referrer?: string | null;
};

export async function insertJobViewRow(
  supabase: SupabaseClient,
  { jobId, userAgent, referrer }: InsertJobViewInput,
): Promise<void> {
  const { error } = await supabase.from("job_views").insert({
    job_id: jobId,
    user_agent: userAgent ?? null,
    referrer: referrer ?? null,
  });

  if (error) {
    console.error("job_views insert failed:", {
      jobId,
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw error;
  }
}
