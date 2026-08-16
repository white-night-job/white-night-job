import {
  LinePushError,
  maskLineUserId,
  sendLinePushMessages,
} from "@/lib/line-auth";
import { buildDailyPickupFlexMessage } from "@/lib/line-flex-messages";
import { rowToJob } from "@/lib/job-db";
import { isUncontractedPlan } from "@/lib/job-plan";
import {
  filterJobsOutsideShopDeliveryCooldown,
  fetchShopKeysInLineDeliveryCooldown,
  isShopKeyInDeliveryCooldown,
} from "@/lib/line-shop-cooldown";
import {
  jobMatchesBroadcastArea,
  type NotificationArea,
} from "@/lib/notification-areas";
import { createSupabaseAdmin } from "@/lib/supabase";
import type { Job } from "@/types/job";

export const DAILY_PICKUP_TYPE = "daily_pickup" as const;
const TOKYO_TZ = "Asia/Tokyo";
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

export type DailyPickupBatchStatus =
  | "processing"
  | "completed"
  | "failed"
  | "skipped";

export type DailyPickupResult = {
  scheduledDate: string;
  dryRun: boolean;
  onlyUserId: string | null;
  executedAtUtc: string;
  executedAtJst: string;
  messagingTokenConfigured: boolean;
  envDryRunForced: boolean;
  batchStatus: DailyPickupBatchStatus;
  batchId: string | null;
  funnel: DailyPickupFunnel;
  targetUsers: number;
  sent: number;
  failed: number;
  skippedNoShop: number;
  skippedDuplicate: number;
  skippedOther: number;
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

function getMessagingAccessToken(): string | null {
  return (
    process.env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN?.trim() ||
    process.env.LINE_CHANNEL_ACCESS_TOKEN?.trim() ||
    null
  );
}

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
  /** 直近120時間以内に配信成功した店舗キー（正規化済み） */
  cooldownShopKeys: ReadonlySet<string>;
  sendCounts30d: Map<string, number>;
}): Job | null {
  if (params.candidates.length === 0) return null;

  // 5日未満の同一店舗は除外。候補が空なら無理に再配信せずスキップ。
  const pool = params.candidates.filter(
    (job) => !isShopKeyInDeliveryCooldown(job.shopName, params.cooldownShopKeys),
  );
  if (pool.length === 0) return null;

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
  return (data ?? [])
    .map((row) => rowToJob(row))
    .filter((job) => !isUncontractedPlan(job.plan));
}

function jobsForUserAreas(jobs: Job[], areas: NotificationArea[]): Job[] {
  return jobs.filter((job) =>
    areas.some((area) => jobMatchesBroadcastArea(job.district, area)),
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
    status: "processing",
    error_message: null,
    sent_at: null,
    created_at: new Date().toISOString(),
  });

  if (!error) return "claimed";
  if (error.code !== "23505") throw error;

  // 既存行: 送信済みのみ二重送信防止。pending/processing/failed は再送する。
  const { data: existing, error: existingError } = await supabase
    .from("line_notification_logs")
    .select("id, status")
    .eq("user_id", params.userId)
    .eq("scheduled_date", params.scheduledDate)
    .eq("notification_type", DAILY_PICKUP_TYPE)
    .maybeSingle();
  if (existingError) throw existingError;
  if (!existing) throw error;
  if (existing.status === "sent") return "duplicate";

  const { data: reclaimed, error: reclaimError } = await supabase
    .from("line_notification_logs")
    .update({
      line_user_id: params.lineUserId,
      job_id: params.jobId,
      status: "processing",
      error_message: null,
      sent_at: null,
    })
    .eq("id", existing.id)
    .neq("status", "sent")
    .select("id")
    .maybeSingle();
  if (reclaimError) throw reclaimError;
  if (!reclaimed) return "duplicate";
  console.info("[daily-pickup] reclaim slot for retry", {
    userId: params.userId,
    scheduledDate: params.scheduledDate,
    previousStatus: existing.status,
  });
  return "claimed";
}

