"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LineIcon } from "@/components/LineIcon";
import {
  completeLiffLoginAfterRedirect,
  startLiffLogin,
} from "@/lib/liff-auth-client";
import {
  buildWebLineLoginHref,
  getPublicLiffId,
  readLiffLoginIntent,
  resolvePostLoginPath,
  saveLiffLoginIntent,
} from "@/lib/liff-login-intent";

/**
 * LIFF Endpoint / redirectUri completion page.
 * Completes session after liff.login() return. Does not auto-start login
 * without a prior user tap (shows recovery actions instead).
 */
export default function LiffAuthClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const started = useRef(false);
  const [status, setStatus] = useState<"working" | "error">("working");
  const [message, setMessage] = useState("ログインを完了しています…");
  const [fallbackHref, setFallbackHref] = useState("/api/line/login?redirect=%2F");

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const queryRedirect = searchParams.get("redirect");
    if (queryRedirect?.startsWith("/") && !queryRedirect.startsWith("//")) {
      saveLiffLoginIntent({ redirectPath: queryRedirect });
    }

    const intent = readLiffLoginIntent();
    const redirectPath = resolvePostLoginPath(intent);
    setFallbackHref(buildWebLineLoginHref(redirectPath));

    const liffId = getPublicLiffId();
    if (!liffId) {
      window.location.replace(buildWebLineLoginHref(redirectPath));
      return;
    }

    async function run() {
      try {
        const result = await completeLiffLoginAfterRedirect();
        if (result.status === "completed") {
          router.replace(result.redirectPath);
          return;
        }
        if (result.status === "fallback_web") {
          window.location.replace(buildWebLineLoginHref(redirectPath));
          return;
        }
        if (result.status === "redirected") {
          setMessage("LINEで認証しています…");
          return;
        }
        setStatus("error");
        setMessage(result.message || "LINEアプリを開けませんでした");
      } catch (error) {
        console.error("[auth/line/liff]", error);
        setStatus("error");
        setMessage("LINEアプリを開けませんでした");
      }
    }

    void run();
  }, [router, searchParams]);

  async function handleRetry() {
    const intent = readLiffLoginIntent();
    const redirectPath = resolvePostLoginPath(intent);
    setStatus("working");
    setMessage("LINEアプリを起動しています…");
    const result = await startLiffLogin({
      redirectPath,
      action: intent?.action,
      favoriteJobId: intent?.favoriteJobId,
    });
    if (result.status === "completed") {
      router.replace(result.redirectPath);
      return;
    }
    if (result.status === "redirected") return;
    if (result.status === "fallback_web") {
      window.location.assign(buildWebLineLoginHref(redirectPath));
      return;
    }
    setStatus("error");
    setMessage(result.message);
  }

  if (status === "error") {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-sm flex-col items-center justify-center px-6 py-16 text-center">
        <h1 className="font-serif text-lg font-semibold text-charcoal">
          LINEアプリを開けませんでした
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">{message}</p>
        <div className="mt-6 flex w-full flex-col gap-2">
          <button
            type="button"
            onClick={() => void handleRetry()}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#06c755] px-4 text-sm font-semibold text-white"
          >
            <LineIcon className="h-[1.125rem] w-[1.125rem] shrink-0" />
            もう一度LINEアプリでログイン
          </button>
          <a
            href={fallbackHref}
            className="flex min-h-11 w-full items-center justify-center rounded-full border border-gold/35 bg-white px-4 text-sm font-medium text-gold-dark"
          >
            ブラウザでログイン
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[50vh] items-center justify-center px-6 py-16 text-center">
      <p className="text-sm leading-7 text-charcoal/80">{message}</p>
    </div>
  );
}
