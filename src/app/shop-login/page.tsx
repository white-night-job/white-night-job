"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const inputClass =
  "w-full rounded-xl border border-gold/30 bg-ivory px-4 py-3 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/20";

export default function ShopLoginPage() {
  const router = useRouter();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch("/api/shop-session", { cache: "no-store", credentials: "include" })
      .then((response) => response.json())
      .then((data: { authenticated?: boolean }) => {
        if (data.authenticated) router.replace("/shop-dashboard");
      })
      .finally(() => setChecking(false));
  }, [router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/shop-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ loginId, password }),
      });
      const data = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(data.message ?? "ログインIDまたはパスワードが違います");
      }
      router.replace("/shop-dashboard");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "ログインIDまたはパスワードが違います",
      );
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-md items-center justify-center px-4">
        <div className="h-10 w-10 animate-pulse rounded-full bg-gold/20" />
      </div>
    );
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
            />
          </div>
          {message && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {message}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
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
