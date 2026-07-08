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
  const value = process.env[name];
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
  const params = new URLSearchParams({
    response_type: "code",
    client_id: requireEnv("LINE_LOGIN_CHANNEL_ID"),
    redirect_uri: getLineLoginRedirectUri(),
    state,
    scope: "profile openid",
  });
  return `https://access.line.me/oauth2/v2.1/authorize?${params.toString()}`;
}

export async function exchangeLineCodeForToken(code: string): Promise<string> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: getLineLoginRedirectUri(),
    client_id: requireEnv("LINE_LOGIN_CHANNEL_ID"),
    client_secret: requireEnv("LINE_LOGIN_CHANNEL_SECRET"),
  });
  const response = await fetch("https://api.line.me/oauth2/v2.1/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!response.ok) {
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

export async function sendLinePushMessage(
  lineUserId: string,
  message: string,
): Promise<void> {
  const channelToken = process.env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN;
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
      messages: [{ type: "text", text: message }],
    }),
  });
  if (!response.ok) {
    throw new Error("LINE通知送信に失敗しました。");
  }
}
