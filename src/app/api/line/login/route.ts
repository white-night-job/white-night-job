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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Bridge page: sets CSRF cookie then navigates to the official authorize URL.
 * iOS Universal Links need a real user tap on access.line.me — so the page
 * exposes a direct <a> and only auto-navigates on non-iOS where App Links
 * often still work from location.replace.
 */
function buildBridgeHtml(authorizeUrl: string, fallbackUrl: string): string {
  const safeAuthorize = escapeHtml(authorizeUrl);
  const safeFallback = escapeHtml(fallbackUrl);
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex" />
  <title>LINEログイン</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100dvh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #0d0d0d;
      color: #faf7f2;
    }
    .card {
      width: min(100%, 22rem);
      text-align: center;
    }
    .card p {
      margin: 0 0 1.25rem;
      font-size: 0.9375rem;
      line-height: 1.6;
      color: rgba(250, 247, 242, 0.88);
    }
    .btn {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 3.25rem;
      width: 100%;
      border-radius: 999px;
      background: #06c755;
      color: #fff;
      font-size: 1rem;
      font-weight: 700;
      text-decoration: none;
      letter-spacing: 0.02em;
    }
    .fallback {
      display: inline-block;
      margin-top: 1rem;
      font-size: 0.8125rem;
      color: rgba(212, 188, 142, 0.95);
      text-decoration: underline;
      text-underline-offset: 3px;
    }
  </style>
</head>
<body>
  <div class="card">
    <p>LINEアプリでログインします。<br />自動で開かない場合は下のボタンを押してください。</p>
    <a id="line-continue" class="btn" href="${safeAuthorize}" rel="noopener">LINEアプリで続ける</a>
    <a class="fallback" href="${safeFallback}" rel="noopener">ブラウザでログインする</a>
  </div>
  <script>
    (function () {
      var authorizeUrl = ${JSON.stringify(authorizeUrl)};
      var ua = navigator.userAgent || "";
      var isIOS = /iPhone|iPad|iPod/i.test(ua);
      // iOS Universal Links need a real tap on access.line.me.
      // Android App Links often still work with same-window navigation.
      if (!isIOS) {
        window.location.replace(authorizeUrl);
      }
    })();
  </script>
</body>
</html>`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const redirect = sanitizeRedirect(url.searchParams.get("redirect"));
  const disableAutoLogin =
    url.searchParams.get("disable_auto_login") === "1" ||
    url.searchParams.get("disable_auto_login") === "true";

  // Optional LIFF path for mobile when configured (most reliable LINE-app login).
  const liffId = process.env.NEXT_PUBLIC_LIFF_ID?.trim();
  const ua = request.headers.get("user-agent") ?? "";
  const isMobile = /iPhone|iPad|iPod|Android/i.test(ua);
  if (liffId && isMobile && !disableAutoLogin && !wantsJson(request, url)) {
    const liffPage = new URL("/liff/login", url.origin);
    liffPage.searchParams.set("redirect", redirect);
    return NextResponse.redirect(liffPage, { status: 303 });
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
    });
    return attachLineStateCookie(response, state, redirect, request);
  }

  // Prefer a bridge page over bare 303 so mobile can use a direct link to
  // access.line.me (required for LINE Auto Login / Universal Links on iOS).
  const response = new NextResponse(buildBridgeHtml(authorizeUrl, fallbackUrl), {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
  return attachLineStateCookie(response, state, redirect, request);
}
