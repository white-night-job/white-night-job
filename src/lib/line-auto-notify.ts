import { sendLinePushMessages } from "@/lib/line-auth";
import {
  LISTING_PRIORITY_LABELS,
  type ListingPriority,
  parseListingPriority,
} from "@/lib/listing-priority";
import {
  jobMatchesNotifyPrefs,
  parseHourlySalary,
  type UserNotifyPrefs,
} from "@/lib/notification-preferences";
import { SITE_URL } from "@/lib/site";
import { createSupabaseAdmin } from "@/lib/supabase";
import type { Job } from "@/types/job";

export type AutoNotifyType =
  | "auto_new_job"
  | "auto_favorite_update"
  | "auto_pickup_top";

type SendBatchResult = {
  targetCount: number;
  successCount: number;
  failCount: number;
};

function arraysEqual(a: string[] = [], b: string[] = []): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((value, index) => value === sortedB[index]);
}

function hasNewMedia(before: string | undefined, after: string | undefined): boolean {
  const prev = (before ?? "").trim();
  const next = (after ?? "").trim();
  return Boolean(next) && next !== prev;
}

function hasNewImages(before: string[] = [], after: string[] = []): boolean {
  const prev = new Set(before.filter(Boolean));
  return after.some((url) => url && !prev.has(url));
}

export function detectFavoriteUpdateChanges(
  before: Job,
  after: Job,
): string[] {
  const changes: string[] = [];

  const beforeWage = parseHourlySalary(before.salary);
  const afterWage = parseHourlySalary(after.salary);
  if (
    after.salary.trim() !== before.salary.trim() &&
    (afterWage === null || beforeWage === null || afterWage !== beforeWage)
  ) {
    if (afterWage !== null && beforeWage !== null && afterWage > beforeWage) {
      changes.push("時給アップ");
    } else {
      changes.push("時給変更");
    }
  }

  if (
    !arraysEqual(before.benefits, after.benefits) ||
    !arraysEqual(before.otherBenefits ?? [], after.otherBenefits ?? [])
  ) {
    changes.push("待遇変更");
  }

  if (
    hasNewMedia(before.youtubeUrl, after.youtubeUrl) ||
    hasNewMedia(before.tiktokUrl, after.tiktokUrl)
  ) {
    changes.push("店内動画追加");
  }

  if (
    hasNewMedia(before.imageUrl, after.imageUrl) ||
    hasNewImages(before.storeImages ?? [], after.storeImages ?? [])
  ) {
    changes.push("写真追加");
  }

  if (!before.pickupEnabled && after.pickupEnabled) {
    changes.push("PickUp掲載");
  }

  const beforePriority = parseListingPriority(before.listingPriority);
  const afterPriority = parseListingPriority(after.listingPriority);
  if (beforePriority !== afterPriority) {
    if (afterPriority === "priority") changes.push("優先掲載");
    if (afterPriority === "top") changes.push("最優先掲載");
  }

  return [...new Set(changes)];
}

async function loadAllUserPrefs(): Promise<UserNotifyPrefs[]> {
  const supabase = createSupabaseAdmin();
  const { data: users, error } = await supabase
    .from("users")
    .select("id, line_user_id")
    .not("line_user_id", "is", null);
  if (error) throw error;

  const withLine = (users ?? []).filter((row) => Boolean(row.line_user_id));
  if (withLine.length === 0) return [];

  const userIds = withLine.map((row) => row.id);
  const [
    { data: settingsRows },
    { data: areas },
    { data: jobTypes },
  ] = await Promise.all([
    supabase
      .from("user_notification_settings")
      .select(
        "user_id, notify_new_jobs, notify_pickup_jobs, notify_favorite_updates, min_hourly_wage",
      )
      .in("user_id", userIds),
    supabase.from("user_notification_areas").select("user_id, area").in("user_id", userIds),
    supabase
      .from("user_notification_job_types")
      .select("user_id, job_type")
      .in("user_id", userIds),
  ]);

  const settingsByUser = new Map(
    (settingsRows ?? []).map((row) => [row.user_id, row] as const),
  );

  const areasByUser = new Map<string, string[]>();
  for (const row of areas ?? []) {
    const list = areasByUser.get(row.user_id) ?? [];
    list.push(row.area);
    areasByUser.set(row.user_id, list);
  }

  const jobTypesByUser = new Map<string, string[]>();
  for (const row of jobTypes ?? []) {
    const list = jobTypesByUser.get(row.user_id) ?? [];
    list.push(row.job_type);
    jobTypesByUser.set(row.user_id, list);
  }

  return withLine.map((row) => {
    const settings = settingsByUser.get(row.id);
    return {
      userId: row.id,
      lineUserId: row.line_user_id as string,
      notifyNewJobs: settings?.notify_new_jobs ?? true,
      notifyPickupJobs: settings?.notify_pickup_jobs ?? true,
      notifyFavoriteUpdates: settings?.notify_favorite_updates ?? true,
      areas: areasByUser.get(row.id) ?? [],
      jobTypes: jobTypesByUser.get(row.id) ?? [],
      minHourlyWage: Number(settings?.min_hourly_wage ?? 0),
    };
  });
}

