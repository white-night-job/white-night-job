"use client";

import liff from "@line/liff";
import {
  clearLiffLoginIntent,
  getLiffRedirectUri,
  getPublicLiffId,
  readLiffLoginIntent,
  resolvePostLoginPath,
  saveLiffLoginIntent,
  type LiffLoginIntent,
} from "@/lib/liff-login-intent";

let initPromise: Promise<boolean> | null = null;

export async function ensureLiffInitialized(): Promise<boolean> {
  const liffId = getPublicLiffId();
  if (!liffId) return false;

  if (!initPromise) {
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
  | { status: "redirected" }
  | { status: "completed"; redirectPath: string }
  | { status: "fallback_web"; reason: string }
  | { status: "error"; message: string };

/**
 * Must be called from a user tap.
 * - LIFF available + logged in → create session, return completed
 * - LIFF available + not logged in → liff.login (may leave the page)
 * - LIFF unavailable → fallback_web
 */
export async function startLiffLogin(input: {
  redirectPath?: string;
  action?: LiffLoginIntent["action"];
  favoriteJobId?: string;
}): Promise<StartLiffLoginResult> {
  const intent = saveLiffLoginIntent(input);
  const liffId = getPublicLiffId();

  if (!liffId) {
    return { status: "fallback_web", reason: "LIFF_ID_MISSING" };
  }

  const ok = await ensureLiffInitialized();
  if (!ok) {
    return {
      status: "error",
      message: "LINEアプリを開けませんでした",
    };
  }

  try {
    if (!liff.isLoggedIn()) {
      if (liff.isInClient()) {
        // LIFF browser: login without leaving to a custom redirect when possible.
        liff.login();
      } else {
        // External browser (Safari/Chrome): return to our completion page.
        liff.login({ redirectUri: getLiffRedirectUri() });
      }
      return { status: "redirected" };
    }

    // Re-init after login is recommended by LINE when returning to the app.
    await liff.init({ liffId });

    const redirectPath = await exchangeLiffSession(
      resolvePostLoginPath(intent),
    );
    clearLiffLoginIntent();
    return { status: "completed", redirectPath };
  } catch (error) {
    console.error("[liff] startLiffLogin failed", error);
    return {
      status: "error",
      message: "LINEアプリを開けませんでした",
    };
  }
}

export async function completeLiffLoginAfterRedirect(): Promise<StartLiffLoginResult> {
  const liffId = getPublicLiffId();
  if (!liffId) {
    return { status: "fallback_web", reason: "LIFF_ID_MISSING" };
  }

  const ok = await ensureLiffInitialized();
  if (!ok) {
    return {
      status: "error",
      message: "LINEアプリを開けませんでした",
    };
  }

  try {
    if (!liff.isLoggedIn()) {
      // Avoid auto-login loops on the completion page. User can retry via UI.
      return {
        status: "error",
        message: "LINEアプリを開けませんでした",
      };
    }

    // Re-init after login return (LINE recommendation).
    await liff.init({ liffId });

    const intent = readLiffLoginIntent();
    const redirectPath = await exchangeLiffSession(
      resolvePostLoginPath(intent),
    );
    clearLiffLoginIntent();
    return { status: "completed", redirectPath };
  } catch (error) {
    console.error("[liff] complete after redirect failed", error);
    return {
      status: "error",
      message: "LINEアプリを開けませんでした",
    };
  }
}

export function isLiffInClient(): boolean {
  try {
    return Boolean(getPublicLiffId()) && liff.isInClient();
  } catch {
    return false;
  }
}
