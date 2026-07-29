import {
  LinePushError,
  maskLineUserId,
  sendLinePushMessages,
} from "@/lib/line-auth";
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

export type DailyPickupFunnel = {
  settingsOn: number;
  withLineUserId: number;
  notBlocked: number;
  withAreas: number;
  eligible: number;
  topPriorityShops: number;
};

export type DailyPickupFailure = {
  userId: string;
  jobId: string | null;
  shopName: string | null;
  httpStatus: number | null;
  reason: string;
  blocked: boolean;
};

export type DailyPickupResult = {
  scheduledDate: string;
  dryRun: boolean;
  onlyUserId: string | null;
  executedAtUtc: string;
  executedAtJst: string;
  messagingTokenConfigured: boolean;
  envDryRunForced: boolean;
  funnel: DailyPickupFunnel;
  targetUsers: number;
  sent: number;
  failed: number;
  skippedNoShop: number;
  skippedDuplicate: number;
  lineHttpStatuses: number[];
  failures: DailyPickupFailure[];
  deliveredJobIds: string[];
  previews: Array<{
    userId: string;
    lineUserIdMasked: string;
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

export function formatTokyoDateTime(now = new Date()): string {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: TOKYO_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
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

async function fetchEligibleUsers(options?: {
  onlyUserId?: string | null;
}): Promise<{ users: EligibleUser[]; funnel: DailyPickupFunnel }> {
  const supabase = createSupabaseAdmin();
  const onlyUserId = options?.onlyUserId?.trim() || null;

  let settingsQuery = supabase
    .from("user_notification_settings")
    .select("user_id")
    .eq("notify_daily_pickup", true);
  if (onlyUserId) {
    settingsQuery = settingsQuery.eq("user_id", onlyUserId);
  }

  const { data: settings, error: settingsError } = await settingsQuery;
  if (settingsError) throw settingsError;

  const funnel: DailyPickupFunnel = {
    settingsOn: (settings ?? []).length,
    withLineUserId: 0,
    notBlocked: 0,
    withAreas: 0,
    eligible: 0,
    topPriorityShops: 0,
  };

  const userIds = (settings ?? []).map((row) => row.user_id);
  if (userIds.length === 0) {
    return { users: [], funnel };
  }

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
    funnel.withLineUserId += 1;
    if (user.line_push_blocked) continue;
    funnel.notBlocked += 1;
    const userAreas = areasByUser.get(user.id) ?? [];
    if (userAreas.length === 0) continue;
    funnel.withAreas += 1;
    result.push({
      userId: user.id,
      lineUserId: user.line_user_id,
      areas: userAreas,
    });
  }
  funnel.eligible = result.length;
  return { users: result, funnel };
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
  onlyUserId?: string | null;
}) {
  const supabase = createSupabaseAdmin();
  const scope = params.onlyUserId
    ? `test-user ${params.onlyUserId.slice(0, 8)}…`
    : `scheduled ${params.scheduledDate}`;
  await supabase.from("line_notification_batches").insert({
    shop_name: "毎日PickUp配信",
    job_id: null,
    notify_type: DAILY_PICKUP_TYPE,
    target_count: params.targetCount,
    success_count: params.successCount,
    fail_count: params.failCount,
    detail: params.dryRun ? `dry-run ${scope}` : scope,
    sent_at: new Date().toISOString(),
  });
}

/**
 * 単一ユーザーがなぜ配信対象外かを診断する（個人の LINE userId 全文は返さない）。
 */
export async function diagnoseDailyPickupUser(userId: string): Promise<{
  userId: string;
  notifyDailyPickup: boolean;
  hasLineUserId: boolean;
  lineUserIdMasked: string | null;
  linePushBlocked: boolean;
  areaCount: number;
  areas: NotificationArea[];
  matchingTopShopCount: number;
  alreadySentToday: boolean;
  eligible: boolean;
  reasons: string[];
}> {
  const supabase = createSupabaseAdmin();
  const scheduledDate = getTokyoDateKey();

  const [
    { data: settings },
    { data: user },
    { data: areas },
    { data: todayLog },
  ] = await Promise.all([
    supabase
      .from("user_notification_settings")
      .select("notify_daily_pickup")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("users")
      .select("id, line_user_id, line_push_blocked")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("user_notification_areas")
      .select("area")
      .eq("user_id", userId),
    supabase
      .from("line_notification_logs")
      .select("status")
      .eq("user_id", userId)
      .eq("notification_type", DAILY_PICKUP_TYPE)
      .eq("scheduled_date", scheduledDate)
      .maybeSingle(),
  ]);

  const topJobs = await fetchTopPickupJobs();
  const userAreas = (areas ?? []).map((row) => row.area as NotificationArea);
  const matching = jobsForUserAreas(topJobs, userAreas);
  const reasons: string[] = [];

  const notifyDailyPickup = Boolean(settings?.notify_daily_pickup);
  const hasLineUserId = Boolean(user?.line_user_id);
  const linePushBlocked = Boolean(user?.line_push_blocked);
  const alreadySentToday = Boolean(todayLog);

  if (!user) reasons.push("ユーザーが存在しません");
  if (!notifyDailyPickup) reasons.push("「PickUp店舗の毎日通知」がOFFです");
  if (!hasLineUserId) reasons.push("LINE userId が未保存です");
  if (linePushBlocked) reasons.push("LINEブロック／配信不可フラグが立っています");
  if (userAreas.length === 0) reasons.push("通知地域が未設定です");
  if (matching.length === 0) {
    reasons.push(
      "設定地域に一致する最優先（listing_priority=top）の公開店舗がありません",
    );
  }
  if (alreadySentToday) {
    reasons.push(`本日（${scheduledDate}）は既に配信ログがあります（二重送信防止）`);
  }

  const eligible =
    Boolean(user) &&
    notifyDailyPickup &&
    hasLineUserId &&
    !linePushBlocked &&
    userAreas.length > 0;

  return {
    userId,
    notifyDailyPickup,
    hasLineUserId,
    lineUserIdMasked: user?.line_user_id
      ? maskLineUserId(user.line_user_id)
      : null,
    linePushBlocked,
    areaCount: userAreas.length,
    areas: userAreas,
    matchingTopShopCount: matching.length,
    alreadySentToday,
    eligible,
    reasons,
  };
}

export async function runDailyPickupDelivery(options?: {
  dryRun?: boolean;
  now?: Date;
  /** 指定時はその1ユーザーだけ。本番一斉再送には使わない。 */
  onlyUserId?: string | null;
}): Promise<DailyPickupResult> {
  const envDryRunForced =
    process.env.LINE_DAILY_PICKUP_DRY_RUN === "1" ||
    process.env.LINE_DAILY_PICKUP_DRY_RUN === "true";
  const dryRun = options?.dryRun === true || envDryRunForced;
  const onlyUserId = options?.onlyUserId?.trim() || null;
  const now = options?.now ?? new Date();
  const scheduledDate = getTokyoDateKey(now);
  const recentSince = daysAgoTokyoIso(RECENT_DAYS, now);
  const executedAtUtc = now.toISOString();
  const executedAtJst = formatTokyoDateTime(now);
  const messagingTokenConfigured = Boolean(
    process.env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN?.trim(),
  );

  const [{ users, funnel }, allTopJobs, sendCounts30d] = await Promise.all([
    fetchEligibleUsers({ onlyUserId }),
    fetchTopPickupJobs(),
    fetchSendCounts30d(),
  ]);
  funnel.topPriorityShops = allTopJobs.length;

  const result: DailyPickupResult = {
    scheduledDate,
    dryRun,
    onlyUserId,
    executedAtUtc,
    executedAtJst,
    messagingTokenConfigured,
    envDryRunForced,
    funnel,
    targetUsers: users.length,
    sent: 0,
    failed: 0,
    skippedNoShop: 0,
    skippedDuplicate: 0,
    lineHttpStatuses: [],
    failures: [],
    deliveredJobIds: [],
    previews: [],
  };

  console.info("[daily-pickup] start", {
    executedAtUtc,
    executedAtJst,
    scheduledDate,
    dryRun,
    envDryRunForced,
    onlyUserId: onlyUserId ? `${onlyUserId.slice(0, 8)}…` : null,
    messagingTokenConfigured,
    funnel,
    targetUsers: users.length,
  });

  for (const user of users) {
    try {
      const candidates = jobsForUserAreas(allTopJobs, user.areas);
      if (candidates.length === 0) {
        result.skippedNoShop += 1;
        console.info("[daily-pickup] skip no matching shop", {
          userId: user.userId,
          areaCount: user.areas.length,
          topPriorityShops: allTopJobs.length,
        });
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
        lineUserIdMasked: maskLineUserId(user.lineUserId),
        jobId: selected.id,
        shopName: selected.shopName,
        district: selected.district,
      });

      if (dryRun) {
        result.sent += 1;
        result.deliveredJobIds.push(selected.id);
        continue;
      }

      if (!messagingTokenConfigured) {
        result.failed += 1;
        result.failures.push({
          userId: user.userId,
          jobId: selected.id,
          shopName: selected.shopName,
          httpStatus: null,
          reason: "LINE_MESSAGING_CHANNEL_ACCESS_TOKEN is not set",
          blocked: false,
        });
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
        console.info("[daily-pickup] skip duplicate", {
          userId: user.userId,
          scheduledDate,
          jobId: selected.id,
        });
        continue;
      }

      try {
        const message = buildDailyPickupFlexMessage(selected);
        const push = await sendLinePushMessages(user.lineUserId, [message]);
        result.lineHttpStatuses.push(push.status);
        await finalizeDailySlot({
          userId: user.userId,
          scheduledDate,
          status: "sent",
        });
        result.sent += 1;
        result.deliveredJobIds.push(selected.id);
        sendCounts30d.set(
          selected.id,
          (sendCounts30d.get(selected.id) ?? 0) + 1,
        );
        console.info("[daily-pickup] sent", {
          userId: user.userId,
          jobId: selected.id,
          shopName: selected.shopName,
          lineHttpStatus: push.status,
        });
      } catch (error) {
        const messageText =
          error instanceof Error ? error.message : "unknown send error";
        const httpStatus =
          error instanceof LinePushError ? error.status : null;
        const blocked = error instanceof LinePushError && error.blocked;
        if (httpStatus != null) result.lineHttpStatuses.push(httpStatus);
        await finalizeDailySlot({
          userId: user.userId,
          scheduledDate,
          status: "failed",
          errorMessage: messageText,
        });
        if (blocked) {
          await markUserBlocked({
            userId: user.userId,
            reason: error instanceof LinePushError ? error.body : messageText,
          });
        }
        result.failed += 1;
        result.failures.push({
          userId: user.userId,
          jobId: selected.id,
          shopName: selected.shopName,
          httpStatus,
          reason: messageText,
          blocked,
        });
        console.error("[daily-pickup] send failed", {
          userId: user.userId,
          jobId: selected.id,
          shopName: selected.shopName,
          lineHttpStatus: httpStatus,
          reason: messageText,
          blocked,
        });
      }

      await sleep(SEND_GAP_MS);
    } catch (error) {
      console.error("[daily-pickup] user loop error", {
        userId: user.userId,
        message: error instanceof Error ? error.message : "unknown",
      });
      result.failed += 1;
      result.failures.push({
        userId: user.userId,
        jobId: null,
        shopName: null,
        httpStatus: null,
        reason: error instanceof Error ? error.message : "unknown loop error",
        blocked: false,
      });
    }
  }

  if (!dryRun) {
    await writeBatchSummary({
      scheduledDate,
      targetCount: users.length,
      successCount: result.sent,
      failCount: result.failed,
      dryRun: false,
      onlyUserId,
    });
  }

  console.info("[daily-pickup] finished", {
    executedAtUtc,
    executedAtJst,
    scheduledDate,
    dryRun,
    targetUsers: result.targetUsers,
    sent: result.sent,
    failed: result.failed,
    skippedNoShop: result.skippedNoShop,
    skippedDuplicate: result.skippedDuplicate,
    lineHttpStatuses: result.lineHttpStatuses,
    deliveredJobIds: result.deliveredJobIds,
    failureCount: result.failures.length,
  });

  return result;
}
