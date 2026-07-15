import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getErrorMessage } from "@/lib/api-error";
import { DAILY_PICKUP_TYPE } from "@/lib/line-daily-pickup";
import { createSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<string, string> = {
  auto_new_job: "新着求人通知",
  auto_favorite_update: "お気に入り店舗通知",
  auto_pickup_top: "PickUp店舗通知",
  daily_pickup: "毎日PickUp配信",
};

function tokyoParts(iso: string) {
  const date = new Date(iso);
  const dateFmt = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const timeFmt = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return {
    dateLabel: dateFmt.format(date),
    timeLabel: timeFmt.format(date),
  };
}

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ message: "ログインしてください。" }, { status: 401 });
  }

  try {
    const supabase = createSupabaseAdmin();
    const [{ data: batches, error: batchError }, { data: dailyLogs, error: dailyError }] =
      await Promise.all([
        supabase
          .from("line_notification_batches")
          .select("*")
          .order("sent_at", { ascending: false })
          .limit(100),
        supabase
          .from("line_notification_logs")
          .select("scheduled_date, sent_at, status, job_id")
          .eq("notification_type", DAILY_PICKUP_TYPE)
          .order("scheduled_date", { ascending: false })
          .limit(2000),
      ]);

    if (batchError) throw batchError;

    const history = (batches ?? []).map((row) => {
      const when = tokyoParts(row.sent_at);
      return {
        id: row.id,
        sentAt: row.sent_at,
        deliveryDate: when.dateLabel,
        deliveryTime: when.timeLabel,
        shopName: row.shop_name ?? "—",
        district: null as string | null,
        jobId: row.job_id,
        notifyType: row.notify_type,
        notifyTypeLabel: TYPE_LABELS[row.notify_type] ?? row.notify_type,
        targetCount: row.target_count ?? 0,
        successCount: row.success_count ?? 0,
        failCount: row.fail_count ?? 0,
        detail: row.detail ?? null,
      };
    });

    const dailyByDate = new Map<
      string,
      { target: number; success: number; fail: number; sentAt: string | null }
    >();
    for (const row of dailyLogs ?? []) {
      const key = String(row.scheduled_date);
      const current = dailyByDate.get(key) ?? {
        target: 0,
        success: 0,
        fail: 0,
        sentAt: null,
      };
      current.target += 1;
      if (row.status === "sent") current.success += 1;
      if (row.status === "failed") current.fail += 1;
      if (row.sent_at && (!current.sentAt || row.sent_at > current.sentAt)) {
        current.sentAt = row.sent_at;
      }
      dailyByDate.set(key, current);
    }

    const dailySummaries = [...dailyByDate.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 30)
      .map(([scheduledDate, stats]) => {
        const when = stats.sentAt
          ? tokyoParts(stats.sentAt)
          : { dateLabel: scheduledDate, timeLabel: "—" };
        return {
          id: `daily-${scheduledDate}`,
          scheduledDate,
          deliveryDate: when.dateLabel,
          deliveryTime: when.timeLabel,
          shopName: "毎日PickUp（複数店舗）",
          district: "設定地域ごと",
          notifyType: DAILY_PICKUP_TYPE,
          notifyTypeLabel: TYPE_LABELS[DAILY_PICKUP_TYPE],
          targetCount: stats.target,
          successCount: stats.success,
          failCount: stats.fail,
        };
      });

    let shopStats: Array<{
      jobId: string;
      shopName: string;
      district: string;
      sendCount: number;
    }> = [];

    if (!dailyError) {
      const since = new Date();
      since.setDate(since.getDate() - 30);
      const sinceKey = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Tokyo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(since);

      const { data: recentSent } = await supabase
        .from("line_notification_logs")
        .select("job_id")
        .eq("notification_type", DAILY_PICKUP_TYPE)
        .eq("status", "sent")
        .gte("scheduled_date", sinceKey)
        .not("job_id", "is", null);

      const countByJob = new Map<string, number>();
      for (const row of recentSent ?? []) {
        const jobId = row.job_id as string;
        countByJob.set(jobId, (countByJob.get(jobId) ?? 0) + 1);
      }

      const jobIds = [...countByJob.keys()];
      if (jobIds.length > 0) {
        const { data: jobs } = await supabase
          .from("jobs")
          .select("id, shop_name, district")
          .in("id", jobIds);
        shopStats = (jobs ?? [])
          .map((job) => ({
            jobId: job.id,
            shopName: job.shop_name,
            district: job.district,
            sendCount: countByJob.get(job.id) ?? 0,
          }))
          .sort((a, b) => b.sendCount - a.sendCount);
      }
    }

    return NextResponse.json({
      history,
      dailySummaries,
      shopStats30d: shopStats,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: getErrorMessage(error, "LINE通知履歴の取得に失敗しました。"),
        history: [],
        dailySummaries: [],
        shopStats30d: [],
      },
      { status: 500 },
    );
  }
}
