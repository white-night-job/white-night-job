import { createHash } from "crypto";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

export const USER_COOKIE_NAME = "white-night-user";
export const LINE_STATE_COOKIE_NAME = "white-night-line-state";
const LINE_STATE_DELIMITER = "|";

function getUserSessionSecret(): string {
  return (
    process.env.USER_SESSION_SECRET ??
    process.env.ADMIN_SESSION_SECRET ??
    "user-session-secret"
  );
}

function resolveCookieDomain(): string | undefined {
  const configured = process.env.COOKIE_DOMAIN?.trim();
  return configured || undefined;
}

function isSecureRequest(request?: Request): boolean {
  if (request) {
    const forwardedProto = request.headers.get("x-forwarded-proto");
    if (forwardedProto) {
      return forwardedProto.split(",")[0]?.trim() === "https";
    }
    return new URL(request.url).protocol === "https:";
  }
  return process.env.NODE_ENV === "production";
}

function buildCookieOptions(request?: Request) {
  const domain = resolveCookieDomain();
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isSecureRequest(request),
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

export async function getAuthenticatedUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(USER_COOKIE_NAME)?.value;
  if (!value) return null;
  return parseUserSessionValue(value);
}

export function attachUserSessionCookie(
  response: NextResponse,
  userId: string,
  request?: Request,
): NextResponse {
  response.cookies.set(USER_COOKIE_NAME, createUserSessionValue(userId), {
    ...buildCookieOptions(request),
    maxAge: 60 * 60 * 24 * 30,
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
      ...buildCookieOptions(request),
      maxAge: 60 * 10,
    },
  );
  return response;
}

export function clearLineStateCookieOnResponse(response: NextResponse): NextResponse {
  response.cookies.delete(LINE_STATE_COOKIE_NAME);
  return response;
}

export function clearUserSessionCookie(
  response: NextResponse,
  request?: Request,
): NextResponse {
  response.cookies.set(USER_COOKIE_NAME, "", {
    ...buildCookieOptions(request),
    maxAge: 0,
  });
  return response;
}

export async function getLineStateCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(LINE_STATE_COOKIE_NAME)?.value ?? null;
}

export function parseLineStateCookie(
  value: string,
): { state: string; redirectPath: string } | null {
  const delimiterIndex = value.indexOf(LINE_STATE_DELIMITER);
  if (delimiterIndex <= 0) return null;
  return {
    state: value.slice(0, delimiterIndex),
    redirectPath: value.slice(delimiterIndex + LINE_STATE_DELIMITER.length) || "/",
  };
}

export async function clearUserCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(USER_COOKIE_NAME);
}
