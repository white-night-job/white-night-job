import { NextResponse } from "next/server";
import { rowToJob } from "@/lib/job-db";
import { createSupabaseAdmin } from "@/lib/supabase";
import { getAuthenticatedUserId } from "@/lib/user-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ message: "LINEログインが必要です。" }, { status: 401 });
  }
  const supabase = createSupabaseAdmin();
  const { data: favorites, error } = await supabase
    .from("user_favorites")
    .select("job_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  const jobIds = (favorites ?? []).map((row) => row.job_id);
  if (jobIds.length === 0) {
    return NextResponse.json({ favorites: [], jobs: [] });
  }

  const { data: jobs, error: jobsError } = await supabase
    .from("jobs")
    .select("*")
    .in("id", jobIds);
  if (jobsError) {
    return NextResponse.json({ message: jobsError.message }, { status: 500 });
  }

  const jobsById = new Map((jobs ?? []).map((row) => [row.id, rowToJob(row)]));
  const orderedJobs = jobIds.map((jobId) => jobsById.get(jobId)).filter(Boolean);

  return NextResponse.json({
    favorites: favorites ?? [],
    jobs: orderedJobs,
  });
}

export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ message: "LINEログインが必要です。" }, { status: 401 });
  }

  const body = (await request.json()) as { jobId?: string };
  const jobId = body.jobId?.trim();
  if (!jobId) {
    return NextResponse.json({ message: "jobId is required" }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from("user_favorites").upsert(
    {
      user_id: userId,
      job_id: jobId,
    },
    { onConflict: "user_id,job_id" },
  );
  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ message: "LINEログインが必要です。" }, { status: 401 });
  }

  const url = new URL(request.url);
  const jobId = url.searchParams.get("jobId")?.trim();
  if (!jobId) {
    return NextResponse.json({ message: "jobId is required" }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const { error } = await supabase
    .from("user_favorites")
    .delete()
    .eq("user_id", userId)
    .eq("job_id", jobId);
  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
