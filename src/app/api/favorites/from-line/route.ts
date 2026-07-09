import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { getAuthenticatedUserId } from "@/lib/user-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const jobId = url.searchParams.get("jobId")?.trim();
  if (!jobId) {
    return NextResponse.redirect(new URL("/jobs", request.url));
  }

  const userId = await getAuthenticatedUserId(request);
  if (!userId) {
    const redirectTarget = `/api/favorites/from-line?jobId=${encodeURIComponent(jobId)}`;
    const loginUrl = new URL("/api/line/login", request.url);
    loginUrl.searchParams.set("redirect", redirectTarget);
    return NextResponse.redirect(loginUrl);
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
    console.error("[favorites/from-line] upsert failed", { userId, jobId, error });
    return NextResponse.redirect(new URL(`/jobs/${jobId}`, request.url));
  }

  const jobUrl = new URL(`/jobs/${jobId}`, request.url);
  jobUrl.searchParams.set("favorited", "1");
  return NextResponse.redirect(jobUrl);
}