async function finalizeDailySlot(params: {
  userId: string;
  scheduledDate: string;
  status: "sent" | "failed" | "skipped";
  errorMessage?: string;
}) {
  const supabase = createSupabaseAdmin();
  const { error } = await supabase
    .from("line_notification_logs")
    .update({
      status: params.status,
      sent_at: new Date().toISOString(),
      error_message: params.errorMessage?.slice(0, 1000) ?? null,
    })
    .eq("user_id", params.userId)
    .eq("scheduled_date", params.scheduledDate)
    .eq("notification_type", DAILY_PICKUP_TYPE)
    .neq("status", "sent");
  if (error) {
    console.error("[daily-pickup] finalizeDailySlot failed", {
      userId: params.userId,
      scheduledDate: params.scheduledDate,
      status: params.status,
      message: error.message,
    });
    throw error;
  }
}

async function beginDailyBatch(params: {
  scheduledDate: string;
  targetCount: number;
  onlyUserId?: string | null;
}): Promise<string | null> {
  const supabase = createSupabaseAdmin();
  const isTest = Boolean(params.onlyUserId);
  const detail = isTest
    ? `test-user ${params.onlyUserId!.slice(0, 8)}…`
    : `daily ${params.scheduledDate}`;

  // 本番は1日1バッチ。既存 processing/completed があれば再利用 or 拒否。
  if (!isTest) {
    const { data: existing } = await supabase
      .from("line_notification_batches")
      .select("id, status, success_count")
      .eq("notify_type", DAILY_PICKUP_TYPE)
      .eq("scheduled_date", params.scheduledDate)
      .maybeSingle();

    if (existing?.status === "completed" && (existing.success_count ?? 0) > 0) {
      console.info("[daily-pickup] batch already completed today", {
        scheduledDate: params.scheduledDate,
        batchId: existing.id,
      });
      return null;
    }

    if (existing?.id) {
      const { error } = await supabase
        .from("line_notification_batches")
        .update({
          status: "processing",
          target_count: params.targetCount,
          success_count: 0,
          fail_count: 0,
          skipped_count: 0,
          error_message: null,
          detail,
          sent_at: new Date().toISOString(),
          shop_name: "毎日PickUp配信",
        })
        .eq("id", existing.id);
      if (error) {
        console.error("[daily-pickup] beginDailyBatch update failed", error);
        throw error;
      }
      return existing.id as string;
    }
  }

  const payload = {
    shop_name: "毎日PickUp配信",
    job_id: null,
    notify_type: DAILY_PICKUP_TYPE,
    target_count: params.targetCount,
    success_count: 0,
    fail_count: 0,
    skipped_count: 0,
    status: "processing",
    scheduled_date: isTest ? null : params.scheduledDate,
    detail,
    sent_at: new Date().toISOString(),
    error_message: null,
  };

  const { data, error } = await supabase
    .from("line_notification_batches")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    // マイグレーション前のスキーマ向けフォールバック
    if (/skipped_count|error_message|scheduled_date|\bstatus\b/i.test(error.message)) {
      const { data: legacy, error: legacyError } = await supabase
        .from("line_notification_batches")
        .insert({
          shop_name: "毎日PickUp配信",
          job_id: null,
          notify_type: DAILY_PICKUP_TYPE,
          target_count: params.targetCount,
          success_count: 0,
          fail_count: 0,
          detail: `processing ${detail}`,
          sent_at: new Date().toISOString(),
        })
        .select("id")
        .single();
      if (legacyError) {
        console.error("[daily-pickup] beginDailyBatch legacy insert failed", legacyError);
        throw legacyError;
      }
      return legacy.id as string;
    }
    // unique 競合: 同時実行。既存を processing に更新して続行。
    if (error.code === "23505" && !isTest) {
      const { data: raced } = await supabase
        .from("line_notification_batches")
        .select("id")
        .eq("notify_type", DAILY_PICKUP_TYPE)
        .eq("scheduled_date", params.scheduledDate)
        .maybeSingle();
      if (raced?.id) {
        await supabase
          .from("line_notification_batches")
          .update({
            status: "processing",
            target_count: params.targetCount,
            detail,
            sent_at: new Date().toISOString(),
          })
          .eq("id", raced.id);
        return raced.id as string;
      }
    }
    console.error("[daily-pickup] beginDailyBatch insert failed", error);
    throw error;
  }
  return data.id as string;
}

