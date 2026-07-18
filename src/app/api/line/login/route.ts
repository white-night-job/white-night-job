import { NextResponse } from "next/server";
import {
  buildLineLoginUrl,
  createLineLoginNonce,
  createLineLoginState,
  ensureBotPromptOnAuthorizeUrl,
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

/**
 * Existing Web LINE Login entry (Safari / Chrome / fallback).
 * - format=json: returns authorizeUrl (includes bot_prompt=aggressive)
 * - otherwise: 303 to access.line.me
 *
 * LIFF login is started only from client tap via LineLoginButton / @line/liff
 * inside the LINE app. This route must not auto-redirect to LIFF.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const redirect = sanitizeRedirect(url.searchParams.get("redirect"));
  const disableAutoLogin =
    url.searchParams.get("disable_auto_login") === "1" ||
    url.searchParams.get("disable_auto_login") === "true";

  const state = createLineLoginState();
  const nonce = createLineLoginNonce();
  const authorizeUrl = ensureBotPromptOnAuthorizeUrl(
    buildLineLoginUrl(state, {
      nonce,
      disableAutoLogin,
    }),
  );
  const fallbackUrl = ensureBotPromptOnAuthorizeUrl(
    buildLineLoginUrl(state, {
      nonce,
      disableAutoLogin: true,
    }),
  );

  console.log("[api/line/login] authorize query", new URL(authorizeUrl).search);
  console.log("[api/line/login] bot_prompt", new URL(authorizeUrl).searchParams.get("bot_prompt"), {
    disableAutoLogin,
    redirect,
  });

  if (wantsJson(request, url)) {
    const response = NextResponse.json({
      authorizeUrl,
      fallbackUrl,
      redirect,
      disableAutoLogin,
      botPrompt: new URL(authorizeUrl).searchParams.get("bot_prompt"),
      liffId: process.env.NEXT_PUBLIC_LIFF_ID?.trim() || null,
    });
    attachLineStateCookie(response, state, redirect, request);
    return response;
  }

  const response = NextResponse.redirect(authorizeUrl, { status: 303 });
  return attachLineStateCookie(response, state, redirect, request);
}
