import { Resend } from "resend";
import nodemailer from "nodemailer";

const DEFAULT_ADMIN_EMAIL = "whitenightjob.info@gmail.com";

export function getAdminNotifyEmail(): string {
  return (
    process.env.REPORT_EMAIL?.trim() ||
    process.env.ADMIN_NOTIFY_EMAIL?.trim() ||
    DEFAULT_ADMIN_EMAIL
  );
}

export type SendMailOptions = {
  to: string | string[];
  subject: string;
  text: string;
  replyTo?: string;
};

async function sendViaResend(options: SendMailOptions): Promise<void> {
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
    to: options.to,
    subject: options.subject,
    text: options.text,
    ...(options.replyTo ? { replyTo: options.replyTo } : {}),
  });

  if (error) {
    throw new Error(error.message || "Resendでのメール送信に失敗しました。");
  }
}

async function sendViaNodemailer(options: SendMailOptions): Promise<void> {
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
    to: options.to,
    subject: options.subject,
    text: options.text,
    ...(options.replyTo ? { replyTo: options.replyTo } : {}),
  });
}

export async function sendMail(options: SendMailOptions): Promise<void> {
  if (process.env.RESEND_API_KEY?.trim()) {
    await sendViaResend(options);
    return;
  }
  await sendViaNodemailer(options);
}

export function hasMailConfig(): boolean {
  if (process.env.RESEND_API_KEY?.trim()) return true;
  return Boolean(
    process.env.SMTP_HOST?.trim() &&
      process.env.SMTP_USER?.trim() &&
      process.env.SMTP_PASS?.trim(),
  );
}