async function finishDailyBatch(params: {
  batchId: string | null;
  status: DailyPickupBatchStatus;
  targetCount: number;
  successCount: number;
  failCount: number;
  skippedCount: number;
  errorMessage?: string | null;
  detail?: string;
}) {
  if (!params.batchId) return;
  const supabase = createSupabaseAdmin();
  const fullUpdate = {
    status: params.status,
    target_count: params.targetCount,
    success_count: params.successCount,
    fail_count: params.failCount,
    skipped_count: params.skippedCount,
    error_message: params.errorMessage?.slice(0, 1000) ?? null,
    detail: params.detail ?? undefined,
    sent_at: new Date().toISOString(),
  };
  const { error } = await supabase
    .from("line_notification_batches")
    .update(fullUpdate)
    .eq("id", params.batchId);
  if (error) {
    if (/skipped_count|error_message|\bstatus\b/i.test(error.message)) {
      const { error: legacyError } = await supabase
        .from("line_notification_batches")
        .update({
          target_count: params.targetCount,
          success_count: params.successCount,
          fail_count: params.failCount,
          detail: params.detail ?? params.status,
          sent_at: new Date().toISOString(),
        })
        .eq("id", params.batchId);
      if (legacyError) {
        console.error("[daily-pickup] finishDailyBatch legacy failed", {
          batchId: params.batchId,
          message: legacyError.message,
        });
      }
      return;
    }
    console.error("[daily-pickup] finishDailyBatch failed", {
      batchId: params.batchId,
      message: error.message,
    });
  }
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

  const [topJobsRaw, cooldownShopKeys] = await Promise.all([
    fetchTopPickupJobs(),
    fetchShopKeysInLineDeliveryCooldown(),
  ]);
  const topJobs = filterJobsOutsideShopDeliveryCooldown(
    topJobsRaw,
    cooldownShopKeys,
  );
  const userAreas = (areas ?? []).map((row) => row.area as NotificationArea);
  const matching = jobsForUserAreas(topJobs, userAreas);
  const matchingBeforeCooldown = jobsForUserAreas(topJobsRaw, userAreas);
  const reasons: string[] = [];

  const notifyDailyPickup = Boolean(settings?.notify_daily_pickup);
  const hasLineUserId = Boolean(user?.line_user_id);
  const linePushBlocked = Boolean(user?.line_push_blocked);
  const alreadySentToday = todayLog?.status === "sent";
  const stuckPending =
    todayLog != null &&
    (todayLog.status === "pending" || todayLog.status === "processing");

  if (!user) reasons.push("ユーザーが存在しません");
  if (!notifyDailyPickup) reasons.push("「PickUp店舗の毎日通知」がOFFです");
  if (!hasLineUserId) reasons.push("LINE userId が未保存です");
  if (linePushBlocked) reasons.push("LINEブロック／配信不可フラグが立っています");
  if (userAreas.length === 0) reasons.push("通知地域が未設定です");
  if (matching.length === 0) {
    if (matchingBeforeCooldown.length > 0) {
      reasons.push(
        "設定地域の最優先店舗はすべて直近5日（120時間）以内に配信済みのため候補がありません",
      );
    } else {
      reasons.push(
        "設定地域に一致する最優先（listing_priority=top）の公開店舗がありません",
      );
    }
  }
  if (alreadySentToday) {
    reasons.push(`本日（${scheduledDate}）は既に配信済みです（二重送信防止）`);
  } else if (stuckPending) {
    reasons.push(
      `本日（${scheduledDate}）に未完了ログ（${todayLog?.status}）があります。再実行で送信を再試行します`,
    );
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
  const executedAtUtc = now.toISOString();
  const executedAtJst = formatTokyoDateTime(now);
  const messagingToken = getMessagingAccessToken();
  const messagingTokenConfigured = Boolean(messagingToken);

  const [{ users, funnel }, allTopJobsRaw, sendCounts30d, cooldownShopKeys] =
    await Promise.all([
      fetchEligibleUsers({ onlyUserId }),
      fetchTopPickupJobs(),
      fetchSendCounts30d(),
      fetchShopKeysInLineDeliveryCooldown(now),
    ]);

  // バッチ開始時点のクールダウンで候補を固定（同日内の成功送信で候補が減らない）
  const allTopJobs = filterJobsOutsideShopDeliveryCooldown(
    allTopJobsRaw,
    cooldownShopKeys,
  );
  funnel.topPriorityShops = allTopJobs.length;

  const result: DailyPickupResult = {
    scheduledDate,
    dryRun,
    onlyUserId,
    executedAtUtc,
    executedAtJst,
    messagingTokenConfigured,
    envDryRunForced,
    batchStatus: "processing",
    batchId: null,
    funnel,
    targetUsers: users.length,
    sent: 0,
    failed: 0,
    skippedNoShop: 0,
    skippedDuplicate: 0,
    skippedOther: 0,
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
    tokenEnv:
      process.env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN?.trim()
        ? "LINE_MESSAGING_CHANNEL_ACCESS_TOKEN"
        : process.env.LINE_CHANNEL_ACCESS_TOKEN?.trim()
          ? "LINE_CHANNEL_ACCESS_TOKEN"
          : "missing",
    funnel,
    targetUsers: users.length,
    topPriorityShops: allTopJobs.length,
    topPriorityShopsBeforeCooldown: allTopJobsRaw.length,
    cooldownShopCount: cooldownShopKeys.size,
  });

  if (!dryRun) {
    result.batchId = await beginDailyBatch({
      scheduledDate,
      targetCount: users.length,
      onlyUserId,
    });
    if (result.batchId === null && !onlyUserId) {
      result.batchStatus = "skipped";
      result.skippedOther = users.length;
      console.info("[daily-pickup] skip entire run: already completed today", {
        scheduledDate,
      });
      return result;
    }
  }

  if (users.length === 0) {
    result.batchStatus = "skipped";
    const reason =
      funnel.settingsOn === 0
        ? "毎日PickUp通知ONのユーザーが0人"
        : funnel.withLineUserId === 0
          ? "LINE userId 付きユーザーが0人"
          : funnel.withAreas === 0
            ? "通知地域設定済みユーザーが0人"
            : "配信対象ユーザーが0人";
    if (!dryRun) {
      await finishDailyBatch({
        batchId: result.batchId,
        status: "skipped",
        targetCount: 0,
        successCount: 0,
        failCount: 0,
        skippedCount: 0,
        errorMessage: reason,
        detail: `skipped: ${reason}`,
      });
    }
    console.info("[daily-pickup] skipped no targets", {
      scheduledDate,
      reason,
      funnel,
    });
    return result;
  }

  if (!dryRun && !messagingTokenConfigured) {
    result.batchStatus = "failed";
    result.failed = users.length;
    const reason =
      "LINE_MESSAGING_CHANNEL_ACCESS_TOKEN / LINE_CHANNEL_ACCESS_TOKEN is not set";
    for (const user of users) {
      result.failures.push({
        userId: user.userId,
        jobId: null,
        shopName: null,
        httpStatus: null,
        reason,
        blocked: false,
      });
    }
    await finishDailyBatch({
      batchId: result.batchId,
      status: "failed",
      targetCount: users.length,
      successCount: 0,
      failCount: users.length,
      skippedCount: 0,
      errorMessage: reason,
      detail: `failed: ${reason}`,
    });
    console.error("[daily-pickup] aborted: messaging token missing", {
      scheduledDate,
      targetUsers: users.length,
    });
    return result;
  }

  for (const user of users) {
    let claimed = false;
    try {
      const candidates = jobsForUserAreas(allTopJobs, user.areas);
      if (candidates.length === 0) {
        result.skippedNoShop += 1;
        console.info("[daily-pickup] skip no matching shop", {
          userId: user.userId,
          areaCount: user.areas.length,
          topPriorityShops: allTopJobs.length,
          cooldownShopCount: cooldownShopKeys.size,
        });
        continue;
      }

      const selected = selectDailyPickupJob({
        candidates,
        cooldownShopKeys,
        sendCounts30d,
      });
      if (!selected) {
        result.skippedNoShop += 1;
        console.info("[daily-pickup] skip: all matching shops in 5-day cooldown", {
          userId: user.userId,
          candidateCount: candidates.length,
          cooldownShopCount: cooldownShopKeys.size,
        });
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

      const claim = await claimDailySlot({
        userId: user.userId,
        lineUserId: user.lineUserId,
        jobId: selected.id,
        scheduledDate,
      });
      if (claim === "duplicate") {
        result.skippedDuplicate += 1;
        console.info("[daily-pickup] skip duplicate (already sent)", {
          userId: user.userId,
          scheduledDate,
          jobId: selected.id,
        });
        continue;
      }
      claimed = true;

      try {
        console.info("[daily-pickup] sending LINE push", {
          userId: user.userId,
          jobId: selected.id,
          shopName: selected.shopName,
          lineUserIdMasked: maskLineUserId(user.lineUserId),
        });
        const message = buildDailyPickupFlexMessage(selected);
        const push = await sendLinePushMessages(user.lineUserId, [message]);
        result.lineHttpStatuses.push(push.status);
        await finalizeDailySlot({
          userId: user.userId,
          scheduledDate,
          status: "sent",
        });
        claimed = false;
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
        claimed = false;
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
      if (claimed) {
        try {
          await finalizeDailySlot({
            userId: user.userId,
            scheduledDate,
            status: "failed",
            errorMessage:
              error instanceof Error ? error.message : "unknown loop error",
          });
        } catch (finalizeError) {
          console.error("[daily-pickup] finalize after loop error failed", {
            userId: user.userId,
            message:
              finalizeError instanceof Error
                ? finalizeError.message
                : "unknown",
          });
        }
      }
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

  const skippedTotal =
    result.skippedNoShop + result.skippedDuplicate + result.skippedOther;
  if (result.sent > 0 && result.failed === 0) {
    result.batchStatus = "completed";
  } else if (result.sent === 0 && result.failed === 0 && skippedTotal > 0) {
    result.batchStatus = "skipped";
  } else if (result.sent === 0 && result.failed > 0) {
    result.batchStatus = "failed";
  } else {
    result.batchStatus = "completed";
  }

  const detailParts = [
    `status=${result.batchStatus}`,
    `sent=${result.sent}`,
    `failed=${result.failed}`,
    `skippedNoShop=${result.skippedNoShop}`,
    `skippedDuplicate=${result.skippedDuplicate}`,
  ];
  if (result.failures[0]?.reason) {
    detailParts.push(`error=${result.failures[0].reason.slice(0, 120)}`);
  }

  if (!dryRun) {
    await finishDailyBatch({
      batchId: result.batchId,
      status: result.batchStatus,
      targetCount: users.length,
      successCount: result.sent,
      failCount: result.failed,
      skippedCount: skippedTotal,
      errorMessage:
        result.batchStatus === "failed"
          ? result.failures[0]?.reason ?? "送信失敗"
          : result.batchStatus === "skipped"
            ? result.skippedNoShop > 0
              ? "設定地域に一致する最優先店舗がありません"
              : result.skippedDuplicate > 0
                ? "本日分は既に送信済み"
                : "スキップ"
            : null,
      detail: detailParts.join(" / "),
    });
  }

  console.info("[daily-pickup] finished", {
    executedAtUtc,
    executedAtJst,
    scheduledDate,
    dryRun,
    batchId: result.batchId,
    batchStatus: result.batchStatus,
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
