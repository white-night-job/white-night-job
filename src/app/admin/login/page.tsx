"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { SESSION_EXPIRED_MESSAGE } from "@/lib/auth-session-messages";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get("expired") === "1") {
      setMessage(SESSION_EXPIRED_MESSAGE);
    }
  }, [searchParams]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password }),
      });
      const data = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(data.message ?? "ログインに失敗しました。");
      }
      const next = searchParams.get("next");
      const safeNext =
        next && next.startsWith("/admin") && !next.startsWith("/admin/login")
          ? next
          : "/admin";
      router.replace(safeNext);
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "ログインに失敗しました。",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-login-wrap">
      <form onSubmit={handleSubmit} className="admin-login-card space-y-4">
        <div>
          <h1>管理者ログイン</h1>
          <p>管理画面専用のログインです。一般ユーザー用ログインとは別です。</p>
        </div>
        {message ? <p className="text-sm text-red-700">{message}</p> : null}
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-black/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#b8955a]"
          placeholder="管理者パスワード"
          required
          autoComplete="current-password"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[#8f7344] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? "確認中..." : "ログイン"}
        </button>
      </form>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="admin-login-wrap">
          <p className="admin-muted">読み込み中...</p>
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
