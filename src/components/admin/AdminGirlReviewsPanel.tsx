"use client";

import { useCallback, useEffect, useState } from "react";
import {
  GIRL_REVIEW_CATEGORY_LABELS,
  type AdminGirlReview,
} from "@/types/girl-review";
import { formatStarRating } from "@/lib/girl-reviews";

function formatDateTime(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function AdminGirlReviewsPanel() {
  const [reviews, setReviews] = useState<AdminGirlReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [draftRatings, setDraftRatings] = useState<Record<string, number>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/girl-reviews?limit=150", {
        cache: "no-store",
        credentials: "include",
      });
      const data = (await res.json()) as {
        reviews?: AdminGirlReview[];
        message?: string;
      };
      if (!res.ok) throw new Error(data.message ?? "取得に失敗しました。");
      const list = data.reviews ?? [];
      setReviews(list);
      setDraftRatings(
        Object.fromEntries(list.map((r) => [r.id, r.rating])),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveRating(review: AdminGirlReview) {
    const rating = draftRatings[review.id] ?? review.rating;
    if (rating === review.rating) {
      setMessage("変更はありません。");
      return;
    }
    setBusyId(review.id);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/girl-reviews/${review.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating }),
      });
      const data = (await res.json()) as {
        review?: AdminGirlReview;
        message?: string;
      };
      if (!res.ok) throw new Error(data.message ?? "更新に失敗しました。");
      setMessage("公開評価を更新しました。");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新に失敗しました。");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <p className="admin-muted text-sm">
        星評価は投稿時にAIが自動判定します。店舗・投稿者は変更できません。運営のみ手動修正できます。AI判定理由もここで確認できます。
      </p>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-xl border border-gold/30 bg-ivory px-3 py-2 text-sm text-charcoal">
          {message}
        </p>
      ) : null}

      {loading ? (
        <p className="admin-muted">読み込み中...</p>
      ) : reviews.length === 0 ? (
        <p className="admin-muted">口コミはまだありません。</p>
      ) : (
        <ul className="space-y-3">
          {reviews.map((review) => {
            const draft = draftRatings[review.id] ?? review.rating;
            const overridden =
              review.aiRating != null && review.aiRating !== review.rating;
            return (
              <li
                key={review.id}
                className="rounded-2xl border border-gold/25 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-charcoal">
                      {review.jobShopName || "（店舗名なし）"}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      【{GIRL_REVIEW_CATEGORY_LABELS[review.category]}】
                      {" · "}
                      {review.nickname}（{review.age}歳）
                      {" · "}
                      {formatDateTime(review.createdAt)}
                    </p>
                  </div>
                  <p className="text-sm text-gold-dark">
                    公開: {formatStarRating(review.rating)}
                    {overridden ? (
                      <span className="ml-2 text-xs text-muted">（手動修正済）</span>
                    ) : null}
                  </p>
                </div>

                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-charcoal">
                  {review.comment}
                </p>

                <div className="mt-3 rounded-xl bg-ivory/70 px-3 py-2 text-sm">
                  <p className="text-xs font-medium text-muted">AI判定</p>
                  <p className="mt-1 text-charcoal">
                    {review.aiRating != null
                      ? formatStarRating(review.aiRating)
                      : "—"}
                    {review.aiRatingReason ? (
                      <span className="mt-1 block text-muted">
                        {review.aiRatingReason}
                      </span>
                    ) : (
                      <span className="mt-1 block text-muted">
                        判定理由なし（移行データなど）
                      </span>
                    )}
                  </p>
                </div>

                <div className="mt-3 flex flex-wrap items-end gap-3">
                  <label className="block text-sm">
                    <span className="mb-1 block text-xs text-muted">
                      公開評価を手動修正
                    </span>
                    <select
                      className="rounded-lg border border-gold/30 bg-white px-3 py-2 text-sm"
                      value={draft}
                      disabled={busyId === review.id}
                      onChange={(e) =>
                        setDraftRatings((current) => ({
                          ...current,
                          [review.id]: Number(e.target.value),
                        }))
                      }
                    >
                      {[5, 4, 3, 2, 1].map((value) => (
                        <option key={value} value={value}>
                          {formatStarRating(value)}（{value}）
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    disabled={busyId === review.id || draft === review.rating}
                    onClick={() => void saveRating(review)}
                    className="rounded-full bg-gradient-to-r from-gold to-gold-dark px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {busyId === review.id ? "保存中…" : "評価を保存"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
