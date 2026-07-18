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

const BENEFITS = [
  "お気に入り登録",
  "閲覧履歴",
  "AI相談",
  "ナイトワーク職種診断",
  "新着求人・PickUp店舗情報の受け取り",
] as const;

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
        const nextPath = "/";
        console.info("[friend-required] friend confirmed →", nextPath);
        window.location.replace(nextPath);
        return;
      }

      if (data.expired) {
        setErrorMessage(
          data.message ||
            "ログイン情報の有効期限が切れました。再度ログインしてください。",
        );
        return;
      }

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
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-10 sm:px-5 sm:py-12">
      <div className="rounded-2xl border border-gold/30 bg-white p-5 shadow-gold sm:p-8">
        <p className="text-[11px] font-medium tracking-wide text-gold-dark sm:text-xs">
          LINE公式アカウント {accountId}
        </p>
        <h1 className="mt-3 font-serif text-[1.35rem] font-semibold leading-snug text-charcoal sm:mt-2 sm:text-2xl">
          まずはLINEを友だち追加✨
        </h1>

        <p className="mt-4 text-sm leading-relaxed text-muted sm:text-[0.9375rem]">
          友だち追加すると、以下の機能をご利用いただけます。
        </p>

        <ul className="mt-4 space-y-2.5 rounded-xl border border-gold/15 bg-ivory/60 px-3.5 py-3.5 sm:mt-5 sm:space-y-3 sm:px-4 sm:py-4">
          {BENEFITS.map((item) => (
            <li
              key={item}
              className="flex items-start gap-2 text-sm leading-snug text-charcoal sm:text-[0.9375rem]"
            >
              <span className="mt-0.5 shrink-0 text-gold-dark" aria-hidden>
                ✅
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <p className="mt-4 text-sm leading-relaxed text-muted sm:mt-5 sm:text-[0.9375rem]">
          友だち追加後は、この画面に戻るだけで自動ログインします。
        </p>

        <div className="mt-7 space-y-3 sm:mt-8">
          <a
            href={addFriendUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#06c755] px-5 text-[0.9375rem] font-semibold text-white shadow-md transition hover:brightness-105 sm:min-h-[3.25rem] sm:text-base"
          >
            <LineIcon className="h-5 w-5 shrink-0" />
            LINEを友だち追加する
          </a>

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

        <div className="mt-7 border-t border-gold/15 pt-4 text-center sm:mt-8">
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
