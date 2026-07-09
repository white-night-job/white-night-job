import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  broadcastCarousel,
  fetchJobsByIds,
  fetchPublishedJobs,
  fetchUsersByNotifyFlag,
} from "@/lib/line-notification";

export const dynamic = "force-dynamic";

type RequestBody = {
  mode?: "new_jobs" | "pickup_jobs" | "custom";
  jobIds?: string[];
};

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ message: "認証が必要です。" }, { status: 401 });
  }

  const body = (await request.json()) as RequestBody;
  const mode = body.mode ?? "custom";

  try {
    let jobs: Awaited<ReturnType<typeof fetchPublishedJobs>> = [];
    let users: Awaited<ReturnType<typeof fetchUsersByNotifyFlag>> = [];
    let type = "shop_carousel";
    let altText = "店舗情報のお知らせ";

    if (mode === "new_jobs") {
      jobs = await fetchPublishedJobs({ limit: 10 });
      users = await fetchUsersByNotifyFlag("notify_new_jobs");
      type = "new_jobs_carousel";
      altText = "新着店舗のお知らせ";
    } else if (mode === "pickup_jobs") {
      jobs = await fetchPublishedJobs({ pickup: true, limit: 10 });
      users = await fetchUsersByNotifyFlag("notify_pickup_jobs");
      type = "pickup_jobs_carousel";
      altText = "PICK UP店舗のお知らせ";
    } else {
      const jobIds = body.jobIds?.filter(Boolean) ?? [];
      if (jobIds.length === 0) {
        return NextResponse.json({ message: "jobIds is required" }, { status: 400 });
      }
      jobs = await fetchJobsByIds(jobIds);
      users = await fetchUsersByNotifyFlag("notify_new_jobs");
      type = "shop_carousel";
      altText = "店舗情報のお知らせ";
    }

    if (jobs.length === 0) {
      return NextResponse.json({ message: "配信対象の店舗がありません。" }, { status: 400 });
    }

    const result = await broadcastCarousel({
      users,
      jobs,
      type,
      altText,
      respectUserAreas: true,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[send-shop-carousel] failed", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "配信に失敗しました。" },
      { status: 500 },
    );
  }
}
