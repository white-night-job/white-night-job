import { Resend } from "resend";
import nodemailer from "nodemailer";

const DEFAULT_ADMIN_EMAIL = "whitenightjob.info@gmail.com";

/** Authenticated-domain From. Never falls back to resend.dev. */
export function getResendFromEmail(): string {
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  if (!from) {
    throw new Error(
      "RESEND_FROM_EMAIL が設定されていません。例: White Night Job <info@whitenightjob.jp>",
    );
  }
  if (/resend\.dev/i.test(from)) {
    throw new Error(
      "RESEND_FROM_EMAIL に resend.dev は使用できません。認証済みドメイン（例: info@whitenightjob.jp）を設定してください。",
    );
  }
  return from;
}

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

export type SendMailResult = {
  provider: "resend" | "smtp";
  id?: string;
  to: string | string[];
  from: string;
  subject: string;
};

function describeMailConfig(): Record<string, boolean | string> {
  return {
    hasResendApiKey: Boolean(process.env.RESEND_API_KEY?.trim()),
    hasResendFrom: Boolean(process.env.RESEND_FROM_EMAIL?.trim()),
    resendFromPreview: process.env.RESEND_FROM_EMAIL?.trim()
      ? process.env.RESEND_FROM_EMAIL.trim()
      : "(unset)",
    hasSmtpHost: Boolean(process.env.SMTP_HOST?.trim()),
    hasSmtpUser: Boolean(process.env.SMTP_USER?.trim()),
    hasSmtpPass: Boolean(process.env.SMTP_PASS?.trim()),
    hasSmtpFrom: Boolean(process.env.SMTP_FROM?.trim()),
    hasReportEmail: Boolean(process.env.REPORT_EMAIL?.trim()),
    hasAdminNotifyEmail: Boolean(process.env.ADMIN_NOTIFY_EMAIL?.trim()),
    adminNotifyResolved: getAdminNotifyEmail(),
  };
}

export function getMailConfigSnapshot(): Record<string, boolean | string> {
  return describeMailConfig();
}

function formatResendError(error: unknown): string {
  if (!error) return "Resendでのメール送信に失敗しました。";
  if (typeof error === "string") return error;
  if (typeof error === "object") {
    const e = error as {
      message?: string;
      name?: string;
      statusCode?: number;
    };
    const parts = [
      e.name,
      e.statusCode != null ? `status=${e.statusCode}` : null,
      e.message,
    ].filter(Boolean);
    if (parts.length > 0) return parts.join(" ");
  }
  return "Resendでのメール送信に失敗しました。";
}

async function sendViaResend(options: SendMailOptions): Promise<SendMailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("RESEND_API_KEY が設定されていません。");
  }

  const resend = new Resend(apiKey);
  const from = getResendFromEmail();

  console.info("[mail] Resend send start", {
    to: options.to,
    from,
    subject: options.subject,
    hasReplyTo: Boolean(options.replyTo),
  });

  const response = await resend.emails.send({
    from,
    to: options.to,
    subject: options.subject,
    text: options.text,
    ...(options.replyTo ? { replyTo: options.replyTo } : {}),
  });

  console.info("[mail] Resend emails.send response", {
    data: response.data,
    error: response.error,
    to: options.to,
    from,
    subject: options.subject,
  });

  if (response.error) {
    const message = formatResendError(response.error);
    console.error("[mail] Resend send failed:", message, response.error);
    throw new Error(message);
  }

  const id =
    response.data && typeof response.data === "object" && "id" in response.data
      ? String((response.data as { id?: string }).id ?? "")
      : undefined;

  console.info("[mail] Resend send ok", {
    id: id || null,
    to: options.to,
    from,
    subject: options.subject,
  });

  return {
    provider: "resend",
    id: id || undefined,
    to: options.to,
    from,
    subject: options.subject,
  };
}

async function sendViaNodemailer(
  options: SendMailOptions,
): Promise<SendMailResult> {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();

  if (!host || !user || !pass) {
    console.error("[mail] SMTP config incomplete", describeMailConfig());
    throw new Error(
      "メール送信の設定がありません。RESEND_API_KEY または SMTP 設定を確認してください。",
    );
  }

  const from =
    process.env.SMTP_FROM?.trim() ||
    process.env.RESEND_FROM_EMAIL?.trim() ||
    user;
  const port = Number(process.env.SMTP_PORT ?? 587);

  console.info("[mail] SMTP send start", {
    host,
    port,
    secure: process.env.SMTP_SECURE === "true",
    to: options.to,
    from,
    subject: options.subject,
  });

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass },
  });

  const info = await transporter.sendMail({
    from,
    to: options.to,
    subject: options.subject,
    text: options.text,
    ...(options.replyTo ? { replyTo: options.replyTo } : {}),
  });

  console.info("[mail] SMTP send response", {
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected,
    response: info.response,
    to: options.to,
    from,
    subject: options.subject,
  });

  return {
    provider: "smtp",
    id: info.messageId,
    to: options.to,
    from,
    subject: options.subject,
  };
}

export async function sendMail(
  options: SendMailOptions,
): Promise<SendMailResult> {
  if (process.env.RESEND_API_KEY?.trim()) {
    return sendViaResend(options);
  }
  return sendViaNodemailer(options);
}

export function hasMailConfig(): boolean {
  if (process.env.RESEND_API_KEY?.trim()) {
    return Boolean(process.env.RESEND_FROM_EMAIL?.trim());
  }
  return Boolean(
    process.env.SMTP_HOST?.trim() &&
      process.env.SMTP_USER?.trim() &&
      process.env.SMTP_PASS?.trim(),
  );
}
