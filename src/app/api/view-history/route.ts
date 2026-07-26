import { NextResponse } from "next/server";
import { rowToJob } from "@/lib/job-db";
import { createSupabaseAdmin } from "@/lib/supabase";
import { getAuthenticatedUserId } from "@/lib/user-auth";
import {
  parseCardLimit,
  USER_JOB_CARD_COLUMNS,
} from "@/lib/user-job-card-columns";

export const dynamic = "force-dynamic";

const MAX_HISTORY = 20;

export async function GET(request: Request) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ message: "LINEログインが必要です。" }, { status: 401 });
  }

  const limit = parseCardLimit(
    new URL(request.url).searchParams.get("limit"),
    MAX_HISTORY,
    MAX_HISTORY,
  );

  const supabase = createSupabaseAdmin();
  const { data: rows, error } = await supabase
    .from("user_job_views")
    .select("job_id, viewed_at")
    .eq("user_id", userId)
    .order("viewed_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[view-history] GET failed:", {
      userId,
      code: error.code,
      message: error.message,
      details: error.details,
    });
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  const jobIds = (rows ?? []).map((row) => row.job_id);
  if (jobIds.length === 0) {
    return NextResponse.json({ history: [], jobs: [] });
  }

  const { data: jobs, error: jobsError } = await supabase
    .from("jobs")
    .select(USER_JOB_CARD_COLUMNS)
    .in("id", jobIds)
    .eq("published", true);

  if (jobsError) {
    console.error("[view-history] jobs fetch failed:", {
      userId,
      requested: jobIds.length,
      code: jobsError.code,
      message: jobsError.message,
      details: jobsError.details,
    });
    return NextResponse.json({ message: jobsError.message }, { status: 500 });
  }

  const jobsById = new Map(
    (jobs ?? []).map((row) => {
      const typedRow = row as unknown as Parameters<typeof rowToJob>[0];
      return [typedRow.id, rowToJob(typedRow)];
    }),
  );
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
