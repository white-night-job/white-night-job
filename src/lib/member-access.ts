import {
  buildLiffAppUrl,
  buildWebLineLoginHref,
  getPublicLiffId,
} from "@/lib/liff-login-intent";

export const MEMBER_PATHS = {
  consultation: "/consultation",
  diagnosis: "/diagnosis",
} as const;

/**
 * Prefer LIFF Universal Link when configured; otherwise Web LINE Login.
 */
export function buildLineLoginHref(redirectPath: string): string {
  const liffId = getPublicLiffId();
  if (liffId) {
    return buildLiffAppUrl(liffId, { redirectPath });
  }
  return buildWebLineLoginHref(redirectPath);
}
