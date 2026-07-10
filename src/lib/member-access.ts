export const MEMBER_PATHS = {
  consultation: "/consultation",
  diagnosis: "/diagnosis",
} as const;

export function buildLineLoginHref(redirectPath: string): string {
  return `/api/line/login?redirect=${encodeURIComponent(redirectPath)}`;
}
