"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { ListingReviewsPanel } from "@/components/admin/ListingReviewsPanel";

export default function AdminListingReviewsPage() {
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/admin/session", { credentials: "include" })
      .then((response) => response.json())
      .then((data: { authenticated?: boolean }) => {
        setAuthenticated(Boolean(data.authenticated));
      })
      .catch(() => setAuthenticated(false))
      .finally(() => setReady(true));
  }, []);

  async function handleLogin(event: React.FormEvent) {
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
      if (!response.ok) throw new Error(data.message ?? "ログインに失敗しました。");
      setAuthenticated(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "ログインに失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  if (!ready) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 text-sm text-muted">
        読み込み中...
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="mx-auto max-w-md px-4 py-12">
        <h1 className="font-serif text-2xl text-charcoal">掲載審査管理</h1>
        <p className="mt-2 text-sm text-muted">管理者ログインが必要です。</p>
        <form onSubmit={handleLogin} className="mt-6 space-y-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-gold/30 bg-ivory px-4 py-3"
            placeholder="管理者パスワード"
          />
          {message && <p className="text-sm text-red-700">{message}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-gradient-to-r from-gold to-gold-dark px-4 py-3 text-sm font-semibold text-white"
          >
            ログイン
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-shell mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <aside className="admin-sidebar" aria-label="管理メニュー">
        <Link href="/admin" className="admin-sidebar-link">
          求人管理
        </Link>
        <Link href="/admin/listing-reviews" className="admin-sidebar-link">
          掲載審査管理
        </Link>
        <Link href="/" className="admin-sidebar-link">
          サイトを見る
        </Link>
      </aside>

      <div className="admin-main">
        <div className="mb-6">
          <h1 className="font-serif text-2xl font-semibold text-charcoal sm:text-3xl">
            掲載審査管理
          </h1>
          <p className="mt-1 text-sm text-muted">
            申請内容の確認、保留、承認・却下を行います。承認時に店舗を登録し掲載開始状態にします。
          </p>
        </div>
        <Suspense
          fallback={
            <p className="rounded-xl border border-gold/20 bg-white px-4 py-6 text-sm text-muted">
              読み込み中...
            </p>
          }
        >
          <ListingReviewsPanel />
        </Suspense>
      </div>
    </div>
  );
}
