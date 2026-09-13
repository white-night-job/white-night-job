import { createHash } from "crypto";
import { cookies } from "next/headers";
import { isAdminAuthenticated } from "@/lib/admin-auth";

/** Marks that the current shop session was opened via admin proxy access. */
const ADMIN_SHOP_VIEW_COOKIE = "white-night-admin-shop-view";

function getAdminShopViewSecret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ??
    process.env.SHOP_SESSION_SECRET ??
    process.env.ADMIN_PASSWORD ??
    "admin-shop-view-secret"
  );
}

export function createAdminShopViewValue(jobId: string): string {
  const token = createHash("sha256")
    .update(`admin-shop-view:${jobId}:${getAdminShopViewSecret()}`)
    .digest("hex");
  return `${jobId}.${token}`;
}

export function parseAdminShopViewValue(value: string): string | null {
  const dotIndex = value.indexOf(".");
  if (dotIndex <= 0) return null;

  const jobId = value.slice(0, dotIndex);
  const token = value.slice(dotIndex + 1);
  const expected = createHash("sha256")
    .update(`admin-shop-view:${jobId}:${getAdminShopViewSecret()}`)
    .digest("hex");

  if (token !== expected) return null;
  return jobId;
}

export async function getAdminShopViewJobId(): Promise<string | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(ADMIN_SHOP_VIEW_COOKIE)?.value;
  if (!value) return null;
  return parseAdminShopViewValue(value);
}

export async function setAdminShopViewCookie(jobId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SHOP_VIEW_COOKIE, createAdminShopViewValue(jobId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function clearAdminShopViewCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SHOP_VIEW_COOKIE);
}

/**
 * True only when an admin is logged in and the admin-shop-view marker
 * matches the given shop job id (proxy access, not a forged URL).
 */
export async function isAdminShopViewForJob(
  jobId: string,
): Promise<boolean> {
  if (!jobId) return false;
  if (!(await isAdminAuthenticated())) return false;
  const viewJobId = await getAdminShopViewJobId();
  return viewJobId === jobId;
}
