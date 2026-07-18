"use client";

import { useState, type MouseEvent, type ReactNode } from "react";
import { LineIcon } from "@/components/LineIcon";
import {
  isLineInAppBrowser,
  startLiffLogin,
  type StartLiffLoginResult,
} from "@/lib/liff-auth-client";
import {
  buildWebLineLoginHref,
  getPublicLiffId,
  logLiffDebug,
  navigateToWebLineOAuth,
  type LiffLoginIntent,
} from "@/lib/liff-login-intent";

type LineLoginButtonProps = {
  className?: string;
  children?: ReactNode;
  redirectPath?: string;
  action?: LiffLoginIntent["action"];
  favoriteJobId?: string;
  showIcon?: boolean;
  /**
   * Header login: in Safari/Chrome always use Web OAuth
   * (/api/line/login → buildLineLoginUrl with bot_prompt=aggressive).
   * LIFF is only used inside the LINE app.
   */
  preferWebOAuthOutsideLine?: boolean;
};

function LiffErrorPanel({
  redirectPath,
  onRetry,
  onClose,
}: {
  redirectPath: string;
  onRetry: () => void;
  onClose: () => void;
}) {
  const webHref = buildWebLineLoginHref(redirectPath, { disableAutoLogin: true });

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-gold/30 bg-white p-5 shadow-2xl">
        <h2 className="font-serif text-lg font-semibold text-charcoal">
          LINEアプリを開けませんでした
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          通信状況やLINEアプリの状態をご確認のうえ、もう一度お試しください。
        </p>
        <div className="mt-5 space-y-2">
          <button
            type="button"
            onClick={onRetry}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#06c755] px-4 text-sm font-semibold text-white"
          >
            <LineIcon className="h-[1.125rem] w-[1.125rem] shrink-0" />
            もう一度LINEアプリでログイン
          </button>
          <a
            href={webHref}
            onClick={(event) => {
              event.preventDefault();
              logLiffDebug("fallback_web_login", {
                reason: "USER_CHOSE_BROWSER_LOGIN",
                choseLiffUrl: false,
              });
              void navigateToWebLineOAuth(redirectPath, { disableAutoLogin: true });
            }}
            className="flex min-h-11 w-full items-center justify-center rounded-full border border-gold/35 bg-white px-4 text-sm font-medium text-gold-dark"
          >
            ブラウザでログイン
          </a>
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-11 w-full items-center justify-center rounded-full px-4 text-sm text-muted"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * LINE login CTA.
 * - LINE app: LIFF
 * - Safari / Chrome: /api/line/login → buildLineLoginUrl (bot_prompt=aggressive)
 */
export function LineLoginButton({
  className,
  children,
  redirectPath,
  action,
  favoriteJobId,
  showIcon = false,
  preferWebOAuthOutsideLine = false,
}: LineLoginButtonProps) {
  const [busy, setBusy] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);

  const resolvedRedirect =
    redirectPath ||
    (typeof window !== "undefined"
      ? `${window.location.pathname}${window.location.search}${window.location.hash}`
      : "/");

  // href fallback (no-JS / middle-click): server 303 includes bot_prompt=aggressive
  const webHref = buildWebLineLoginHref(resolvedRedirect);
  const primaryHref = webHref;

  async function goWebOAuth(reason: string) {
    logLiffDebug("header_or_web_oauth", {
      reason,
      choseLiffUrl: false,
      navigationTarget: "/api/line/login",
      liffIdConfigured: Boolean(getPublicLiffId()),
      action: action ?? null,
    });
    console.info("[header-line-login] starting Web OAuth via buildLineLoginUrl", {
      reason,
      redirect: resolvedRedirect,
    });
    await navigateToWebLineOAuth(resolvedRedirect);
  }

  async function handleResult(result: StartLiffLoginResult) {
    if (result.status === "completed") {
      window.location.assign(result.redirectPath);
      return;
    }
    if (result.status === "redirected") {
      return;
    }
    if (result.status === "fallback_web") {
      await goWebOAuth(result.reason);
      return;
    }
    setErrorOpen(true);
  }

  async function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setErrorOpen(false);

    try {
      // Header login on Safari: skip LIFF, use OAuth with bot_prompt=aggressive only.
      if (preferWebOAuthOutsideLine && !isLineInAppBrowser()) {
        await goWebOAuth("HEADER_SAFARI_WEB_OAUTH");
        return;
      }

      const result = await startLiffLogin({
        redirectPath: resolvedRedirect,
        action,
        favoriteJobId,
      });
      await handleResult(result);
    } catch (error) {
      console.error("[LineLoginButton]", error);
      setErrorOpen(true);
    } finally {
      setBusy(false);
    }
  }

  async function handleRetry() {
    setErrorOpen(false);
    setBusy(true);
    try {
      if (preferWebOAuthOutsideLine && !isLineInAppBrowser()) {
        await goWebOAuth("HEADER_SAFARI_WEB_OAUTH_RETRY");
        return;
      }
      const result = await startLiffLogin({
        redirectPath: resolvedRedirect,
        action,
        favoriteJobId,
      });
      await handleResult(result);
    } catch {
      setErrorOpen(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <a
        href={primaryHref}
        className={className}
        onClick={handleClick}
        aria-busy={busy}
      >
        {showIcon ? (
          <LineIcon className="h-[1.125rem] w-[1.125rem] shrink-0" />
        ) : null}
        {children}
      </a>
      {errorOpen ? (
        <LiffErrorPanel
          redirectPath={resolvedRedirect}
          onRetry={() => void handleRetry()}
          onClose={() => setErrorOpen(false)}
        />
      ) : null}
    </>
  );
}
