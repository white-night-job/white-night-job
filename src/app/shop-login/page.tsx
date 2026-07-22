"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const inputClass =
  "w-full rounded-xl border border-gold/30 bg-ivory px-4 py-3 text-base outline-none focus:border-gold focus:ring-2 focus:ring-gold/20";

const SHOP_BOOTSTRAP_KEY = "wnj-shop-bootstrap";

export default function ShopLoginPage() {
  const router = useRouter();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    console.time("shop-login:form-paint");
    requestAnimationFrame(() => {
      console.timeEnd("shop-login:form-paint");
    });

    // Background session check — never block the login form.
    void fetch("/api/shop-session", { cache: "no-store", credentials: "include" })
      .then((response) => response.json())
      .then((data: {
        authenticated?: boolean;
        jobId?: string;
        shopName?: string;
        published?: boolean;
        plan?: string | null;
      }) => {
        if (!data.authenticated) return;
        if (data.jobId && data.shopName) {
          try {
            sessionStorage.setItem(
              SHOP_BOOTSTRAP_KEY,
              JSON.stringify({
                jobId: data.jobId,
                shopName: data.shopName,
                published: data.published,
                plan: data.plan,
                at: Date.now(),
              }),
            );
          } catch {
            // ignore
          }
        }
        setRedirecting(true);
        router.replace("/shop-dashboard");
      })
      .catch(() => {
        // stay on login form
      });
  }, [router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    console.time("shop-login:button-to-auth");

    try {
      const response = await fetch("/api/shop-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ loginId, password }),
      });
      const data = (await response.json()) as {
        message?: string;
        jobId?: string;
        shopName?: string;
        published?: boolean;
        plan?: string | null;
        timings?: { authMs?: number };
      };
      console.timeEnd("shop-login:button-to-auth");
      if (data.timings?.authMs != null) {
        console.info("[shop-login] server authMs", data.timings.authMs);
      }
      if (!response.ok) {
        throw new Error(data.message ?? "ログインIDまたはパスワードが違います");
      }

      try {
        sessionStorage.setItem(
          SHOP_BOOTSTRAP_KEY,
          JSON.stringify({
            jobId: data.jobId,
            shopName: data.shopName,
            published: data.published,
            plan: data.plan,
            at: Date.now(),
          }),
        );
      } catch {
        // ignore
      }

      console.time("shop-login:auth-to-dashboard-nav");
      router.replace("/shop-dashboard");
      console.timeEnd("shop-login:auth-to-dashboard-nav");
    } catch (error) {
      console.timeEnd("shop-login:button-to-auth");
      setMessage(
        error instanceof Error
          ? error.message
          : "ログインIDまたはパスワードが違います",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-2xl border border-gold/25 bg-white p-6 shadow-gold sm:p-8">
        <h1 className="font-serif text-2xl font-semibold text-charcoal">
          店舗ログイン
        </h1>
        <p className="mt-2 text-sm text-muted">
          掲載店舗担当者向けの管理画面です。
        </p>
        {redirecting && (
          <p className="mt-3 text-xs text-gold-dark">ログイン済みのため移動中…</p>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="loginId" className="mb-1.5 block text-sm font-medium">
              ログインID
            </label>
            <input
              id="loginId"
              type="text"
              autoComplete="username"
              value={loginId}
              onChange={(event) => setLoginId(event.target.value)}
              className={inputClass}
              required
              disabled={redirecting}
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
              ログインPW
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={inputClass}
              required
              disabled={redirecting}
            />
          </div>
          {message && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {message}
            </p>
          )}
          <button
            type="submit"
            disabled={loading || redirecting}
            className="w-full rounded-full bg-gradient-to-r from-gold to-gold-dark px-6 py-3 text-sm font-semibold text-white shadow-gold disabled:opacity-60"
          >
            {loading ? "ログイン中..." : "ログイン"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-muted">
          <Link href="/" className="text-gold-dark hover:underline">
            トップページへ戻る
          </Link>
        </p>
      </div>
    </div>
  );
}
