import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getAdminCache, setAdminCache } from "@/lib/admin-cache";
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

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

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

export async function GET(request: Request) {
  const startedAt = Date.now();
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ message: "ログインしてください。" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, Number(searchParams.get("limit") ?? DEFAULT_LIMIT) || DEFAULT_LIMIT),
    );
    const offset = Math.max(0, Number(searchParams.get("offset") ?? 0) || 0);
    const includeExtras = searchParams.get("extras") !== "0";

    const cacheKey = `admin:notification-history:${limit}:${offset}:${includeExtras ? 1 : 0}`;
    const cached = getAdminCache<Record<string, unknown>>(cacheKey);
    if (cached) {
      console.info("[admin/notification-history] cache-hit", {
        totalMs: Date.now() - startedAt,
      });
      return NextResponse.json({ ...cached, cache: "hit" });
    }

    const supabase = createSupabaseAdmin();

    const { data: batches, error: batchError, count } = await supabase
      .from("line_notification_batches")
      .select(
        "id, sent_at, shop_name, job_id, notify_type, target_count, success_count, fail_count, detail",
        { count: "exact" },
      )
      .order("sent_at", { ascending: false })
      .range(offset, offset + limit - 1);

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

    let dailySummaries: Array<Record<string, unknown>> = [];
    let shopStats: Array<{
      jobId: string;
      shopName: string;
      district: string;
      sendCount: number;
    }> = [];

    if (includeExtras && offset === 0) {
      const since = new Date();
      since.setDate(since.getDate() - 30);
      const sinceKey = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Tokyo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(since);

      const { data: dailyLogs, error: dailyError } = await supabase
        .from("line_notification_logs")
        .select("scheduled_date, sent_at, status, job_id")
        .eq("notification_type", DAILY_PICKUP_TYPE)
        .gte("scheduled_date", sinceKey)
        .order("scheduled_date", { ascending: false })
        .limit(800);

      if (!dailyError) {
        const dailyByDate = new Map<
          string,
          { target: number; success: number; fail: number; sentAt: string | null }
        >();
        const countByJob = new Map<string, number>();

        for (const row of dailyLogs ?? []) {
          const key = String(row.scheduled_date);
          const current = dailyByDate.get(key) ?? {
            target: 0,
            success: 0,
            fail: 0,
            sentAt: null,
          };
          current.target += 1;
          if (row.status === "sent") {
            current.success += 1;
            if (row.job_id) {
              countByJob.set(
                row.job_id as string,
                (countByJob.get(row.job_id as string) ?? 0) + 1,
              );
            }
          }
          if (row.status === "failed") current.fail += 1;
          if (row.sent_at && (!current.sentAt || row.sent_at > current.sentAt)) {
            current.sentAt = row.sent_at;
          }
          dailyByDate.set(key, current);
        }

        dailySummaries = [...dailyByDate.entries()]
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
    }

    const total = count ?? history.length;
    const payload = {
      history,
      dailySummaries,
      shopStats30d: shopStats,
      total,
      limit,
      offset,
      hasMore: offset + history.length < total,
    };

    setAdminCache(cacheKey, payload, 15_000);
    console.info("[admin/notification-history]", {
      totalMs: Date.now() - startedAt,
      limit,
      offset,
      rows: history.length,
    });

    return NextResponse.json({ ...payload, cache: "miss" });
  } catch (error) {
    return NextResponse.json(
      {
        message: getErrorMessage(error, "LINE通知履歴の取得に失敗しました。"),
        history: [],
        dailySummaries: [],
        shopStats30d: [],
        total: 0,
        hasMore: false,
      },
      { status: 500 },
    );
  }
}
