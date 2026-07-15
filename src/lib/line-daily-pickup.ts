import { LinePushError, sendLinePushMessages } from "@/lib/line-auth";
import { buildDailyPickupFlexMessage } from "@/lib/line-flex-messages";
import { rowToJob } from "@/lib/job-db";
import {
  jobMatchesBroadcastArea,
  type NotificationArea,
} from "@/lib/notification-areas";
import { createSupabaseAdmin } from "@/lib/supabase";
import type { Job } from "@/types/job";

export const DAILY_PICKUP_TYPE = "daily_pickup" as const;
const TOKYO_TZ = "Asia/Tokyo";
const RECENT_DAYS = 7;
const SEND_GAP_MS = 80;

export type DailyPickupResult = {
  scheduledDate: string;
  dryRun: boolean;
  targetUsers: number;
  sent: number;
  failed: number;
  skippedNoShop: number;
  skippedDuplicate: number;
  previews: Array<{
    userId: string;
    lineUserId: string;
    jobId: string;
    shopName: string;
    district: string;
  }>;
};

type EligibleUser = {
  userId: string;
  lineUserId: string;
  areas: NotificationArea[];
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getTokyoDateKey(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TOKYO_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function daysAgoTokyoIso(days: number, now = new Date()): string {
  const dateKey = getTokyoDateKey(
    new Date(now.getTime() - days * 24 * 60 * 60 * 1000),
  );
  return `${dateKey}T00:00:00+09:00`;
}

function weightedRandomPick<T>(items: T[], weights: number[]): T {
  const total = weights.reduce((sum, w) => sum + w, 0);
  if (total <= 0) {
    return items[Math.floor(Math.random() * items.length)]!;
  }
  let cursor = Math.random() * total;
  for (let i = 0; i < items.length; i += 1) {
    cursor -= weights[i]!;
    if (cursor <= 0) return items[i]!;
  }
  return items[items.length - 1]!;
}

export function selectDailyPickupJob(params: {
  candidates: Job[];
  recentJobIds: Set<string>;
  sendCounts30d: Map<string, number>;
}): Job | null {
  if (params.candidates.length === 0) return null;

  let pool = params.candidates.filter((job) => !params.recentJobIds.has(job.id));
  if (pool.length === 0) {
    pool = [...params.candidates];
  }

  const weights = pool.map((job) => {
    const count = params.sendCounts30d.get(job.id) ?? 0;
    return 1 / (1 + count);
  });

  return weightedRandomPick(pool, weights);
}

async function markUserBlocked(params: {
  userId: string;
  reason: string;
}) {
  const supabase = createSupabaseAdmin();
  await supabase
    .from("users")
    .update({
      line_push_blocked: true,
      line_push_blocked_at: new Date().toISOString(),
      line_push_blocked_reason: params.reason.slice(0, 500),
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.userId);
}

async function fetchEligibleUsers(): Promise<EligibleUser[]> {
  const supabase = createSupabaseAdmin();

  const { data: settings, error: settingsError } = await supabase
    .from("user_notification_settings")
    .select("user_id")
    .eq("notify_daily_pickup", true);
  if (settingsError) throw settingsError;

  const userIds = (settings ?? []).map((row) => row.user_id);
  if (userIds.length === 0) return [];

  const [{ data: users, error: usersError }, { data: areas, error: areasError }] =
    await Promise.all([
      supabase
        .from("users")
        .select("id, line_user_id, line_push_blocked")
        .in("id", userIds)
        .not("line_user_id", "is", null),
      supabase
        .from("user_notification_areas")
        .select("user_id, area")
        .in("user_id", userIds),
    ]);
  if (usersError) throw usersError;
  if (areasError) throw areasError;

  const areasByUser = new Map<string, NotificationArea[]>();
  for (const row of areas ?? []) {
    const list = areasByUser.get(row.user_id) ?? [];
    list.push(row.area as NotificationArea);
    areasByUser.set(row.user_id, list);
  }

  const result: EligibleUser[] = [];
  for (const user of users ?? []) {
    if (!user.line_user_id) continue;
    if (user.line_push_blocked) continue;
    const userAreas = areasByUser.get(user.id) ?? [];
    if (userAreas.length === 0) continue;
    result.push({
      userId: user.id,
      lineUserId: user.line_user_id,
      areas: userAreas,
    });
  }
  return result;
}

async function fetchTopPickupJobs(): Promise<Job[]> {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("published", true)
    .eq("listing_priority", "top");
  if (error) throw error;
  return (data ?? []).map((row) => rowToJob(row));
}

function jobsForUserAreas(jobs: Job[], areas: NotificationArea[]): Job[] {
  return jobs.filter((job) =>
    areas.some((area) => jobMatchesBroadcastArea(job.district, area)),
  );
}

async function fetchRecentJobIdsForUser(
  userId: string,
  sinceIso: string,
): Promise<Set<string>> {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("line_notification_logs")
    .select("job_id")
    .eq("user_id", userId)
    .eq("notification_type", DAILY_PICKUP_TYPE)
    .eq("status", "sent")
    .gte("sent_at", sinceIso)
    .not("job_id", "is", null);
  if (error) {
    console.error("[daily-pickup] recent fetch failed", error);
    return new Set();
  }
  return new Set(
    (data ?? [])
      .map((row) => row.job_id as string | null)
      .filter((id): id is string => Boolean(id)),
  );
}

async function fetchSendCounts30d(): Promise<Map<string, number>> {
  const supabase = createSupabaseAdmin();
  const since = daysAgoTokyoIso(30);
  const { data, error } = await supabase
    .from("line_notification_logs")
    .select("job_id")
    .eq("notification_type", DAILY_PICKUP_TYPE)
    .eq("status", "sent")
    .gte("sent_at", since)
    .not("job_id", "is", null);
  if (error) {
    console.error("[daily-pickup] send counts failed", error);
    return new Map();
  }
  const map = new Map<string, number>();
  for (const row of data ?? []) {
    const jobId = row.job_id as string;
    map.set(jobId, (map.get(jobId) ?? 0) + 1);
  }
  return map;
}

async function claimDailySlot(params: {
  userId: string;
  lineUserId: string;
  jobId: string;
  scheduledDate: string;
}): Promise<"claimed" | "duplicate"> {
  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from("line_notification_logs").insert({
    user_id: params.userId,
    line_user_id: params.lineUserId,
    job_id: params.jobId,
    notification_type: DAILY_PICKUP_TYPE,
    scheduled_date: params.scheduledDate,
    status: "pending",
    created_at: new Date().toISOString(),
  });

  if (error) {
    if (error.code === "23505") return "duplicate";
    throw error;
  }
  return "claimed";
}

async function finalizeDailySlot(params: {
  userId: string;
  scheduledDate: string;
  status: "sent" | "failed" | "skipped";
  errorMessage?: string;
}) {
  const supabase = createSupabaseAdmin();
  await supabase
    .from("line_notification_logs")
    .update({
      status: params.status,
      sent_at: new Date().toISOString(),
      error_message: params.errorMessage?.slice(0, 1000) ?? null,
    })
    .eq("user_id", params.userId)
    .eq("scheduled_date", params.scheduledDate)
    .eq("notification_type", DAILY_PICKUP_TYPE);
}

async function writeBatchSummary(params: {
  scheduledDate: string;
  targetCount: number;
  successCount: number;
  failCount: number;
  dryRun: boolean;
}) {
  const supabase = createSupabaseAdmin();
  await supabase.from("line_notification_batches").insert({
    shop_name: "毎日PickUp配信",
    job_id: null,
    notify_type: DAILY_PICKUP_TYPE,
    target_count: params.targetCount,
    success_count: params.successCount,
    fail_count: params.failCount,
    detail: params.dryRun
      ? `dry-run ${params.scheduledDate}`
      : `scheduled ${params.scheduledDate}`,
    sent_at: new Date().toISOString(),
  });
}

export async function runDailyPickupDelivery(options?: {
  dryRun?: boolean;
  now?: Date;
}): Promise<DailyPickupResult> {
  const dryRun =
    options?.dryRun === true ||
    process.env.LINE_DAILY_PICKUP_DRY_RUN === "1" ||
    process.env.LINE_DAILY_PICKUP_DRY_RUN === "true";
  const now = options?.now ?? new Date();
  const scheduledDate = getTokyoDateKey(now);
  const recentSince = daysAgoTokyoIso(RECENT_DAYS, now);

  const [users, allTopJobs, sendCounts30d] = await Promise.all([
    fetchEligibleUsers(),
    fetchTopPickupJobs(),
    fetchSendCounts30d(),
  ]);

  const result: DailyPickupResult = {
    scheduledDate,
    dryRun,
    targetUsers: users.length,
    sent: 0,
    failed: 0,
    skippedNoShop: 0,
    skippedDuplicate: 0,
    previews: [],
  };

  for (const user of users) {
    try {
      const candidates = jobsForUserAreas(allTopJobs, user.areas);
      if (candidates.length === 0) {
        result.skippedNoShop += 1;
        continue;
      }

      const recentJobIds = await fetchRecentJobIdsForUser(
        user.userId,
        recentSince,
      );
      const selected = selectDailyPickupJob({
        candidates,
        recentJobIds,
        sendCounts30d,
      });
      if (!selected) {
        result.skippedNoShop += 1;
        continue;
      }

      result.previews.push({
        userId: user.userId,
        lineUserId: user.lineUserId,
        jobId: selected.id,
        shopName: selected.shopName,
        district: selected.district,
      });

      if (dryRun) {
        result.sent += 1;
        continue;
      }

      const claim = await claimDailySlot({
        userId: user.userId,
        lineUserId: user.lineUserId,
        jobId: selected.id,
        scheduledDate,
      });
      if (claim === "duplicate") {
        result.skippedDuplicate += 1;
        continue;
      }

      try {
        const message = buildDailyPickupFlexMessage(selected);
        await sendLinePushMessages(user.lineUserId, [message]);
        await finalizeDailySlot({
          userId: user.userId,
          scheduledDate,
          status: "sent",
        });
        result.sent += 1;
        sendCounts30d.set(
          selected.id,
          (sendCounts30d.get(selected.id) ?? 0) + 1,
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "unknown send error";
        const blocked = error instanceof LinePushError && error.blocked;
        await finalizeDailySlot({
          userId: user.userId,
          scheduledDate,
          status: "failed",
          errorMessage: message,
        });
        if (blocked) {
          await markUserBlocked({
            userId: user.userId,
            reason: error instanceof LinePushError ? error.body : message,
          });
        }
        result.failed += 1;
      }

      await sleep(SEND_GAP_MS);
    } catch (error) {
      console.error("[daily-pickup] user loop error", {
        userId: user.userId,
        error,
      });
      result.failed += 1;
    }
  }

  if (!dryRun) {
    await writeBatchSummary({
      scheduledDate,
      targetCount: users.length,
      successCount: result.sent,
      failCount: result.failed,
      dryRun: false,
    });
  }

  return result;
}
