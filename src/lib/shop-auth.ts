import { createHash } from "crypto";
import { cookies } from "next/headers";

const SHOP_COOKIE_NAME = "white-night-shop";

function getShopSessionSecret(): string {
  return (
    process.env.SHOP_SESSION_SECRET ??
    process.env.ADMIN_SESSION_SECRET ??
    "shop-session-secret"
  );
}

export function createShopSessionValue(jobId: string): string {
  const token = createHash("sha256")
    .update(`shop:${jobId}:${getShopSessionSecret()}`)
    .digest("hex");
  return `${jobId}.${token}`;
}

export function parseShopSessionValue(value: string): string | null {
  const dotIndex = value.indexOf(".");
  if (dotIndex <= 0) return null;

  const jobId = value.slice(0, dotIndex);
  const token = value.slice(dotIndex + 1);
  const expected = createHash("sha256")
    .update(`shop:${jobId}:${getShopSessionSecret()}`)
    .digest("hex");

  if (token !== expected) return null;
  return jobId;
}

export async function getAuthenticatedShopJobId(): Promise<string | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(SHOP_COOKIE_NAME)?.value;
  if (!value) return null;
  return parseShopSessionValue(value);
}

export async function setShopCookie(jobId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SHOP_COOKIE_NAME, createShopSessionValue(jobId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function clearShopCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SHOP_COOKIE_NAME);
}
