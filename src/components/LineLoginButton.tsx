"use client";

import { useState, type MouseEvent, type ReactNode } from "react";
import { LineIcon } from "@/components/LineIcon";
import {
  buildLiffAppUrl,
  buildWebLineLoginHref,
  getPublicLiffId,
  logLiffDebug,
  saveLiffLoginIntent,
  type LiffLoginIntent,
} from "@/lib/liff-login-intent";

type LineLoginButtonProps = {
  className?: string;
  children?: ReactNode;
  redirectPath?: string;
  action?: LiffLoginIntent["action"];
  favoriteJobId?: string;
  showIcon?: boolean;
};

function LiffErrorPanel({
  redirectPath,
  onRetryLiff,
  onClose,
}: {
  redirectPath: string;
  onRetryLiff: () => void;
  onClose: () => void;
}) {
  const webHref = buildWebLineLoginHref(redirectPath);

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
            onClick={onRetryLiff}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#06c755] px-4 text-sm font-semibold text-white"
          >
            <LineIcon className="h-[1.125rem] w-[1.125rem] shrink-0" />
            もう一度LINEアプリでログイン
          </button>
          <a
            href={webHref}
            onClick={() => {
              logLiffDebug("fallback_web_login", {
                reason: "USER_CHOSE_BROWSER_LOGIN",
                choseLiffUrl: false,
              });
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

async function resolveLiffIdFromRuntime(): Promise<string | null> {
  const fromBuild = getPublicLiffId();
  if (fromBuild) return fromBuild;

  try {
    const response = await fetch("/api/line/liff-config", { cache: "no-store" });
    if (!response.ok) return null;
    const data = (await response.json()) as { liffId?: string | null };
    return data.liffId?.trim() || null;
  } catch {
    return null;
  }
}

/**
 * LINE login CTA. When LIFF is configured, navigates to https://liff.line.me/{id}
 * immediately — never to /api/line/login or access.line.me first.
 */
export function LineLoginButton({
  className,
  children,
  redirectPath,
  action,
  favoriteJobId,
  showIcon = false,
}: LineLoginButtonProps) {
  const [busy, setBusy] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);

  const resolvedRedirect =
    redirectPath ||
    (typeof window !== "undefined"
      ? `${window.location.pathname}${window.location.search}${window.location.hash}`
      : "/");

  const buildTimeLiffId = getPublicLiffId();
  const primaryHref = buildTimeLiffId
    ? buildLiffAppUrl(buildTimeLiffId, {
        redirectPath: resolvedRedirect,
        action,
        favoriteJobId,
      })
    : buildWebLineLoginHref(resolvedRedirect);

  function openLiff(liffId: string) {
    const intent = saveLiffLoginIntent({
      redirectPath: resolvedRedirect,
      action,
      favoriteJobId,
    });
    const liffUrl = buildLiffAppUrl(liffId, intent);
    logLiffDebug("login_button_navigate", {
      liffIdConfigured: true,
      choseLiffUrl: true,
      destinationHost: "liff.line.me",
      navigationTarget: liffUrl.split("?")[0],
    });
    window.location.assign(liffUrl);
  }

  async function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setErrorOpen(false);

    try {
      const liffId = await resolveLiffIdFromRuntime();
      logLiffDebug("login_button_tap", {
        liffIdConfigured: Boolean(liffId),
        buildTimeConfigured: Boolean(buildTimeLiffId),
      });

      if (liffId) {
        openLiff(liffId);
        return;
      }

      logLiffDebug("fallback_web_login", {
        reason: "LIFF_ID_MISSING",
        choseLiffUrl: false,
        navigationTarget: "/api/line/login",
      });
      window.location.assign(buildWebLineLoginHref(resolvedRedirect));
    } catch (error) {
      console.error("[LineLoginButton]", error);
      setErrorOpen(true);
    } finally {
      setBusy(false);
    }
  }

  async function handleRetryLiff() {
    setErrorOpen(false);
    setBusy(true);
    try {
      const liffId = await resolveLiffIdFromRuntime();
      if (liffId) {
        openLiff(liffId);
        return;
      }
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
          onRetryLiff={() => void handleRetryLiff()}
          onClose={() => setErrorOpen(false)}
        />
      ) : null}
    </>
  );
}
