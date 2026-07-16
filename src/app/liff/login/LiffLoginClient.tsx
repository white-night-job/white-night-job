"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

declare global {
  interface Window {
    liff?: {
      init: (config: { liffId: string }) => Promise<void>;
      isLoggedIn: () => boolean;
      login: (config?: { redirectUri?: string }) => void;
      getIDToken: () => string | null;
      isInClient: () => boolean;
    };
  }
}

const LIFF_SDK = "https://static.line-scdn.net/liff/edge/2/sdk.js";

function loadLiffSdk(): Promise<void> {
  if (window.liff) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${LIFF_SDK}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("LIFF SDK load failed")));
      return;
    }
    const script = document.createElement("script");
    script.src = LIFF_SDK;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("LIFF SDK load failed"));
    document.head.appendChild(script);
  });
}

/**
 * Optional LIFF login path. Enabled only when NEXT_PUBLIC_LIFF_ID is set.
 * Keeps the existing Web Login Channel callback intact as fallback.
 */
export default function LiffLoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";
  const [message, setMessage] = useState("LINEログインを準備しています…");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const liffId = process.env.NEXT_PUBLIC_LIFF_ID?.trim();
    if (!liffId) {
      window.location.replace(
        `/api/line/login?redirect=${encodeURIComponent(redirect)}`,
      );
      return;
    }

    async function run() {
      try {
        await loadLiffSdk();
        if (!window.liff) throw new Error("LIFF is unavailable");

        await window.liff.init({ liffId: liffId! });

        if (!window.liff.isLoggedIn()) {
          setMessage("LINEアプリでログインします…");
          window.liff.login({
            redirectUri: `${window.location.origin}/liff/login?redirect=${encodeURIComponent(redirect)}`,
          });
          return;
        }

        const idToken = window.liff.getIDToken();
        if (!idToken) {
          throw new Error("ID token missing");
        }

        setMessage("ログインを完了しています…");
        const response = await fetch("/api/line/liff-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ idToken, redirect }),
        });

        if (!response.ok) {
          throw new Error("session create failed");
        }

        const data = (await response.json()) as { redirectPath?: string };
        router.replace(data.redirectPath || redirect || "/");
      } catch (error) {
        console.error("[liff-login]", error);
        setMessage("LINEアプリでのログインに失敗したため、ブラウザログインへ切り替えます…");
        window.location.replace(
          `/api/line/login?redirect=${encodeURIComponent(redirect)}&disable_auto_login=1`,
        );
      }
    }

    void run();
  }, [redirect, router]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center px-6 py-16 text-center">
      <p className="text-sm leading-7 text-charcoal/80">{message}</p>
    </div>
  );
}
