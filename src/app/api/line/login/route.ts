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

function normalizeEnvId(raw: string | undefined | null): string | null {
  if (raw == null) return null;
  const value = String(raw).replace(/\r?\n/g, "").trim();
  return value || null;
}

/** Public diagnostics for bot_prompt / client_id mismatch investigations (no secrets). */
function buildLoginDiagnostics(authorizeUrl: string) {
  const parsed = new URL(authorizeUrl);
  const clientId = parsed.searchParams.get("client_id");
  const envClientId = normalizeEnvId(process.env.LINE_LOGIN_CHANNEL_ID);
  const liffId = normalizeEnvId(process.env.NEXT_PUBLIC_LIFF_ID);
  const liffChannelIdPrefix = liffId?.split("-")[0] ?? null;

  return {
    /** Env var that supplies authorize URL client_id */
    clientIdEnvVar: "LINE_LOGIN_CHANNEL_ID" as const,
    /** client_id in the authorize URL (must equal LINE Login Channel ID) */
    clientId,
    /** Whether LINE_LOGIN_CHANNEL_ID matches authorize URL client_id */
    envClientIdMatchesAuthorizeUrl: Boolean(
      envClientId && clientId && envClientId === clientId,
    ),
    redirectUri: parsed.searchParams.get("redirect_uri"),
    botPrompt: parsed.searchParams.get("bot_prompt"),
    scope: parsed.searchParams.get("scope"),
    responseType: parsed.searchParams.get("response_type"),
    liffId,
    liffChannelIdPrefix,
    /** LIFF apps belong to a Login channel; prefix should match client_id */
    liffPrefixMatchesClientId: Boolean(
      liffChannelIdPrefix && clientId && liffChannelIdPrefix === clientId,
    ),
    /** These names are NOT used for authorize URL generation */
    unusedEnvNames: [
      "LINE_CHANNEL_ID",
      "NEXT_PUBLIC_LINE_CHANNEL_ID",
    ] as const,
  };
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

  const diagnostics = buildLoginDiagnostics(authorizeUrl);

  console.log("[api/line/login] authorize URL", authorizeUrl);
  console.log("[api/line/login] authorize query", new URL(authorizeUrl).search);
  console.log("[api/line/login] client_id diagnostics", diagnostics);
  console.log("[api/line/login] bot_prompt", diagnostics.botPrompt, {
    disableAutoLogin,
    redirect,
  });

  if (diagnostics.liffId && diagnostics.liffPrefixMatchesClientId === false) {
    console.error(
      "[api/line/login] WARNING: NEXT_PUBLIC_LIFF_ID channel prefix does not match LINE_LOGIN_CHANNEL_ID / authorize client_id. Friend-add (bot_prompt) requires OA linked to the Login channel of client_id.",
      {
        clientId: diagnostics.clientId,
        liffChannelIdPrefix: diagnostics.liffChannelIdPrefix,
        liffId: diagnostics.liffId,
      },
    );
  }

  if (wantsJson(request, url)) {
    const response = NextResponse.json({
      authorizeUrl,
      fallbackUrl,
      redirect,
      disableAutoLogin,
      botPrompt: diagnostics.botPrompt,
      clientId: diagnostics.clientId,
      diagnostics,
      liffId: diagnostics.liffId,
    });
    attachLineStateCookie(response, state, redirect, request);
    return response;
  }

  const response = NextResponse.redirect(authorizeUrl, { status: 303 });
  return attachLineStateCookie(response, state, redirect, request);
}
