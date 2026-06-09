import { Resend } from "resend";
import nodemailer from "nodemailer";

const DEFAULT_REPORT_EMAIL = "whitenightjob.info@gmail.com";

const CATEGORY_LABELS: Record<string, string> = {
  unpaid: "未払い・給与トラブル",
  harassment: "パワハラ・嫌がらせ",
  illegal: "違法営業・勧誘",
  contract: "契約違反",
  other: "その他",
};

export type ReportEmailPayload = {
  shopName: string;
  category: string;
  area?: string;
  detail: string;
  contact?: string;
  reportedAt: string;
  ip?: string;
};

function getReportEmail(): string {
  return process.env.REPORT_EMAIL?.trim() || DEFAULT_REPORT_EMAIL;
}

function getCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}

export function buildReportEmailSubject(shopName: string): string {
  return `【ブラック店報告】店舗名: ${shopName}`;
}

export function buildReportEmailBody(payload: ReportEmailPayload): string {
  const reportLines = [
    `種別: ${getCategoryLabel(payload.category)}`,
    payload.area ? `エリア: ${payload.area}` : null,
    payload.contact ? `連絡先: ${payload.contact}` : null,
    "",
    payload.detail,
  ].filter((line) => line !== null);

  const lines = [
    "店舗名:",
    payload.shopName,
    "",
    "報告内容:",
    ...reportLines,
    "",
    "報告日時:",
    payload.reportedAt,
  ];

  if (payload.ip) {
    lines.push("", "IP:", payload.ip);
  }

  return lines.join("\n");
}

export function formatReportDateTime(date = new Date()): string {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

export function getClientIp(request: Request): string | undefined {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  return undefined;
}

async function sendViaResend(
  payload: ReportEmailPayload,
  subject: string,
  body: string,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("RESEND_API_KEY が設定されていません。");
  }

  const resend = new Resend(apiKey);
  const from =
    process.env.RESEND_FROM_EMAIL?.trim() ||
    "White Night Job <onboarding@resend.dev>";

  const { error } = await resend.emails.send({
    from,
    to: getReportEmail(),
    subject,
    text: body,
  });

  if (error) {
    throw new Error(error.message || "Resendでのメール送信に失敗しました。");
  }
}

async function sendViaNodemailer(
  payload: ReportEmailPayload,
  subject: string,
  body: string,
): Promise<void> {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();

  if (!host || !user || !pass) {
    throw new Error(
      "メール送信の設定がありません。RESEND_API_KEY または SMTP 設定を確認してください。",
    );
  }

  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM?.trim() || user,
    to: getReportEmail(),
    subject,
    text: body,
  });
}

export async function sendReportEmail(payload: ReportEmailPayload): Promise<void> {
  const subject = buildReportEmailSubject(payload.shopName);
  const body = buildReportEmailBody(payload);

  if (process.env.RESEND_API_KEY?.trim()) {
    await sendViaResend(payload, subject, body);
    return;
  }

  await sendViaNodemailer(payload, subject, body);
}
