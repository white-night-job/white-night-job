import { createHmac, timingSafeEqual } from "crypto";

export type LinePendingLoginPayload = {
  lineUserId: string;
  displayName: string;
  pictureUrl: string | null;
  redirectPath: string;
  /** LINE Login user access token — used for friendship/v1/status when available */
  accessToken?: string | null;
  createdAt: number;
};

export const LINE_PENDING_LOGIN_COOKIE = "white-night-line-pending";
const PENDING_MAX_AGE_SEC = 60 * 15;

function getPendingSecret(): string {
  return (
    process.env.USER_SESSION_SECRET ??
    process.env.ADMIN_SESSION_SECRET ??
    "user-session-secret"
  );
}

function signPayload(encoded: string): string {
  return createHmac("sha256", getPendingSecret()).update(encoded).digest("hex");
}

export function encodeLinePendingLogin(payload: LinePendingLoginPayload): string {
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url",
  );
  return `${encoded}.${signPayload(encoded)}`;
}

export function decodeLinePendingLogin(
  value: string | null | undefined,
): LinePendingLoginPayload | null {
  if (!value) return null;
  const dot = value.lastIndexOf(".");
  if (dot <= 0) return null;
  const encoded = value.slice(0, dot);
  const signature = value.slice(dot + 1);
  const expected = signPayload(encoded);
  try {
    const a = Buffer.from(signature, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as LinePendingLoginPayload;
    if (!parsed?.lineUserId || !parsed.redirectPath) return null;
    if (
      typeof parsed.createdAt !== "number" ||
      Date.now() - parsed.createdAt > PENDING_MAX_AGE_SEC * 1000
    ) {
      return null;
    }
    return {
      lineUserId: String(parsed.lineUserId),
      displayName: String(parsed.displayName || "LINEユーザー"),
      pictureUrl: parsed.pictureUrl ? String(parsed.pictureUrl) : null,
      redirectPath: String(parsed.redirectPath || "/"),
      accessToken: parsed.accessToken ? String(parsed.accessToken) : null,
      createdAt: parsed.createdAt,
    };
  } catch {
    return null;
  }
}

export function getLineOfficialAccountAddUrl(): string {
  const raw =
    process.env.LINE_OFFICIAL_ACCOUNT_ID?.trim() ||
    process.env.NEXT_PUBLIC_LINE_OFFICIAL_ACCOUNT_ID?.trim() ||
    "@358cnyan";
  const id = raw.startsWith("@") ? raw : `@${raw}`;
  return `https://line.me/R/ti/p/${id}`;
}

export function getLineOfficialAccountId(): string {
  const raw =
    process.env.LINE_OFFICIAL_ACCOUNT_ID?.trim() ||
    process.env.NEXT_PUBLIC_LINE_OFFICIAL_ACCOUNT_ID?.trim() ||
    "@358cnyan";
  return raw.startsWith("@") ? raw : `@${raw}`;
}

/**
 * Server-side follow check.
 * Primary: Messaging API Get profile (200 = friend / follower).
 * Secondary (when Login access token exists): friendship/v1/status.
 */
export async function isLineOfficialAccountFriend(input: {
  lineUserId: string;
  accessToken?: string | null;
}): Promise<{ isFriend: boolean; method: string }> {
  const channelToken = process.env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN?.trim();
  if (!channelToken) {
    throw new Error("LINE_MESSAGING_CHANNEL_ACCESS_TOKEN is not set.");
  }

  const profileResponse = await fetch(
    `https://api.line.me/v2/bot/profile/${encodeURIComponent(input.lineUserId)}`,
    {
      headers: { Authorization: `Bearer ${channelToken}` },
      cache: "no-store",
    },
  );

  if (profileResponse.ok) {
    return { isFriend: true, method: "messaging_api_profile" };
  }

  if (profileResponse.status === 404) {
    // Not a friend / blocked — confirm with friendship API when possible.
    if (input.accessToken) {
      const friendship = await fetchLineFriendshipStatus(input.accessToken);
      return {
        isFriend: friendship,
        method: friendship
          ? "friendship_api_override"
          : "messaging_api_profile_404",
      };
    }
    return { isFriend: false, method: "messaging_api_profile_404" };
  }

  const errorBody = await profileResponse.text();
  console.error("[line-friendship] messaging profile failed", {
    status: profileResponse.status,
    errorBody,
    lineUserId: input.lineUserId,
  });

  // Fall back to friendship API if Messaging API errored unexpectedly.
  if (input.accessToken) {
    const friendship = await fetchLineFriendshipStatus(input.accessToken);
    return { isFriend: friendship, method: "friendship_api_fallback" };
  }

  throw new Error("フォロー状態の確認に失敗しました。");
}

async function fetchLineFriendshipStatus(accessToken: string): Promise<boolean> {
  const response = await fetch("https://api.line.me/friendship/v1/status", {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!response.ok) {
    const errorBody = await response.text();
    console.error("[line-friendship] friendship status failed", {
      status: response.status,
      errorBody,
    });
    return false;
  }
  const data = (await response.json()) as { friendFlag?: boolean };
  return Boolean(data.friendFlag);
}

export { PENDING_MAX_AGE_SEC };
