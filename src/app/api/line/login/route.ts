import { NextResponse } from "next/server";
import {
  buildLineLoginUrl,
  createLineLoginNonce,
  createLineLoginState,
} from "@/lib/line-auth";
import { attachLineStateCookie } from "@/lib/user-auth";

export const dynamic = "force-dynamic";

function sanitizeRedirect(raw: string | null): string {
  const value = (raw ?? "/mypage").trim() || "/mypage";
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  return "/mypage";
}

function wantsJson(request: Request, url: URL): boolean {
  if (url.searchParams.get("format") === "json") return true;
  const accept = request.headers.get("accept") ?? "";
  return accept.includes("application/json");
}

function attachLiffRedirectCookie(
  response: NextResponse,
  redirect: string,
  requestUrl: URL,
): NextResponse {
  response.cookies.set("white-night-liff-redirect", redirect, {
    httpOnly: true,
    secure: requestUrl.protocol === "https:",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });
  return response;
}

/**
 * LINE Login entry.
 * - format=json: returns authorizeUrl (for client prefetch → direct Universal Link tap)
 * - otherwise: 303 straight to access.line.me (no intermediate bridge UI)
 * - when LIFF is configured on mobile: 303 to liff.line.me (opens LINE app)
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const redirect = sanitizeRedirect(url.searchParams.get("redirect"));
  const disableAutoLogin =
    url.searchParams.get("disable_auto_login") === "1" ||
    url.searchParams.get("disable_auto_login") === "true";

  const liffId = process.env.NEXT_PUBLIC_LIFF_ID?.trim();
  const ua = request.headers.get("user-agent") ?? "";
  const isMobile = /iPhone|iPad|iPod|Android/i.test(ua);

  // Prefer LIFF Universal Link — opens LINE app directly on mobile.
  if (liffId && isMobile && !disableAutoLogin && !wantsJson(request, url)) {
    const response = NextResponse.redirect(`https://liff.line.me/${liffId}`, {
      status: 303,
    });
    return attachLiffRedirectCookie(response, redirect, url);
  }

  const state = createLineLoginState();
  const nonce = createLineLoginNonce();
  const authorizeUrl = buildLineLoginUrl(state, {
    nonce,
    disableAutoLogin,
  });
  const fallbackUrl = buildLineLoginUrl(state, {
    nonce,
    disableAutoLogin: true,
  });

  if (wantsJson(request, url)) {
    const response = NextResponse.json({
      authorizeUrl,
      fallbackUrl,
      redirect,
      disableAutoLogin,
      liffId: liffId || null,
      liffUrl: liffId ? `https://liff.line.me/${liffId}` : null,
    });
    attachLineStateCookie(response, state, redirect, request);
    if (liffId) {
      attachLiffRedirectCookie(response, redirect, url);
    }
    return response;
  }

  // No bridge page — go straight to the official authorize URL.
  const response = NextResponse.redirect(authorizeUrl, { status: 303 });
  return attachLineStateCookie(response, state, redirect, request);
}