async function alreadySent(params: {
  userId: string;
  jobId: string;
  notifyType: AutoNotifyType;
  fingerprint: string;
}): Promise<boolean> {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("line_notification_dedupe")
    .select("id")
    .eq("user_id", params.userId)
    .eq("job_id", params.jobId)
    .eq("notify_type", params.notifyType)
    .eq("fingerprint", params.fingerprint)
    .maybeSingle();
  if (error) {
    // テーブル未作成時は重複チェックをスキップして送り過ぎを避けるためエラーをログして true 扱い
    console.error("[line-auto-notify] dedupe check failed", error);
    return true;
  }
  return Boolean(data);
}

async function markSent(params: {
  userId: string;
  jobId: string;
  notifyType: AutoNotifyType;
  fingerprint: string;
}): Promise<void> {
  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from("line_notification_dedupe").upsert(
    {
      user_id: params.userId,
      job_id: params.jobId,
      notify_type: params.notifyType,
      fingerprint: params.fingerprint,
    },
    { onConflict: "user_id,job_id,notify_type,fingerprint", ignoreDuplicates: true },
  );
  if (error) {
    console.error("[line-auto-notify] dedupe insert failed", error);
  }
}

async function logPerUser(params: {
  userId: string;
  jobId: string;
  type: AutoNotifyType;
  status: "sent" | "failed";
}) {
  const supabase = createSupabaseAdmin();
  await supabase.from("notification_logs").insert({
    user_id: params.userId,
    job_id: params.jobId,
    type: params.type,
    status: params.status,
    sent_at: new Date().toISOString(),
  });
}

async function writeBatchLog(params: {
  shopName: string;
  jobId: string;
  notifyType: AutoNotifyType;
  targetCount: number;
  successCount: number;
  failCount: number;
  detail?: string;
}) {
  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from("line_notification_batches").insert({
    shop_name: params.shopName,
    job_id: params.jobId,
    notify_type: params.notifyType,
    target_count: params.targetCount,
    success_count: params.successCount,
    fail_count: params.failCount,
    detail: params.detail ?? null,
    sent_at: new Date().toISOString(),
  });
  if (error) {
    console.error("[line-auto-notify] batch log failed", error);
  }
}

function buildJobUri(jobId: string): string {
  return `${SITE_URL}/jobs/${jobId}`;
}

function buildNewJobMessage(job: Job): unknown[] {
  const text = [
    "希望条件に合う新着求人です！",
    "",
    job.shopName,
    `${job.district} / ${job.jobType}`,
    job.salary,
    "",
    "詳しくはこちら",
    buildJobUri(job.id),
  ].join("\n");
  return [{ type: "text", text }];
}

function buildFavoriteUpdateMessage(job: Job, changes: string[]): unknown[] {
  const text = [
    "お気に入り店舗に更新があります！",
    "",
    job.shopName,
    "",
    ...changes.map((change) => `・${change}`),
    "",
    "詳しく見る",
    buildJobUri(job.id),
  ].join("\n");
  return [{ type: "text", text }];
}

function buildPickupTopMessage(job: Job): unknown[] {
  const text = [
    "おすすめ求人",
    "",
    job.shopName,
    "",
    "現在PickUp掲載中！",
    "",
    "詳しくはこちら",
    buildJobUri(job.id),
  ].join("\n");
  return [{ type: "text", text }];
}

async function pushToUsers(params: {
  users: UserNotifyPrefs[];
  job: Job;
  notifyType: AutoNotifyType;
  fingerprint: string;
  messages: unknown[];
  detail?: string;
}): Promise<SendBatchResult> {
  let successCount = 0;
  let failCount = 0;
  const eligible: UserNotifyPrefs[] = [];

  for (const user of params.users) {
    const dup = await alreadySent({
      userId: user.userId,
      jobId: params.job.id,
      notifyType: params.notifyType,
      fingerprint: params.fingerprint,
    });
    if (dup) continue;
    eligible.push(user);
  }

  for (const user of eligible) {
    try {
      await sendLinePushMessages(user.lineUserId, params.messages);
      await markSent({
        userId: user.userId,
        jobId: params.job.id,
        notifyType: params.notifyType,
        fingerprint: params.fingerprint,
      });
      await logPerUser({
        userId: user.userId,
        jobId: params.job.id,
        type: params.notifyType,
        status: "sent",
      });
      successCount += 1;
    } catch (error) {
      console.error("[line-auto-notify] push failed", {
        userId: user.userId,
        type: params.notifyType,
        error,
      });
      await logPerUser({
        userId: user.userId,
        jobId: params.job.id,
        type: params.notifyType,
        status: "failed",
      });
      failCount += 1;
    }
  }

  if (eligible.length > 0 || params.detail) {
    await writeBatchLog({
      shopName: params.job.shopName,
      jobId: params.job.id,
      notifyType: params.notifyType,
      targetCount: eligible.length,
      successCount,
      failCount,
      detail: params.detail,
    });
  }

  return {
    targetCount: eligible.length,
    successCount,
    failCount,
  };
}

