import type { SupabaseClient } from "@supabase/supabase-js";
import { formatDistrictLabel } from "@/data/districts";
import type { JobApplicationType } from "@/lib/job-applications";
import { sendMail } from "@/lib/mail";
import { SITE_URL } from "@/lib/site";

const APPLY_BUTTON_NOTIFY_TO = "info@whitenightjob.jp";
const DEDUPE_WINDOW_MS = 60_000;
const DEDUPE_MAX_ENTRIES = 5_000;

const recentNotifications = new Map<string, number>();

function pruneRecentNotifications(now: number) {
  for (const [key, sentAt] of recentNotifications) {
    if (now - sentAt >= DEDUPE_WINDOW_MS) recentNotifications.delete(key);
  }
  while (recentNotifications.size > DEDUPE_MAX_ENTRIES) {
    const oldestKey = recentNotifications.keys().next().value;
    if (oldestKey === undefined) break;
    recentNotifications.delete(oldestKey);
  }
}

/** Returns false when the same visitor pressed the same button very recently. */
export function claimApplyButtonNotification(
  jobId: string,
  type: JobApplicationType,
  visitorKey: string,
): boolean {
  const now = Date.now();
  pruneRecentNotifications(now);
  const key = `${jobId}:${type}:${visitorKey}`;
  const last = recentNotifications.get(key);
  if (last !== undefined && now - last < DEDUPE_WINDOW_MS) return false;
  recentNotifications.set(key, now);
  return true;
}

export function resolveApplyVisitorKey(
  request: Request,
  anonymousId: string | null | undefined,
): string {
  const anon = anonymousId?.trim();
  if (anon) return `anon:${anon.slice(0, 128)}`;
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || request.headers.get("x-real-ip")?.trim();
  if (ip) return `ip:${ip}`;
  return "unknown";
}

function formatJstDateTime(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}/${get("month")}/${get("day")} ${get("hour")}:${get("minute")}`;
}

function orPlaceholder(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "未設定";
}

type NotifyJobRow = {
  id: string;
  shop_name: string | null;
  title: string | null;
  area: string | null;
  district: string | null;
  job_type: string | null;
};

export function buildApplyButtonNotifyMail(
  job: NotifyJobRow,
  type: JobApplicationType,
  pressedAt: Date,
): { subject: string; text: string } {
  const label = type === "line" ? "LINE応募" : "電話応募";
  const area = [job.area?.trim(), formatDistrictLabel(job.district)]
    .filter(Boolean)
    .join(" ");

  const text = [
    `${label}ボタンが押されました。`,
    "",
    `店舗名：${orPlaceholder(job.shop_name)}`,
    `求人名：${orPlaceholder(job.title)}`,
    `エリア：${orPlaceholder(area)}`,
    `職種：${orPlaceholder(job.job_type)}`,
    `日時：${formatJstDateTime(pressedAt)}`,
    "",
    `求人ID：${job.id}`,
    `店舗ID：${job.id}`,
    "",
    "運営側求人確認URL：",
    `${SITE_URL}/admin/jobs?edit=${encodeURIComponent(job.id)}`,
  ].join("\n");

  return {
    subject: `【White Night Job】${label}ボタンが押されました`,
    text,
  };
}

/** Never throws; failures are only written to the server log. */
export async function sendApplyButtonNotification(
  supabase: SupabaseClient,
  jobId: string,
  type: JobApplicationType,
  pressedAt: Date,
): Promise<void> {
  try {
    const { data: job, error } = await supabase
      .from("jobs")
      .select("id, shop_name, title, area, district, job_type")
      .eq("id", jobId)
      .maybeSingle();

    if (error) throw error;
    if (!job) throw new Error(`job not found: ${jobId}`);

    const { subject, text } = buildApplyButtonNotifyMail(
      job as NotifyJobRow,
      type,
      pressedAt,
    );
    await sendMail({ to: APPLY_BUTTON_NOTIFY_TO, subject, text });
  } catch (error) {
    console.error("[apply-button-notify] send failed", {
      jobId,
      type,
      error: error instanceof Error ? error.message : error,
    });
  }
}
