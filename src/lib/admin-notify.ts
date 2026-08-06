import { getAdminNotifyEmail, hasMailConfig, sendMail } from "@/lib/mail";

export type AdminNotifyChannel = "resend" | "line" | "discord";

export type AdminNotifyPayload = {
  title: string;
  message: string;
  /** 将来 LINE / Discord 用の短い本文 */
  shortMessage?: string;
};

export type AdminNotifyResult = {
  channel: AdminNotifyChannel;
  ok: boolean;
  detail?: string;
};

/**
 * 運営通知の送信抽象層。
 * 現状は Resend メールのみ。後から LINE / Discord へ切替可能。
 *
 * 切替: ADMIN_NOTIFY_CHANNEL=resend|line|discord（未設定時は resend）
 */
export function getAdminNotifyChannel(): AdminNotifyChannel {
  const raw = process.env.ADMIN_NOTIFY_CHANNEL?.trim().toLowerCase();
  if (raw === "line" || raw === "discord" || raw === "resend") return raw;
  return "resend";
}

async function sendViaResendChannel(
  payload: AdminNotifyPayload,
): Promise<AdminNotifyResult> {
  if (!hasMailConfig()) {
    return {
      channel: "resend",
      ok: false,
      detail: "Resend / SMTP が未設定のためメール通知をスキップしました。",
    };
  }

  const to = getAdminNotifyEmail();
  const result = await sendMail({
    to,
    subject: `[White Night Job] ${payload.title}`,
    text: payload.message,
  });

  return {
    channel: "resend",
    ok: true,
    detail: `mail:${result.provider}:${result.id ?? "sent"}`,
  };
}

/** 将来実装用スタブ */
async function sendViaLineChannel(
  _payload: AdminNotifyPayload,
): Promise<AdminNotifyResult> {
  return {
    channel: "line",
    ok: false,
    detail:
      "LINE 通知は未実装です。ADMIN_NOTIFY_CHANNEL=resend を使用してください。",
  };
}

/** 将来実装用スタブ */
async function sendViaDiscordChannel(
  _payload: AdminNotifyPayload,
): Promise<AdminNotifyResult> {
  return {
    channel: "discord",
    ok: false,
    detail:
      "Discord 通知は未実装です。ADMIN_NOTIFY_CHANNEL=resend を使用してください。",
  };
}

/**
 * 運営へ通知を送る（チャネル切替対応）。
 * 例外は投げず結果を返す（Webhook 本体を落とさない）。
 */
export async function notifyAdmin(
  payload: AdminNotifyPayload,
): Promise<AdminNotifyResult> {
  const channel = getAdminNotifyChannel();
  try {
    switch (channel) {
      case "line":
        return await sendViaLineChannel(payload);
      case "discord":
        return await sendViaDiscordChannel(payload);
      case "resend":
      default:
        return await sendViaResendChannel(payload);
    }
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error("[admin-notify] failed", { channel, detail });
    return { channel, ok: false, detail };
  }
}
