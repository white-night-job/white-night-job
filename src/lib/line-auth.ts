import { randomBytes, randomUUID } from "crypto";

type LineTokenResponse = {
  access_token: string;
  id_token?: string;
};

type LineProfile = {
  userId: string;
  displayName: string;
  pictureUrl?: string;
};

export type BuildLineLoginUrlOptions = {
  /** When true, skip LINE app Auto Login and show SSO / email login. */
  disableAutoLogin?: boolean;
  /** OpenID nonce (recommended when scope includes openid). */
  nonce?: string;
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

export function createLineLoginNonce(): string {
  return randomBytes(16).toString("hex");
}

/**
 * LINE Login v2.1 authorization URL.
 * Uses https://access.line.me/oauth2/v2.1/authorize so mobile Auto Login
 * (Universal Links / App Links) can open the LINE app when available.
 *
 * Always includes bot_prompt=aggressive (or LINE_LOGIN_BOT_PROMPT=normal)
 * so users who have not added the linked official account are prompted
 * after consent. Already-friended users are not repeatedly blocked.
 */
export function buildLineLoginUrl(
  state: string,
  options: BuildLineLoginUrlOptions = {},
): string {
  const redirectUri = getLineLoginRedirectUri();
  const nonce = options.nonce ?? createLineLoginNonce();
  const params = new URLSearchParams();
  params.set("response_type", "code");
  params.set("client_id", requireEnv("LINE_LOGIN_CHANNEL_ID"));
  params.set("redirect_uri", redirectUri);
  params.set("state", state);
  params.set("scope", "profile openid");
  params.set("nonce", nonce);

  // Friend-add / unblock prompt after login (linked Messaging API account).
  // Force a single set — never omit; never rely on constructor defaults alone.
  const envBotPrompt = process.env.LINE_LOGIN_BOT_PROMPT?.trim().replace(/\r?\n/g, "");
  const botPrompt =
    envBotPrompt === "normal" || envBotPrompt === "aggressive"
      ? envBotPrompt
      : "aggressive";
  params.set("bot_prompt", botPrompt);

  // Only set when Auto Login already failed — otherwise LINE shows email/password.
  if (options.disableAutoLogin) {
    params.set("disable_auto_login", "true");
  }

  // Defensive: guarantee bot_prompt survives any future param edits.
  if (params.get("bot_prompt") !== "aggressive" && params.get("bot_prompt") !== "normal") {
    params.set("bot_prompt", "aggressive");
  }

  const query = params.toString();
  const url = `https://access.line.me/oauth2/v2.1/authorize?${query}`;

  console.log("[line-auth] authorize URL query", query);
  console.log("[line-auth] authorize redirect_uri", redirectUri, {
    disableAutoLogin: Boolean(options.disableAutoLogin),
    hasNonce: Boolean(nonce),
    botPrompt: params.get("bot_prompt"),
  });

  if (!query.includes("bot_prompt=")) {
    console.error("[line-auth] FATAL: bot_prompt missing from authorize URL");
  }

  return url;
}

/** Ensure authorize URL always has bot_prompt=aggressive (client/server guard). */
export function ensureBotPromptOnAuthorizeUrl(authorizeUrl: string): string {
  const url = new URL(authorizeUrl);
  const current = url.searchParams.get("bot_prompt");
  if (current !== "aggressive" && current !== "normal") {
    url.searchParams.set("bot_prompt", "aggressive");
  }
  // Prefer aggressive for friend-add reliability unless explicitly normal.
  if (current !== "normal") {
    url.searchParams.set("bot_prompt", "aggressive");
  }
  return url.toString();
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
