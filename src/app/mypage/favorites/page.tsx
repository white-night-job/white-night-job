"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MyPageFavoriteCard } from "@/components/MyPageFavoriteCard";
import { useUserSession } from "@/components/UserSessionProvider";
import type { Job } from "@/types/job";

export default function MyPageFavoritesPage() {
  const { isLoggedIn, ready } = useUserSession();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!ready) return;
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }

    fetch("/api/favorites", { cache: "no-store", credentials: "include" })
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as { jobs?: Job[] };
      })
      .then((data) => {
        if (data?.jobs) setJobs(data.jobs);
      })
      .finally(() => setLoading(false));
  }, [isLoggedIn, ready]);

  async function sendFavoriteShopsToLine() {
    setSending(true);
    setMessage("");
    try {
      const response = await fetch("/api/line/send-favorite-shops", {
        method: "POST",
        credentials: "include",
      });
      const data = (await response.json()) as { message?: string; count?: number };
      if (!response.ok) {
        throw new Error(data.message ?? "LINE送信に失敗しました。");
      }
      setMessage(
        data.count && data.count > 0
          ? `お気に入り店舗${data.count}件をLINEで送信しました。`
          : "LINEを確認してください。",
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "LINE送信に失敗しました。");
    } finally {
      setSending(false);
    }
  }

  if (!ready || loading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8 sm:max-w-2xl sm:px-6">
        <div className="h-56 animate-pulse rounded-2xl border border-gold/15 bg-white" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="mx-auto max-w-md px-4 py-10">
        <div className="rounded-2xl border border-gold/25 bg-white p-6 text-center shadow-gold">
          <h1 className="font-serif text-xl font-semibold text-charcoal">お気に入り</h1>
          <p className="mt-2 text-sm text-muted">
            お気に入り一覧はLINEログイン後にご利用いただけます。
          </p>
          <a
            href="/api/line/login?redirect=/mypage/favorites"
            className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#06c755] px-5 text-sm font-semibold text-white"
          >
            LINEでログイン
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-5 sm:max-w-2xl sm:px-6 sm:py-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-2xl font-semibold text-charcoal">お気に入り</h1>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void sendFavoriteShopsToLine()}
            disabled={sending}
            className="rounded-full bg-[#06c755] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {sending ? "送信中..." : "お気に入り店舗をLINEで受け取る"}
          </button>
          <Link href="/mypage" className="text-sm font-medium text-gold-dark">
            マイページへ
          </Link>
        </div>
      </div>
      {message && <p className="mb-4 text-sm text-muted">{message}</p>}
      {jobs.length === 0 ? (
        <div className="rounded-2xl border border-gold/20 bg-white p-6 text-sm text-muted">
          まだお気に入り登録された店舗はありません。
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <MyPageFavoriteCard
              key={job.id}
              job={job}
              onRemoved={(jobId) =>
                setJobs((current) => current.filter((item) => item.id !== jobId))
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
