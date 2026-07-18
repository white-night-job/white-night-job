"use client";

import liff from "@line/liff";
import {
  clearLiffLoginIntent,
  getPublicLiffId,
  LIFF_LOGIN_ATTEMPT_KEY,
  logLiffDebug,
  readLiffLoginIntent,
  resolvePostLoginPath,
  saveLiffLoginIntent,
  type LiffLoginIntent,
} from "@/lib/liff-login-intent";

let initPromise: Promise<boolean> | null = null;
let initWithExternalLogin = false;

export function isLineInAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Line\//i.test(navigator.userAgent);
}

export async function ensureLiffInitialized(): Promise<boolean> {
  const liffId = getPublicLiffId();
  if (!liffId) return false;

  // Never use withLoginOnExternalBrowser — that forces access.line.me from LIFF
  // and breaks one-tap login inside the LINE app.
  if (!initPromise || initWithExternalLogin) {
    initWithExternalLogin = false;
    initPromise = liff
      .init({ liffId })
      .then(() => true)
      .catch((error) => {
        console.error("[liff] init failed", error);
        initPromise = null;
        return false;
      });
  }
  return initPromise;
}

export async function exchangeLiffSession(redirectPath: string): Promise<string> {
  const idToken = liff.getIDToken();
  const accessToken = liff.getAccessToken();

  if (!idToken && !accessToken) {
    throw new Error("LIFF token missing");
  }

  const response = await fetch("/api/line/liff-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      idToken: idToken || undefined,
      accessToken: accessToken || undefined,
      redirect: redirectPath,
    }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    console.error("[liff] session exchange failed", response.status, body);
    throw new Error("session create failed");
  }

  const data = (await response.json()) as { redirectPath?: string };
  return data.redirectPath || redirectPath || "/";
}

export type StartLiffLoginResult =
  | { status: "redirected"; destination: "liff_login" }
  | { status: "completed"; redirectPath: string }
  | { status: "fallback_web"; reason: string }
  | { status: "error"; message: string };

/**
 * Login button tap handler.
 *
 * - LINE app / LIFF in-client: liff.init → isLoggedIn ? session : liff.login()
 *   (never send to access.line.me with bot_prompt)
 * - Safari / Chrome etc.: fallback to Web LINE Login (/api/line/login + bot_prompt)
 */
export async function startLiffLogin(input: {
  redirectPath?: string;
  action?: LiffLoginIntent["action"];
  favoriteJobId?: string;
}): Promise<StartLiffLoginResult> {
  const intent = saveLiffLoginIntent(input);
  const liffId = getPublicLiffId();
  const inLineApp = isLineInAppBrowser();

  logLiffDebug("login_button_tap", {
    liffIdConfigured: Boolean(liffId),
    inLineApp,
  });

  if (!liffId) {
    logLiffDebug("fallback_web_login", {
      reason: "LIFF_ID_MISSING",
      choseLiffUrl: false,
    });
    return { status: "fallback_web", reason: "LIFF_ID_MISSING" };
  }

  // External browser → Web OAuth with bot_prompt (friend-add). Do not open LIFF URL.
  if (!inLineApp) {
    logLiffDebug("fallback_web_login", {
      reason: "EXTERNAL_BROWSER",
      choseLiffUrl: false,
      navigationTarget: "/api/line/login",
    });
    return { status: "fallback_web", reason: "EXTERNAL_BROWSER" };
  }

  const ok = await ensureLiffInitialized();
  if (!ok) {
    logLiffDebug("liff_init_failed", { inLineApp: true });
    return {
      status: "error",
      message: "LINEアプリを開けませんでした",
    };
  }

  try {
    const inClient = liff.isInClient();
    logLiffDebug("liff_ready", {
      inClient,
      loggedIn: liff.isLoggedIn(),
    });

    if (liff.isLoggedIn()) {
      const redirectPath = await exchangeLiffSession(
        resolvePostLoginPath(intent),
      );
      clearLiffLoginIntent();
      try {
        sessionStorage.removeItem(LIFF_LOGIN_ATTEMPT_KEY);
      } catch {
        // ignore
      }
      logLiffDebug("session_issued_in_app", { choseLiffUrl: false });
      return { status: "completed", redirectPath };
    }

    // Not logged in inside LINE — LIFF login only (no bot_prompt authorize URL).
    // Return to Endpoint to exchange tokens without a second tap.
    logLiffDebug("calling_liff_login_in_app", { inClient });
    liff.login({
      redirectUri: `${window.location.origin}/auth/line/liff`,
    });
    return { status: "redirected", destination: "liff_login" };
  } catch (error) {
    console.error("[liff] startLiffLogin failed", error);
    return {
      status: "error",
      message: "LINEアプリを開けませんでした",
    };
  }
}

