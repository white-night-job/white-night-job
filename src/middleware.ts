import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const CANONICAL_HOST = "www.whitenightjob.jp";
const APEX_HOST = "whitenightjob.jp";

/** Exact legacy segments (canonical "girlsbar" is never listed). */
const LEGACY_GIRLSBAR_SEGMENTS = new Set([
  "girls-bar",
  "girls_bar",
  "girlsBar",
]);

function stripTrailingSlash(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

function isSusukinoGirlsbarLegacySegment(segment: string): boolean {
  if (segment === "girlsbar") return false;
  if (LEGACY_GIRLSBAR_SEGMENTS.has(segment)) return true;
  const lower = segment.toLowerCase();
  // Hyphen / underscore legacy, any casing.
  if (lower === "girls-bar" || lower === "girls_bar") return true;
  // Canonical slug with wrong casing only (Girlsbar, GIRLSBAR, …).
  if (lower === "girlsbar") return true;
  return false;
}

/**
 * Legacy Susukino girlsbar URLs → /girlsbar in one hop.
 * On apex/www, also force https + www (avoids apex→www→path chains).
 */
function susukinoGirlsbarLegacyDestination(request: NextRequest): URL | null {
  const pathname = stripTrailingSlash(request.nextUrl.pathname);
  const match = pathname.match(/^\/sapporo\/susukino\/([^/]+)(?:\/.*)?$/);
  if (!match) return null;

  const segment = match[1];
  if (!isSusukinoGirlsbarLegacySegment(segment)) return null;

  const hostname =
    (request.headers.get("host") ?? "").split(":")[0]?.toLowerCase() ?? "";
  const url = new URL("/sapporo/susukino/girlsbar", request.nextUrl.origin);
  url.search = request.nextUrl.search;

  if (hostname === APEX_HOST || hostname === CANONICAL_HOST) {
    url.protocol = "https:";
    url.hostname = CANONICAL_HOST;
    url.port = "";
  }

  return url;
}

/**
 * Enforce https://www.whitenightjob.jp, permanently redirect legacy
 * susukino girlsbar paths, and strip trailing slashes (see skipTrailingSlashRedirect).
 */
export function middleware(request: NextRequest) {
  const legacyDest = susukinoGirlsbarLegacyDestination(request);
  if (legacyDest) {
    return NextResponse.redirect(legacyDest, 308);
  }

  const { pathname } = request.nextUrl;
  if (pathname.length > 1 && pathname.endsWith("/")) {
    const stripped = stripTrailingSlash(pathname);
    const url = new URL(stripped, request.nextUrl.origin);
    url.search = request.nextUrl.search;
    return NextResponse.redirect(url, 308);
  }

  const hostHeader = request.headers.get("host") ?? "";
  const hostname = hostHeader.split(":")[0]?.toLowerCase() ?? "";

  if (hostname !== APEX_HOST && hostname !== CANONICAL_HOST) {
    return NextResponse.next();
  }

  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const proto =
    forwardedProto ||
    (request.nextUrl.protocol === "http:" ? "http" : "https");

  const needsHostFix = hostname === APEX_HOST;
  const needsHttps = proto === "http";

  if (!needsHostFix && !needsHttps) {
    return NextResponse.next();
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.protocol = "https:";
  redirectUrl.hostname = CANONICAL_HOST;
  redirectUrl.port = "";

  return NextResponse.redirect(redirectUrl, 308);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
