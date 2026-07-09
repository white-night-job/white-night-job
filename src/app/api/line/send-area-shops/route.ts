import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  broadcastCarousel,
  fetchPublishedJobs,
  fetchUsersByNotificationAreas,
} from "@/lib/line-notification";
import {
  filterJobsByBroadcastAreas,
  isNotificationArea,
  type NotificationArea,
} from "@/lib/notification-areas";

export const dynamic = "force-dynamic";

type RequestBody = {
  areas?: string[];
  limit?: number;
};

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ message: "認証が必要です。" }, { status: 401 });
  }

  const body = (await request.json()) as RequestBody;
  const areas = (body.areas ?? []).filter(isNotificationArea) as NotificationArea[];
  if (areas.length === 0) {
    return NextResponse.json({ message: "areas is required" }, { status: 400 });
  }

  try {
    const allJobs = await fetchPublishedJobs({ limit: body.limit ?? 10 });
    const jobs = filterJobsByBroadcastAreas(allJobs, areas);
    const users = await fetchUsersByNotificationAreas(areas);

    if (jobs.length === 0) {
      return NextResponse.json({ message: "配信対象の店舗がありません。" }, { status: 400 });
    }
    if (users.length === 0) {
      return NextResponse.json({ message: "配信対象のユーザーがいません。" }, { status: 400 });
    }

    const result = await broadcastCarousel({
      users,
      jobs,
      type: "area_shops_carousel",
      altText: `${areas.join("・")}エリアの店舗情報`,
      respectUserAreas: true,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[send-area-shops] failed", { areas, error });
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "配信に失敗しました。" },
      { status: 500 },
    );
  }
}
