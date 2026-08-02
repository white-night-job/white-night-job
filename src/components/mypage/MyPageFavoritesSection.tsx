"use client";

import Link from "next/link";
import { useState } from "react";
import { MyPageFavoriteCard } from "@/components/MyPageFavoriteCard";
import {
  MyPageAccordionSection,
  type MyPageAccordionProps,
} from "@/components/mypage/MyPageAccordionSection";
import { MyPageSectionSkeleton } from "@/components/mypage/MyPageSkeletons";
import { useMyPageSection } from "@/components/mypage/useMyPageSection";
import type { Job } from "@/types/job";

const PREVIEW_COUNT = 3;

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

export function MyPageFavoritesSection({ open, onToggle }: MyPageAccordionProps) {
  const { data, setData, status } = useMyPageSection<FavoritesData>({
    cacheKey: "mypage:favorites",
    url: `/api/favorites?limit=${PREVIEW_COUNT}`,
    parse: parseFavorites,
    fallback: { jobs: [], total: 0 },
  });
  const [sending, setSending] = useState(false);
  const [lineMessage, setLineMessage] = useState("");

  async function sendFavoriteShopsToLine() {
    setSending(true);
    setLineMessage("");
    try {
      const response = await fetch("/api/line/send-favorite-shops", {
        method: "POST",
        credentials: "include",
      });
      const payload = (await response.json()) as { message?: string; count?: number };
      if (!response.ok) {
        throw new Error(payload.message ?? "LINE送信に失敗しました。");
      }
      setLineMessage(
        payload.count && payload.count > 0
          ? `お気に入り店舗${payload.count}件をLINEで送信しました。`
          : "LINEを確認してください。",
      );
    } catch (error) {
      setLineMessage(
        error instanceof Error ? error.message : "LINE送信に失敗しました。",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <MyPageAccordionSection
      title="お気に入り店舗"
      open={open}
      onToggle={onToggle}
      headerAside={
        <>
          <button
            type="button"
            onClick={() => void sendFavoriteShopsToLine()}
            disabled={sending}
            className="rounded-full bg-[#06c755] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
          >
            {sending ? "送信中..." : "LINEで受け取る"}
          </button>
          <Link
            href="/mypage/favorites"
            prefetch
            className="text-xs font-medium text-gold-dark"
          >
            すべて見る
          </Link>
        </>
      }
    >
      {lineMessage && <p className="mb-3 text-xs text-muted">{lineMessage}</p>}

      {status === "loading" && <MyPageSectionSkeleton height="h-36" />}

      {status === "error" && (
        <div className="rounded-2xl border border-gold/20 bg-white p-5 text-sm text-muted">
          お気に入りを読み込めませんでした。時間をおいて再度お試しください。
        </div>
      )}

      {status === "ready" && data.jobs.length === 0 && (
        <div className="rounded-2xl border border-gold/20 bg-white p-5 text-sm text-muted">
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
            <Link
              href="/mypage/favorites"
              prefetch
              className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-gold/40 bg-ivory px-4 text-sm font-semibold text-gold-dark"
            >
              もっと見る（全{data.total}件）
            </Link>
          )}
        </div>
      )}
    </MyPageAccordionSection>
  );
}
