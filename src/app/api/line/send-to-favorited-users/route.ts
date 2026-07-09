import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  broadcastCarousel,
  fetchJobsByIds,
  fetchUsersWhoFavoritedJob,
} from "@/lib/line-notification";

export const dynamic = "force-dynamic";

type RequestBody = {
  jobId?: string;
};

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ message: "認証が必要です。" }, { status: 401 });
  }

  const body = (await request.json()) as RequestBody;
  const jobId = body.jobId?.trim();
  if (!jobId) {
    return NextResponse.json({ message: "jobId is required" }, { status: 400 });
  }

  try {
    const jobs = await fetchJobsByIds([jobId]);
    if (jobs.length === 0) {
      return NextResponse.json({ message: "店舗が見つかりません。" }, { status: 404 });
    }

    const users = await fetchUsersWhoFavoritedJob(jobId);
    if (users.length === 0) {
      return NextResponse.json({ message: "お気に入り登録者がいません。" }, { status: 400 });
    }

    const result = await broadcastCarousel({
      users,
      jobs,
      type: "favorite_users_carousel",
      jobId,
      altText: `${jobs[0].shopName}の最新情報`,
      respectUserAreas: false,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[send-to-favorited-users] failed", { jobId, error });
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "配信に失敗しました。" },
      { status: 500 },
    );
  }
}
