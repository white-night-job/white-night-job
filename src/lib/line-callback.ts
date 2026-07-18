import { NextResponse } from "next/server";
import {
  exchangeLineCodeForToken,
  fetchLineProfile,
} from "@/lib/line-auth";
import { completeLineLoginRedirect } from "@/lib/line-complete-login";
import {
  clearLineStateCookieOnResponse,
  describeUserCookieOptions,
  getLineStateCookie,
  parseLineStateCookie,
  USER_COOKIE_NAME,
} from "@/lib/user-auth";

const AUTO_LOGIN_FALLBACK_COOKIE = "white-night-line-fallback";

function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const [rawName, ...rest] = part.trim().split("=");
    if (rawName === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

/**
 * Per LINE docs: after Auto Login fails, retry once with disable_auto_login=true
 * so the user gets SSO / email login instead of looping on Auto Login.
 */
function redirectToAutoLoginFallback(
  request: Request,
  requestUrl: URL,
  redirectPath: string,
): NextResponse {
  const alreadyTried = readCookie(request, AUTO_LOGIN_FALLBACK_COOKIE) === "1";
  if (alreadyTried) {
    const failed = NextResponse.redirect(
      new URL("/?lineLogin=failed", requestUrl.origin),
      { status: 303 },
    );
    return clearLineStateCookieOnResponse(failed, request);
  }

  const login = new URL("/api/line/login", requestUrl.origin);
  login.searchParams.set("redirect", redirectPath || "/");
  login.searchParams.set("disable_auto_login", "1");

  const response = NextResponse.redirect(login, { status: 303 });
  clearLineStateCookieOnResponse(response, request);
  response.cookies.set(AUTO_LOGIN_FALLBACK_COOKIE, "1", {
    httpOnly: true,
    secure: requestUrl.protocol === "https:",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });
  return response;
}

export async function handleLineCallback(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  const oauthError = requestUrl.searchParams.get("error");

  console.log("[line-callback] start", {
    path: requestUrl.pathname,
    hasCode: Boolean(code),
    hasState: Boolean(state),
    oauthError,
    host: requestUrl.host,
  });

  const stateCookie = await getLineStateCookie(request);
  const parsedState = stateCookie ? parseLineStateCookie(stateCookie) : null;
  const redirectPath = parsedState?.redirectPath || "/";

  if (oauthError) {
    console.log("[line-callback] oauth error from LINE", oauthError);
    return redirectToAutoLoginFallback(request, requestUrl, redirectPath);
  }

  if (!code || !state) {
    console.log("[line-callback] abort: missing code or state");
    return redirectToAutoLoginFallback(request, requestUrl, redirectPath);
  }

  console.log("[line-callback] state cookie", { hasStateCookie: Boolean(stateCookie) });
  if (!stateCookie || !parsedState) {
    console.log("[line-callback] abort: missing state cookie");
    return redirectToAutoLoginFallback(request, requestUrl, redirectPath);
  }

  if (parsedState.state !== state) {
    console.log("[line-callback] abort: state mismatch", {
      receivedState: state,
      parsedState,
    });
    return redirectToAutoLoginFallback(request, requestUrl, parsedState.redirectPath);
  }

  try {
    const accessToken = await exchangeLineCodeForToken(code);
    console.log("[line-callback] LINE token acquired");

    const profile = await fetchLineProfile(accessToken);
    console.log("[line-callback] LINE profile", {
      lineUserId: profile.userId,
      displayName: profile.displayName,
      hasPicture: Boolean(profile.pictureUrl),
    });

    const response = await completeLineLoginRedirect({
      lineUserId: profile.userId,
      displayName: profile.displayName,
      pictureUrl: profile.pictureUrl,
      accessToken,
      redirectPath: parsedState.redirectPath,
      request,
      requestUrl,
      beforeRedirect: (res) => {
        clearLineStateCookieOnResponse(res, request);
        res.cookies.set(AUTO_LOGIN_FALLBACK_COOKIE, "", {
          httpOnly: true,
          secure: requestUrl.protocol === "https:",
          sameSite: "lax",
          path: "/",
          maxAge: 0,
        });
      },
    });

    const cookieOptions = describeUserCookieOptions(request);
    const setCookieHeader = response.headers.get("set-cookie");
    console.log("[line-callback] response prepared", {
      ...cookieOptions,
      location: response.headers.get("location"),
      hasSetCookieHeader: Boolean(setCookieHeader),
      includesUserCookie: Boolean(setCookieHeader?.includes(USER_COOKIE_NAME)),
      setCookiePreview: setCookieHeader?.slice(0, 240) ?? null,
    });

    return response;
  } catch (error) {
    console.error("[line-callback] LINE login failed:", error);
    return redirectToAutoLoginFallback(request, requestUrl, parsedState.redirectPath);
  }
}
