import { buildWebLineLoginHref } from "@/lib/liff-login-intent";

export const MEMBER_PATHS = {
  consultation: "/consultation",
  diagnosis: "/diagnosis",
} as const;

/**
 * Always Web LINE Login (bot_prompt=aggressive, Auto Login enabled).
 * LIFF is only started from LineLoginButton inside the LINE in-app browser.
 */
export function buildLineLoginHref(redirectPath: string): string {
  return buildWebLineLoginHref(redirectPath);
}
