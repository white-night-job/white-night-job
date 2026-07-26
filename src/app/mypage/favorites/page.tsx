"use client";

import Link from "next/link";
import { useState } from "react";
import { LineLoginButton } from "@/components/LineLoginButton";
import { MyPageFavoriteCard } from "@/components/MyPageFavoriteCard";
import { MyPageSectionSkeleton } from "@/components/mypage/MyPageSkeletons";
import { useMyPageSection } from "@/components/mypage/useMyPageSection";
import { useUserSession } from "@/components/UserSessionProvider";
import type { Job } from "@/types/job";

const PAGE_SIZE = 10;

type FavoritesData = {
  jobs: Job[];
  total: number;
};

function parseFavorites(raw: unknown): FavoritesData {
  const payload = (raw ?? {}) as { jobs?: unknown; total?: unknown };
  const jobs = Array.isArray(payload.jobs) ? (payload.jobs as Job[]) : [];
  const total = Number(payload.total);
  return { jobs, total: Number.isFinite(total) ? total : jobs.length };
}

export default function MyPageFavoritesPage() {
  const { isLoggedIn, ready } = useUserSession();
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);
  const { data, setData, status, reload } = useMyPageSection<FavoritesData>({
    cacheKey: "mypage:favorites:list",
    url: `/api/favorites?limit=${PAGE_SIZE}`,
    parse: parseFavorites,
    fallback: { jobs: [], total: 0 },
  });
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");

  async function loadMore() {
    const nextLimit = limit + PAGE_SIZE;
    setLoadingMore(true);
    try {
      await reload(`/api/favorites?limit=${nextLimit}`, { silent: true });
      setLimit(nextLimit);
    } finally {
      setLoadingMore(false);
    }
  }

  async function sendFavoriteShopsToLine() {
    setSending(true);
    setMessage("");
    try {
      const response = await fetch("/api/line/send-favorite-shops", {
        method: "POST",
        credentials: "include",
      });
      const payload = (await response.json()) as { message?: string; count?: number };
      if (!response.ok) {
        throw new Error(payload.message ?? "LINE送信に失敗しました。");
      }
      setMessage(
        payload.count && payload.count > 0
          ? `お気に入り店舗${payload.count}件をLINEで送信しました。`
          : "LINEを確認してください。",
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "LINE送信に失敗しました。");
    } finally {
      setSending(false);
    }
  }

  if (ready && !isLoggedIn) {
    return (
      <div className="mx-auto max-w-md px-4 py-10">
        <div className="rounded-2xl border border-gold/25 bg-white p-6 text-center shadow-gold">
          <h1 className="font-serif text-xl font-semibold text-charcoal">お気に入り</h1>
          <p className="mt-2 text-sm text-muted">
            お気に入り一覧はLINEログイン後にご利用いただけます。
          </p>
          <LineLoginButton
            className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#06c755] px-5 text-sm font-semibold text-white"
            redirectPath="/mypage/favorites"
            action="general"
          >
            LINEでログイン
          </LineLoginButton>
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
          <Link href="/mypage" prefetch className="text-sm font-medium text-gold-dark">
            マイページへ
          </Link>
        </div>
      </div>
      {message && <p className="mb-4 text-sm text-muted">{message}</p>}

      {status === "loading" && <MyPageSectionSkeleton height="h-56" />}

      {status === "error" && (
        <div className="rounded-2xl border border-gold/20 bg-white p-6 text-sm text-muted">
          お気に入りを読み込めませんでした。時間をおいて再度お試しください。
        </div>
      )}

      {status === "ready" && data.jobs.length === 0 && (
        <div className="rounded-2xl border border-gold/20 bg-white p-6 text-sm text-muted">
          まだお気に入り登録された店舗はありません。
        </div>
      )}

      {status === "ready" && data.jobs.length > 0 && (
        <div className="space-y-3">
          {data.jobs.map((job) => (
            <MyPageFavoriteCard
              key={job.id}
              job={job}
              onRemoved={(jobId) =>
                setData((current) => ({
                  jobs: current.jobs.filter((item) => item.id !== jobId),
                  total: Math.max(0, current.total - 1),
                }))
              }
            />
          ))}
          {data.total > data.jobs.length && (
            <button
              type="button"
              onClick={() => void loadMore()}
              disabled={loadingMore}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-gold/40 bg-ivory px-4 text-sm font-semibold text-gold-dark disabled:opacity-60"
            >
              {loadingMore ? "読み込み中..." : `もっと見る（全${data.total}件）`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