/**
 * /auth/line/liff endpoint (LIFF Endpoint URL).
 * Used when opened inside LINE via LIFF. Never force withLoginOnExternalBrowser.
 */
export async function completeLiffEndpointFlow(): Promise<StartLiffLoginResult> {
  const liffId = getPublicLiffId();
  logLiffDebug("liff_endpoint_start", {
    liffIdConfigured: Boolean(liffId),
    inLineApp: isLineInAppBrowser(),
  });

  if (!liffId) {
    return { status: "fallback_web", reason: "LIFF_ID_MISSING" };
  }

  // External browser hitting the endpoint → use Web Login (bot_prompt path).
  if (!isLineInAppBrowser()) {
    logLiffDebug("endpoint_external_to_web", {
      reason: "EXTERNAL_BROWSER_ON_ENDPOINT",
      choseLiffUrl: false,
    });
    return { status: "fallback_web", reason: "EXTERNAL_BROWSER_ON_ENDPOINT" };
  }

  initPromise = null;
  const ok = await ensureLiffInitialized();
  if (!ok) {
    return {
      status: "error",
      message: "LINEアプリを開けませんでした",
    };
  }

  try {
    if (liff.isLoggedIn()) {
      try {
        sessionStorage.removeItem(LIFF_LOGIN_ATTEMPT_KEY);
      } catch {
        // ignore
      }

      const intent = readLiffLoginIntent();
      const redirectPath = await exchangeLiffSession(
        resolvePostLoginPath(intent),
      );
      clearLiffLoginIntent();
      logLiffDebug("session_issued_endpoint", { choseLiffUrl: false });
      return { status: "completed", redirectPath };
    }

    let alreadyAttempted = false;
    try {
      alreadyAttempted = sessionStorage.getItem(LIFF_LOGIN_ATTEMPT_KEY) === "1";
    } catch {
      // ignore
    }

    if (alreadyAttempted) {
      logLiffDebug("login_loop_guard", { reason: "LOGIN_ALREADY_ATTEMPTED" });
      return {
        status: "error",
        message: "LINEアプリを開けませんでした",
      };
    }

    try {
      sessionStorage.setItem(LIFF_LOGIN_ATTEMPT_KEY, "1");
    } catch {
      // ignore
    }

    // LIFF in-client login only — do not build access.line.me?bot_prompt=...
    logLiffDebug("calling_liff_login_on_endpoint", {
      inClient: liff.isInClient(),
    });
    liff.login({
      redirectUri: `${window.location.origin}/auth/line/liff`,
    });
    return { status: "redirected", destination: "liff_login" };
  } catch (error) {
    console.error("[liff] complete endpoint flow failed", error);
    return {
      status: "error",
      message: "LINEアプリを開けませんでした",
    };
  }
}

export async function completeLiffLoginAfterRedirect(): Promise<StartLiffLoginResult> {
  return completeLiffEndpointFlow();
}

export function isLiffInClient(): boolean {
  try {
    return Boolean(getPublicLiffId()) && liff.isInClient();
  } catch {
    return false;
  }
}
