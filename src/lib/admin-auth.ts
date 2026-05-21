import { createHash } from "crypto";
import { cookies } from "next/headers";

const ADMIN_COOKIE_NAME = "white-night-admin";

function getAdminPassword(): string {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    throw new Error("ADMIN_PASSWORD is not set. .env.local を確認してください。");
  }
  return password;
}

function getSessionSecret(): string {
  return process.env.ADMIN_SESSION_SECRET ?? getAdminPassword();
}

export function createAdminToken(): string {
  return createHash("sha256")
    .update(`${getAdminPassword()}:${getSessionSecret()}`)
    .digest("hex");
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_COOKIE_NAME)?.value === createAdminToken();
}

export async function setAdminCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, createAdminToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function clearAdminCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
}

export function isValidAdminPassword(password: string): boolean {
  return password === getAdminPassword();
}