export async function countMatchingNewJobRecipients(job: Job): Promise<number> {
  const prefs = await loadAllUserPrefs();
  return prefs.filter(
    (user) => user.notifyNewJobs && jobMatchesNotifyPrefs(job, user),
  ).length;
}

export async function countMatchingPickupRecipients(job: Job): Promise<number> {
  const prefs = await loadAllUserPrefs();
  return prefs.filter(
    (user) => user.notifyPickupJobs && jobMatchesNotifyPrefs(job, user),
  ).length;
}

/** Load prefs once and return both notify audience sizes. */
export async function countMatchingNotifyRecipients(job: Job): Promise<{
  newJobNotifyCount: number;
  pickupNotifyCount: number;
}> {
  const prefs = await loadAllUserPrefs();
  let newJobNotifyCount = 0;
  let pickupNotifyCount = 0;
  for (const user of prefs) {
    if (!jobMatchesNotifyPrefs(job, user)) continue;
    if (user.notifyNewJobs) newJobNotifyCount += 1;
    if (user.notifyPickupJobs) pickupNotifyCount += 1;
  }
  return { newJobNotifyCount, pickupNotifyCount };
}

export async function notifyNewJobListed(job: Job): Promise<SendBatchResult | null> {
  if (!process.env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN?.trim()) {
    console.warn("[line-auto-notify] skip new job: token missing");
    return null;
  }

  const prefs = await loadAllUserPrefs();
  const targets = prefs.filter(
    (user) => user.notifyNewJobs && jobMatchesNotifyPrefs(job, user),
  );

  return pushToUsers({
    users: targets,
    job,
    notifyType: "auto_new_job",
    fingerprint: "listed",
    messages: buildNewJobMessage(job),
  });
}

export async function notifyFavoriteJobUpdates(params: {
  before: Job;
  after: Job;
}): Promise<SendBatchResult | null> {
  if (!process.env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN?.trim()) {
    return null;
  }

  const changes = detectFavoriteUpdateChanges(params.before, params.after);
  if (changes.length === 0) return null;

  const supabase = createSupabaseAdmin();
  const { data: favorites, error } = await supabase
    .from("user_favorites")
    .select("user_id")
    .eq("job_id", params.after.id);
  if (error) throw error;

  const favoriteUserIds = new Set((favorites ?? []).map((row) => row.user_id));
  if (favoriteUserIds.size === 0) return null;

  const prefs = await loadAllUserPrefs();
  const targets = prefs.filter(
    (user) =>
      favoriteUserIds.has(user.userId) && user.notifyFavoriteUpdates,
  );
  if (targets.length === 0) return null;

  const fingerprint = changes.slice().sort().join("|");
  return pushToUsers({
    users: targets,
    job: params.after,
    notifyType: "auto_favorite_update",
    fingerprint,
    messages: buildFavoriteUpdateMessage(params.after, changes),
    detail: changes.join(" / "),
  });
}

export async function notifyListingPriorityBecameTop(params: {
  before: Job;
  after: Job;
}): Promise<SendBatchResult | null> {
  if (!process.env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN?.trim()) {
    return null;
  }

  const beforePriority = parseListingPriority(params.before.listingPriority);
  const afterPriority = parseListingPriority(params.after.listingPriority);
  if (beforePriority === "top" || afterPriority !== "top") {
    return null;
  }

  const prefs = await loadAllUserPrefs();
  const targets = prefs.filter(
    (user) => user.notifyPickupJobs && jobMatchesNotifyPrefs(params.after, user),
  );

  return pushToUsers({
    users: targets,
    job: params.after,
    notifyType: "auto_pickup_top",
    fingerprint: "top",
    messages: buildPickupTopMessage(params.after),
    detail: LISTING_PRIORITY_LABELS.top,
  });
}

export async function runAutoNotificationsAfterJobChange(params: {
  before: Job | null;
  after: Job;
  wasCreate?: boolean;
}): Promise<void> {
  try {
    const { before, after, wasCreate } = params;

    if (wasCreate || (!before && after)) {
      await notifyNewJobListed(after);
      const priority = parseListingPriority(after.listingPriority);
      if (priority === "top") {
        // 新規作成時点で最優先ならPickUp通知も送る
        await notifyListingPriorityBecameTop({
          before: { ...after, listingPriority: "normal" },
          after,
        });
      }
      return;
    }

    if (!before) return;

    await notifyFavoriteJobUpdates({ before, after });
    await notifyListingPriorityBecameTop({ before, after });
  } catch (error) {
    console.error("[line-auto-notify] run failed", {
      jobId: params.after.id,
      error,
    });
  }
}

export function listingPriorityLabel(value: ListingPriority | string | undefined): string {
  return LISTING_PRIORITY_LABELS[parseListingPriority(value)];
}
