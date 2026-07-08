import { createHash } from "crypto";
import { cookies } from "next/headers";

const USER_COOKIE_NAME = "white-night-user";
const LINE_STATE_COOKIE_NAME = "white-night-line-state";

function getUserSessionSecret(): string {
  return (
    process.env.USER_SESSION_SECRET ??
    process.env.ADMIN_SESSION_SECRET ??
    "user-session-secret"
  );
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

export async function setUserCookie(userId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(USER_COOKIE_NAME, createUserSessionValue(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearUserCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(USER_COOKIE_NAME);
}

export async function setLineStateCookie(state: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(LINE_STATE_COOKIE_NAME, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });
}

export async function getLineStateCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(LINE_STATE_COOKIE_NAME)?.value ?? null;
}

export async function clearLineStateCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(LINE_STATE_COOKIE_NAME);
}
