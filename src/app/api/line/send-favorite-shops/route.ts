import { NextResponse } from "next/server";
import { rowToJob } from "@/lib/job-db";
import { sendCarouselToLineUser } from "@/lib/line-notification";
import { createSupabaseAdmin } from "@/lib/supabase";
import { getAuthenticatedUserId } from "@/lib/user-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ message: "LINEログインが必要です。" }, { status: 401 });
  }

  const supabase = createSupabaseAdmin();
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id, line_user_id")
    .eq("id", userId)
    .maybeSingle();
  if (userError || !user?.line_user_id) {
    console.error("[send-favorite-shops] user lookup failed", { userId, userError });
    return NextResponse.json({ message: "LINEユーザー情報が見つかりません。" }, { status: 400 });
  }

  const { data: favorites, error: favoritesError } = await supabase
    .from("user_favorites")
    .select("job_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);
  if (favoritesError) {
    console.error("[send-favorite-shops] favorites fetch failed", { userId, favoritesError });
    return NextResponse.json({ message: favoritesError.message }, { status: 500 });
  }

  const jobIds = (favorites ?? []).map((row) => row.job_id);
  let jobs: ReturnType<typeof rowToJob>[] = [];
  if (jobIds.length > 0) {
    const { data: jobRows, error: jobsError } = await supabase
      .from("jobs")
      .select("*")
      .in("id", jobIds)
      .eq("published", true);
    if (jobsError) {
      console.error("[send-favorite-shops] jobs fetch failed", { userId, jobIds, jobsError });
      return NextResponse.json({ message: jobsError.message }, { status: 500 });
    }
    const jobsById = new Map((jobRows ?? []).map((row) => [row.id, rowToJob(row)]));
    jobs = jobIds
      .map((id) => jobsById.get(id))
      .filter((job): job is ReturnType<typeof rowToJob> => Boolean(job));
  }

  try {
    const ok = await sendCarouselToLineUser({
      lineUserId: user.line_user_id,
      userId: user.id,
      jobs,
      type: "favorite_shops_carousel",
      altText: jobs.length > 0 ? "お気に入り店舗一覧" : "お気に入り店舗がまだありません",
    });
    if (!ok) {
      return NextResponse.json({ message: "LINE送信に失敗しました。" }, { status: 500 });
    }
    return NextResponse.json({ ok: true, count: jobs.length });
  } catch (error) {
    console.error("[send-favorite-shops] send failed", { userId, error });
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "LINE送信に失敗しました。" },
      { status: 500 },
    );
  }
}
