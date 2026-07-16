"use client";

import liff from "@line/liff";
import {
  buildLiffAppUrl,
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

export async function ensureLiffInitialized(
  options?: { withLoginOnExternalBrowser?: boolean },
): Promise<boolean> {
  const liffId = getPublicLiffId();
  if (!liffId) return false;

  if (!initPromise) {
    initPromise = liff
      .init({
        liffId,
        withLoginOnExternalBrowser: options?.withLoginOnExternalBrowser === true,
      })
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
  | { status: "redirected"; destination: "liff_url" | "liff_login" }
  | { status: "completed"; redirectPath: string }
  | { status: "fallback_web"; reason: string }
  | { status: "error"; message: string };

/**
 * Must be called from a user tap on the site (not on the LIFF endpoint).
 * When LIFF ID is set: ALWAYS open https://liff.line.me/{id} — never access.line.me first.
 */
export async function startLiffLogin(input: {
  redirectPath?: string;
  action?: LiffLoginIntent["action"];
  favoriteJobId?: string;
}): Promise<StartLiffLoginResult> {
  const intent = saveLiffLoginIntent(input);
  const liffId = getPublicLiffId();

  logLiffDebug("login_button_tap", {
    liffIdConfigured: Boolean(liffId),
    liffIdLength: liffId ? String(liffId.length) : "0",
  });

  if (!liffId) {
    logLiffDebug("fallback_web_login", {
      reason: "LIFF_ID_MISSING",
      choseLiffUrl: false,
    });
    return { status: "fallback_web", reason: "LIFF_ID_MISSING" };
  }

  const liffUrl = buildLiffAppUrl(liffId, intent);
  logLiffDebug("chose_liff_url", {
    choseLiffUrl: true,
    destinationHost: "liff.line.me",
    navigationTarget: "liff_app_url",
  });

  // Immediate navigation — do not call liff.login() here (that hits access.line.me).
  window.location.assign(liffUrl);
  return { status: "redirected", destination: "liff_url" };
}

/**
 * Runs on /auth/line/liff (LIFF Endpoint).
 * init with withLoginOnExternalBrowser, then session or liff.login().
 */
export async function completeLiffEndpointFlow(): Promise<StartLiffLoginResult> {
  const liffId = getPublicLiffId();
  logLiffDebug("liff_endpoint_start", {
    liffIdConfigured: Boolean(liffId),
    liffIdLength: liffId ? String(liffId.length) : "0",
  });

  if (!liffId) {
    logLiffDebug("fallback_web_login", {
      reason: "LIFF_ID_MISSING_ON_ENDPOINT",
      choseLiffUrl: false,
    });
    return { status: "fallback_web", reason: "LIFF_ID_MISSING" };
  }

  // Reset cached init so withLoginOnExternalBrowser is applied on this page.
  initPromise = null;
  const ok = await ensureLiffInitialized({ withLoginOnExternalBrowser: true });
  if (!ok) {
    logLiffDebug("liff_init_failed", { choseLiffUrl: false });
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
      logLiffDebug("session_issued", { choseLiffUrl: true });
      return { status: "completed", redirectPath };
    }

    // Prevent login loops: only call liff.login() once per attempt.
    let alreadyAttempted = false;
    try {
      alreadyAttempted = sessionStorage.getItem(LIFF_LOGIN_ATTEMPT_KEY) === "1";
    } catch {
      // ignore
    }

    if (alreadyAttempted) {
      logLiffDebug("login_loop_guard", {
        choseLiffUrl: false,
        reason: "LOGIN_ALREADY_ATTEMPTED",
      });
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

    logLiffDebug("calling_liff_login_on_endpoint", {
      inClient: liff.isInClient(),
    });
    liff.login({ redirectUri: `${window.location.origin}/auth/line/liff` });
    return { status: "redirected", destination: "liff_login" };
  } catch (error) {
    console.error("[liff] complete endpoint flow failed", error);
    return {
      status: "error",
      message: "LINEアプリを開けませんでした",
    };
  }
}

/** @deprecated Use completeLiffEndpointFlow */
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
