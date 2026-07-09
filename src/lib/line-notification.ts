import { buildShopCarouselMessage } from "@/lib/line-flex-messages";
import { sendLinePushMessages } from "@/lib/line-auth";
import {
  filterJobsByBroadcastAreas,
  type NotificationArea,
} from "@/lib/notification-areas";
import { rowToJob } from "@/lib/job-db";
import { createSupabaseAdmin } from "@/lib/supabase";
import type { Job } from "@/types/job";

type SendResult = {
  sent: number;
  failed: number;
};

type UserTarget = {
  id: string;
  line_user_id: string;
};

async function logNotification(params: {
  userId: string;
  jobId?: string | null;
  type: string;
  status: "sent" | "failed";
}) {
  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from("notification_logs").insert({
    user_id: params.userId,
    job_id: params.jobId ?? null,
    type: params.type,
    status: params.status,
    sent_at: new Date().toISOString(),
  });
  if (error) {
    console.error("[line-notification] failed to write notification_logs", {
      userId: params.userId,
      type: params.type,
      error,
    });
  }
}

export async function sendCarouselToLineUser(params: {
  lineUserId: string;
  userId: string;
  jobs: Job[];
  type: string;
  jobId?: string | null;
  altText: string;
}): Promise<boolean> {
  const message = buildShopCarouselMessage(params.jobs, params.altText);
  try {
    await sendLinePushMessages(params.lineUserId, [message]);
    await logNotification({
      userId: params.userId,
      jobId: params.jobId ?? params.jobs[0]?.id ?? null,
      type: params.type,
      status: "sent",
    });
    return true;
  } catch (error) {
    console.error("[line-notification] send failed", {
      userId: params.userId,
      lineUserId: params.lineUserId,
      type: params.type,
      jobIds: params.jobs.map((job) => job.id),
      error,
    });
    await logNotification({
      userId: params.userId,
      jobId: params.jobId ?? params.jobs[0]?.id ?? null,
      type: params.type,
      status: "failed",
    });
    return false;
  }
}

export async function fetchJobsByIds(jobIds: string[]): Promise<Job[]> {
  if (jobIds.length === 0) return [];
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .in("id", jobIds)
    .eq("published", true);
  if (error) {
    console.error("[line-notification] fetchJobsByIds failed", { jobIds, error });
    throw error;
  }
  const jobsById = new Map((data ?? []).map((row) => [row.id, rowToJob(row)]));
  return jobIds.map((id) => jobsById.get(id)).filter((job): job is Job => Boolean(job));
}

export async function fetchPublishedJobs(filter?: {
  pickup?: boolean;
  limit?: number;
  districts?: string[];
}): Promise<Job[]> {
  const supabase = createSupabaseAdmin();
  const limit = filter?.limit ?? 10;
  let query = supabase
    .from("jobs")
    .select("*")
    .eq("published", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (filter?.pickup) {
    query = query.eq("pickup_enabled", true);
  }
  if (filter?.districts && filter.districts.length > 0) {
    query = query.in("district", filter.districts);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[line-notification] fetchPublishedJobs failed", { filter, error });
    throw error;
  }
  return (data ?? []).map((row) => rowToJob(row));
}

export async function getUserNotificationAreas(userId: string): Promise<NotificationArea[]> {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("user_notification_areas")
    .select("area")
    .eq("user_id", userId);
  if (error) {
    console.error("[line-notification] getUserNotificationAreas failed", { userId, error });
    throw error;
  }
  return (data ?? []).map((row) => row.area as NotificationArea);
}

function filterJobsForUser(jobs: Job[], userAreas: NotificationArea[]): Job[] {
  if (userAreas.length === 0) return jobs;
  return filterJobsByBroadcastAreas(jobs, userAreas);
}

export async function broadcastCarousel(params: {
  users: UserTarget[];
  jobs: Job[];
  type: string;
  jobId?: string | null;
  altText: string;
  respectUserAreas?: boolean;
}): Promise<SendResult> {
  let sent = 0;
  let failed = 0;

  for (const user of params.users) {
    let jobsForUser = params.jobs;
    if (params.respectUserAreas) {
      const userAreas = await getUserNotificationAreas(user.id);
      jobsForUser = filterJobsForUser(params.jobs, userAreas);
    }
    if (jobsForUser.length === 0) continue;

    const ok = await sendCarouselToLineUser({
      lineUserId: user.line_user_id,
      userId: user.id,
      jobs: jobsForUser,
      type: params.type,
      jobId: params.jobId,
      altText: params.altText,
    });
    if (ok) sent += 1;
    else failed += 1;
  }

  return { sent, failed };
}

export async function fetchUsersByNotificationAreas(
  areas: NotificationArea[],
): Promise<UserTarget[]> {
  const supabase = createSupabaseAdmin();
  if (areas.length === 0) return [];

  const { data: areaRows, error } = await supabase
    .from("user_notification_areas")
    .select("user_id")
    .in("area", areas);
  if (error) {
    console.error("[line-notification] fetchUsersByNotificationAreas failed", { areas, error });
    throw error;
  }

  const userIds = [...new Set((areaRows ?? []).map((row) => row.user_id))];
  if (userIds.length === 0) return [];

  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id, line_user_id")
    .in("id", userIds);
  if (usersError) {
    console.error("[line-notification] users fetch failed", { userIds, error: usersError });
    throw usersError;
  }

  return (users ?? []).filter(
    (user): user is UserTarget => Boolean(user.line_user_id),
  );
}

export async function fetchUsersByNotifyFlag(
  flag: "notify_new_jobs" | "notify_pickup_jobs" | "notify_favorite_updates",
): Promise<UserTarget[]> {
  const supabase = createSupabaseAdmin();
  const { data: settingsRows, error } = await supabase
    .from("user_notification_settings")
    .select("user_id")
    .eq(flag, true);
  if (error) throw error;

  const userIds = (settingsRows ?? []).map((row) => row.user_id);
  if (userIds.length === 0) return [];

  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id, line_user_id")
    .in("id", userIds);
  if (usersError) throw usersError;

  return (users ?? []).filter(
    (user): user is UserTarget => Boolean(user.line_user_id),
  );
}

export async function fetchUsersWhoFavoritedJob(jobId: string): Promise<UserTarget[]> {
  const supabase = createSupabaseAdmin();
  const { data: favorites, error } = await supabase
    .from("user_favorites")
    .select("user_id")
    .eq("job_id", jobId);
  if (error) throw error;

  const userIds = [...new Set((favorites ?? []).map((row) => row.user_id))];
  if (userIds.length === 0) return [];

  const { data: settingsRows, error: settingsError } = await supabase
    .from("user_notification_settings")
    .select("user_id")
    .eq("notify_favorite_updates", true)
    .in("user_id", userIds);
  if (settingsError) throw settingsError;

  const allowedUserIds = (settingsRows ?? []).map((row) => row.user_id);
  if (allowedUserIds.length === 0) return [];

  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id, line_user_id")
    .in("id", allowedUserIds);
  if (usersError) throw usersError;

  return (users ?? []).filter(
    (user): user is UserTarget => Boolean(user.line_user_id),
  );
}
