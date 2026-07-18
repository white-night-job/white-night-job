"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LineIcon } from "@/components/LineIcon";

type FriendRequiredClientProps = {
  addFriendUrl: string;
  accountId: string;
};

type CheckResult = {
  ok?: boolean;
  isFriend?: boolean;
  redirectPath?: string;
  message?: string;
  expired?: boolean;
};

export function FriendRequiredClient({
  addFriendUrl,
  accountId,
}: FriendRequiredClientProps) {
  const [checking, setChecking] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const checkingRef = useRef(false);
  const doneRef = useRef(false);

  const confirmFriendship = useCallback(async (reason: string) => {
    if (doneRef.current || checkingRef.current) return;
    if (
      typeof document !== "undefined" &&
      document.visibilityState === "hidden"
    ) {
      return;
    }

    checkingRef.current = true;
    setChecking(true);
    setErrorMessage("");
    console.info("[friend-required] check start", reason);

    try {
      const response = await fetch("/api/line/friendship-confirm", {
        method: "POST",
        credentials: "include",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      const data = (await response.json()) as CheckResult;

      if (data.ok && data.isFriend) {
        doneRef.current = true;
        // Spec: complete login and go to top page.
        const nextPath = "/";
        console.info("[friend-required] friend confirmed →", nextPath);
        window.location.replace(nextPath);
        return;
      }

      if (data.expired) {
        setErrorMessage(
          data.message || "ログイン情報の有効期限が切れました。再度ログインしてください。",
        );
        return;
      }

      // Not followed yet — keep this screen, no error spam on every return.
      setErrorMessage("");
      console.info("[friend-required] not a friend yet", reason);
    } catch (error) {
      console.error("[friend-required] check failed", error);
      setErrorMessage(
        "確認に失敗しました。通信環境をご確認のうえ、この画面に戻ると再試行します。",
      );
    } finally {
      checkingRef.current = false;
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    function onFocus() {
      void confirmFriendship("window.focus");
    }

    function onVisibilityChange() {
      if (document.visibilityState === "visible") {
        void confirmFriendship("visibilitychange:visible");
      }
    }

    function onPageShow() {
      void confirmFriendship("pageshow");
    }

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pageshow", onPageShow);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [confirmFriendship]);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-5 py-12">
      <div className="rounded-2xl border border-gold/30 bg-white p-6 shadow-gold sm:p-8">
        <p className="text-xs font-medium tracking-wide text-gold-dark">
          LINE公式アカウント
        </p>
        <h1 className="mt-2 font-serif text-xl font-semibold leading-snug text-charcoal sm:text-2xl">
          友だち追加が必要です
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          AI相談や求人情報を受け取るため、LINE公式アカウントを友だち追加してください。
        </p>
        <p className="mt-2 text-xs text-muted">公式アカウント：{accountId}</p>

        <div className="mt-8 space-y-3">
          <a
            href={addFriendUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#06c755] px-5 text-sm font-semibold text-white shadow-md transition hover:brightness-105"
          >
            <LineIcon className="h-5 w-5 shrink-0" />
            友だち追加する
          </a>

          <p className="text-center text-xs leading-relaxed text-muted sm:text-sm">
            友だち追加後、この画面に戻ると自動でログインします
          </p>

          {checking ? (
            <p
              className="rounded-xl border border-gold/25 bg-ivory/80 px-3 py-2.5 text-center text-sm font-medium text-gold-dark"
              aria-live="polite"
            >
              友だち追加を確認しています…
            </p>
          ) : null}
        </div>

        {errorMessage ? (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </p>
        ) : null}

        <div className="mt-8 border-t border-gold/15 pt-4 text-center">
          <Link
            href="/api/line/login?redirect=%2F"
            className="text-sm font-medium text-gold-dark underline-offset-2 hover:underline"
          >
            はじめからログインし直す
          </Link>
        </div>
      </div>
    </div>
  );
}
