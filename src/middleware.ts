import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const CANONICAL_HOST = "www.whitenightjob.jp";
const APEX_HOST = "whitenightjob.jp";

/**
 * Enforce https://www.whitenightjob.jp as the sole public origin.
 * - apex (whitenightjob.jp) → www (one hop, 308)
 * - http → https when on production hosts
 * - never redirects when already on https://www
 */
export function middleware(request: NextRequest) {
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
  // Skip Next internals and static assets; still cover pages, sitemap, robots, API entry.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
