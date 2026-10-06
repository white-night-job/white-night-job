import { createHmac, timingSafeEqual } from "crypto";
import { LinePushError, maskLineUserId } from "@/lib/line-auth";

/**
 * 店舗サポート公式LINE（Messaging API）専用。
 * 女の子向け公式LINEの LINE_MESSAGING_CHANNEL_* は参照しない。
 */

function getStoreLineChannelSecret(): string | null {
  return process.env.STORE_LINE_MESSAGING_CHANNEL_SECRET?.trim() || null;
}

function getStoreLineChannelAccessToken(): string | null {
  return process.env.STORE_LINE_MESSAGING_CHANNEL_ACCESS_TOKEN?.trim() || null;
}

export function hasStoreLineChannelSecret(): boolean {
  return Boolean(getStoreLineChannelSecret());
}

export function hasStoreLineChannelAccessToken(): boolean {
  return Boolean(getStoreLineChannelAccessToken());
}

function requireStoreLineChannelAccessToken(): string {
  const token = getStoreLineChannelAccessToken();
  if (!token) {
    throw new Error("STORE_LINE_MESSAGING_CHANNEL_ACCESS_TOKEN is not set.");
  }
  return token;
}

export function verifyStoreLineSignature(body: string, signature: string): boolean {
  const secret = getStoreLineChannelSecret();
  if (!secret) return false;
  const digest = createHmac("sha256", secret).update(body).digest("base64");
  const a = Buffer.from(digest);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Returns null when the user is not a friend of the store support account (404). */
export async function fetchStoreLineProfile(
  lineUserId: string,
): Promise<{ displayName: string; pictureUrl: string | null } | null> {
  const token = requireStoreLineChannelAccessToken();
  const response = await fetch(
    `https://api.line.me/v2/bot/profile/${encodeURIComponent(lineUserId)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  );
  if (response.status === 404) return null;
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `店舗サポートLINEのプロフィール取得に失敗しました。(${response.status}) ${errorBody.slice(0, 200)}`,
    );
  }
  const data = (await response.json()) as {
    displayName?: string;
    pictureUrl?: string;
  };
  return {
    displayName: data.displayName?.trim() || "",
    pictureUrl: data.pictureUrl?.trim() || null,
  };
}

export async function sendStoreLinePushText(
  lineUserId: string,
  text: string,
): Promise<void> {
  const token = requireStoreLineChannelAccessToken();
  const response = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      to: lineUserId,
      messages: [{ type: "text", text }],
    }),
  });
  if (!response.ok) {
    const errorBody = await response.text();
    console.error("[store-line] push message failed", {
      lineUserIdMasked: maskLineUserId(lineUserId),
      status: response.status,
      errorBody: errorBody.slice(0, 500),
    });
    throw new LinePushError(response.status, errorBody);
  }
  console.info("[store-line] push message ok", {
    lineUserIdMasked: maskLineUserId(lineUserId),
    status: response.status,
  });
}
