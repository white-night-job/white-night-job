import { NextResponse } from "next/server";
import { rowToJob } from "@/lib/job-db";
import { createSupabaseAdmin } from "@/lib/supabase";
import { getAuthenticatedUserId } from "@/lib/user-auth";

export const dynamic = "force-dynamic";

const MAX_HISTORY = 20;

export async function GET() {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ message: "LINEログインが必要です。" }, { status: 401 });
  }

  const supabase = createSupabaseAdmin();
  const { data: rows, error } = await supabase
    .from("user_job_views")
    .select("job_id, viewed_at")
    .eq("user_id", userId)
    .order("viewed_at", { ascending: false })
    .limit(MAX_HISTORY);

  if (error) {
    console.error("[view-history] GET failed:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  const jobIds = (rows ?? []).map((row) => row.job_id);
  if (jobIds.length === 0) {
    return NextResponse.json({ history: [], jobs: [] });
  }

  const { data: jobs, error: jobsError } = await supabase
    .from("jobs")
    .select("*")
    .in("id", jobIds)
    .eq("published", true);

  if (jobsError) {
    console.error("[view-history] jobs fetch failed:", jobsError);
    return NextResponse.json({ message: jobsError.message }, { status: 500 });
  }

  const jobsById = new Map((jobs ?? []).map((row) => [row.id, rowToJob(row)]));
  const orderedJobs = jobIds
    .map((jobId) => jobsById.get(jobId))
    .filter(Boolean);

  return NextResponse.json({
    history: rows ?? [],
    jobs: orderedJobs,
  });
}

export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ ok: false });
  }

  const body = (await request.json()) as { jobId?: string };
  const jobId = body.jobId?.trim();
  if (!jobId) {
    return NextResponse.json({ message: "jobId is required" }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();

  const { data: job } = await supabase
    .from("jobs")
    .select("id")
    .eq("id", jobId)
    .eq("published", true)
    .maybeSingle();

  if (!job) {
    return NextResponse.json({ message: "Job not found" }, { status: 404 });
  }

  const { error } = await supabase.from("user_job_views").upsert(
    {
      user_id: userId,
      job_id: jobId,
      viewed_at: new Date().toISOString(),
    },
    { onConflict: "user_id,job_id" },
  );

  if (error) {
    console.error("[view-history] POST failed:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  const { data: excess } = await supabase
    .from("user_job_views")
    .select("job_id")
    .eq("user_id", userId)
    .order("viewed_at", { ascending: false });

  if (excess && excess.length > MAX_HISTORY) {
    const toDelete = excess.slice(MAX_HISTORY).map((row) => row.job_id);
    await supabase
      .from("user_job_views")
      .delete()
      .eq("user_id", userId)
      .in("job_id", toDelete);
  }

  return NextResponse.json({ ok: true });
}
