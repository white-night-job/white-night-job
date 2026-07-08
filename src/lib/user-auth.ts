import { createHash } from "crypto";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

export const USER_COOKIE_NAME = "white-night-user";
export const LINE_STATE_COOKIE_NAME = "white-night-line-state";
const LINE_STATE_DELIMITER = "|";
const USER_SESSION_MAX_AGE = 60 * 60 * 24 * 30;

function getUserSessionSecret(): string {
  return (
    process.env.USER_SESSION_SECRET ??
    process.env.ADMIN_SESSION_SECRET ??
    "user-session-secret"
  );
}

function isProductionHost(request?: Request): boolean {
  if (process.env.NODE_ENV === "production") return true;
  if (!request) return false;
  const host = new URL(request.url).hostname;
  return host === "whitenightjob.jp" || host.endsWith(".whitenightjob.jp");
}

export function buildUserCookieOptions(request?: Request) {
  const domain = process.env.COOKIE_DOMAIN?.trim() || undefined;
  return {
    httpOnly: true,
    secure: isProductionHost(request) || process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    ...(domain ? { domain } : {}),
  };
}

export function createUserSessionValue(userId: string): string {
  const token = createHash("sha256")
    .update(`user:${userId}:${getUserSessionSecret()}`)
    .digest("hex");
  return `${userId}.${token}`;
}

export function parseUserSessionValue(value: string): string | null {
  const dotIndex = value.indexOf(".");
  if (dotIndex <= 0) return null;

  const userId = value.slice(0, dotIndex);
  const token = value.slice(dotIndex + 1);
  const expected = createHash("sha256")
    .update(`user:${userId}:${getUserSessionSecret()}`)
    .digest("hex");
  if (token !== expected) return null;
  return userId;
}

function readCookieFromHeader(
  cookieHeader: string | null,
  name: string,
): string | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const [rawName, ...rest] = part.trim().split("=");
    if (rawName === name) {
      return decodeURIComponent(rest.join("="));
    }
  }
  return null;
}

export async function getAuthenticatedUserId(
  request?: Request,
): Promise<string | null> {
  const cookieStore = await cookies();
  let value = cookieStore.get(USER_COOKIE_NAME)?.value ?? null;

  if (!value && request) {
    value = readCookieFromHeader(request.headers.get("cookie"), USER_COOKIE_NAME);
  }

  if (!value) return null;
  return parseUserSessionValue(value);
}

export async function setUserSessionCookie(
  userId: string,
  request?: Request,
): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(USER_COOKIE_NAME, createUserSessionValue(userId), {
    ...buildUserCookieOptions(request),
    maxAge: USER_SESSION_MAX_AGE,
  });
}

export function attachUserSessionCookie(
  response: NextResponse,
  userId: string,
  request?: Request,
): NextResponse {
  response.cookies.set(USER_COOKIE_NAME, createUserSessionValue(userId), {
    ...buildUserCookieOptions(request),
    maxAge: USER_SESSION_MAX_AGE,
  });
  return response;
}

export function attachLineStateCookie(
  response: NextResponse,
  state: string,
  redirectPath: string,
  request?: Request,
): NextResponse {
  response.cookies.set(
    LINE_STATE_COOKIE_NAME,
    `${state}${LINE_STATE_DELIMITER}${redirectPath}`,
    {
      ...buildUserCookieOptions(request),
      maxAge: 60 * 10,
    },
  );
  return response;
}

export function clearLineStateCookieOnResponse(
  response: NextResponse,
  request?: Request,
): NextResponse {
  response.cookies.set(LINE_STATE_COOKIE_NAME, "", {
    ...buildUserCookieOptions(request),
    maxAge: 0,
  });
  return response;
}

export function clearUserSessionCookie(
  response: NextResponse,
  request?: Request,
): NextResponse {
  response.cookies.set(USER_COOKIE_NAME, "", {
    ...buildUserCookieOptions(request),
    maxAge: 0,
  });
  return response;
}

export async function getLineStateCookie(request?: Request): Promise<string | null> {
  const cookieStore = await cookies();
  const fromStore = cookieStore.get(LINE_STATE_COOKIE_NAME)?.value;
  if (fromStore) return fromStore;
  if (!request) return null;
  return readCookieFromHeader(
    request.headers.get("cookie"),
    LINE_STATE_COOKIE_NAME,
  );
}

export function parseLineStateCookie(
  value: string,
): { state: string; redirectPath: string } | null {
  const delimiterIndex = value.indexOf(LINE_STATE_DELIMITER);
  if (delimiterIndex <= 0) {
    const legacyIndex = value.indexOf(":");
    if (legacyIndex <= 0) return null;
    return {
      state: value.slice(0, legacyIndex),
      redirectPath: value.slice(legacyIndex + 1) || "/",
    };
  }
  return {
    state: value.slice(0, delimiterIndex),
    redirectPath: value.slice(delimiterIndex + LINE_STATE_DELIMITER.length) || "/",
  };
}

export async function clearUserCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(USER_COOKIE_NAME);
}
