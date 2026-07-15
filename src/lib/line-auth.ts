import { randomUUID } from "crypto";

type LineTokenResponse = {
  access_token: string;
};

type LineProfile = {
  userId: string;
  displayName: string;
  pictureUrl?: string;
};

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is not set. .env.local を確認してください。`);
  }
  return value;
}

export function getLineLoginRedirectUri(): string {
  return requireEnv("LINE_LOGIN_REDIRECT_URI");
}

export function createLineLoginState(): string {
  return randomUUID();
}

export function buildLineLoginUrl(state: string): string {
  const redirectUri = getLineLoginRedirectUri();
  const params = new URLSearchParams({
    response_type: "code",
    client_id: requireEnv("LINE_LOGIN_CHANNEL_ID"),
    redirect_uri: redirectUri,
    state,
    scope: "profile openid",
  });
  const url = `https://access.line.me/oauth2/v2.1/authorize?${params.toString()}`;
  console.log("[line-auth] authorize redirect_uri", redirectUri);
  return url;
}

export async function exchangeLineCodeForToken(code: string): Promise<string> {
  const redirectUri = getLineLoginRedirectUri();
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: requireEnv("LINE_LOGIN_CHANNEL_ID"),
    client_secret: requireEnv("LINE_LOGIN_CHANNEL_SECRET"),
  });
  const response = await fetch("https://api.line.me/oauth2/v2.1/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!response.ok) {
    const errorBody = await response.text();
    console.error("[line-auth] token exchange failed", {
      status: response.status,
      redirectUri,
      errorBody,
    });
    throw new Error("LINE認証トークンの取得に失敗しました。");
  }
  const data = (await response.json()) as LineTokenResponse;
  if (!data.access_token) {
    throw new Error("LINEアクセストークンが取得できませんでした。");
  }
  return data.access_token;
}

export async function fetchLineProfile(accessToken: string): Promise<LineProfile> {
  const response = await fetch("https://api.line.me/v2/profile", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    throw new Error("LINEプロフィール取得に失敗しました。");
  }
  const data = (await response.json()) as LineProfile;
  if (!data.userId) {
    throw new Error("LINEユーザーIDが取得できませんでした。");
  }
  return data;
}

export class LinePushError extends Error {
  status: number;
  body: string;
  blocked: boolean;

  constructor(status: number, body: string) {
    super(`LINE通知送信に失敗しました。(${status})`);
    this.name = "LinePushError";
    this.status = status;
    this.body = body;
    this.blocked = isLineBlockedError(status, body);
  }
}

export function isLineBlockedError(status: number, body: string): boolean {
  const lower = body.toLowerCase();
  return (
    status === 403 ||
    lower.includes("not a friend") ||
    lower.includes("blocked") ||
    lower.includes("forbidden") ||
    lower.includes("user not found") ||
    lower.includes("no friendship")
  );
}

export async function sendLinePushMessage(
  lineUserId: string,
  message: string,
): Promise<void> {
  await sendLinePushMessages(lineUserId, [{ type: "text", text: message }]);
}

export async function sendLinePushMessages(
  lineUserId: string,
  messages: unknown[],
): Promise<void> {
  const channelToken = process.env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN?.trim();
  if (!channelToken) {
    throw new Error("LINE_MESSAGING_CHANNEL_ACCESS_TOKEN is not set.");
  }
  const response = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${channelToken}`,
    },
    body: JSON.stringify({
      to: lineUserId,
      messages,
    }),
  });
  if (!response.ok) {
    const errorBody = await response.text();
    console.error("[line-auth] push message failed", {
      lineUserId,
      status: response.status,
      errorBody,
      messages,
    });
    throw new LinePushError(response.status, errorBody);
  }
}
