"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  GIRL_REVIEW_CATEGORY_LABELS,
  type GirlReview,
  type GirlReviewCategory,
  type GirlReviewContentInput,
} from "@/types/girl-review";
import { formatStarRating } from "@/lib/girl-reviews";

const emptyForm = (): GirlReviewContentInput => ({
  category: "interview",
  nickname: "",
  age: 20,
  comment: "",
});

type ShopGirlReviewsManagerProps = {
  labelClass: string;
  inputClass: string;
};

export function ShopGirlReviewsManager({
  labelClass,
  inputClass,
}: ShopGirlReviewsManagerProps) {
  const [reviews, setReviews] = useState<GirlReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/shop-dashboard/girl-reviews", {
        cache: "no-store",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "口コミの取得に失敗しました。");
      }
      setReviews(Array.isArray(data.reviews) ? data.reviews : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "口コミの取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const sorted = useMemo(
    () =>
      [...reviews].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [reviews],
  );

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm());
    setMessage("");
    setError("");
  }

  function startEdit(review: GirlReview) {
    setEditingId(review.id);
    setForm({
      category: review.category,
      nickname: review.nickname,
      age: review.age,
      comment: review.comment,
    });
    setMessage("");
    setError("");
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const url = editingId
        ? `/api/shop-dashboard/girl-reviews/${editingId}`
        : "/api/shop-dashboard/girl-reviews";
      const response = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "保存に失敗しました。");
      }
      setMessage(
        editingId
          ? "口コミを更新しました。本文を変更した場合は星評価を再判定しています。"
          : "口コミを公開しました。星評価はAIが自動判定しています。",
      );
      startCreate();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("この口コミを削除しますか？")) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/shop-dashboard/girl-reviews/${id}`, {
        method: "DELETE",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "削除に失敗しました。");
      }
      if (editingId === id) startCreate();
      setMessage("口コミを削除しました。");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "削除に失敗しました。");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-gold/25 bg-white shadow-gold">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition hover:bg-ivory/60 sm:px-5"
        aria-expanded={open}
      >
        <h2 className="min-w-0 font-serif text-base font-semibold text-charcoal sm:text-lg">
          女の子の口コミ管理
        </h2>
        <span className="shrink-0 text-sm text-gold-dark" aria-hidden="true">
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <div className="space-y-5 border-t border-gold/15 px-4 py-4 sm:px-5 sm:py-5">
          <p className="text-sm leading-relaxed text-muted">
            求人詳細の「女の子の口コミ」に即時公開されます。ニックネーム・年齢・口コミ内容を登録してください。星評価はAIが自動判定し、店舗側では変更できません。
          </p>

          <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-gold/20 bg-ivory/60 p-4">
            <p className="text-sm font-semibold text-charcoal">
              {editingId ? "口コミを編集" : "口コミを追加"}
            </p>

            <label className="block">
              <span className={labelClass}>口コミ区分</span>
              <select
                value={form.category}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    category: event.target.value as GirlReviewCategory,
                  }))
                }
                className={inputClass}
              >
                <option value="interview">
                  {GIRL_REVIEW_CATEGORY_LABELS.interview}
                </option>
                <option value="cast">{GIRL_REVIEW_CATEGORY_LABELS.cast}</option>
              </select>
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className={labelClass}>ニックネーム</span>
                <input
                  value={form.nickname}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      nickname: event.target.value,
                    }))
                  }
                  className={inputClass}
                  placeholder="例：みか"
                  required
                />
              </label>
              <label className="block">
                <span className={labelClass}>年齢（18歳以上）</span>
                <input
                  type="number"
                  min={18}
                  max={80}
                  value={form.age}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      age: Number(event.target.value),
                    }))
                  }
                  className={inputClass}
                  required
                />
              </label>
            </div>

            <label className="block">
              <span className={labelClass}>口コミ内容（20〜500文字）</span>
              <textarea
                value={form.comment}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    comment: event.target.value,
                  }))
                }
                rows={4}
                className={inputClass}
                placeholder="面接やお店の雰囲気、働きやすさなどを具体的に書いてください。"
                required
              />
              <span className="mt-1 block text-xs text-muted">
                {[...form.comment.trim()].length}文字
              </span>
            </label>

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-full border border-gold bg-champagne/60 px-4 py-2 text-sm font-semibold text-gold-dark disabled:opacity-60"
              >
                {saving ? "保存中…" : editingId ? "更新して公開" : "追加して公開"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={startCreate}
                  className="rounded-full border border-gold/30 px-4 py-2 text-sm text-muted"
                >
                  新規追加に戻る
                </button>
              )}
            </div>
          </form>

          {error && (
            <p className="text-sm text-red-700" role="alert">
              {error}
            </p>
          )}
          {message && <p className="text-sm text-gold-dark">{message}</p>}

          <div>
            <p className={`${labelClass} mb-2`}>登録済み口コミ（新しい順）</p>
            {loading ? (
              <p className="text-sm text-muted">読み込み中…</p>
            ) : sorted.length === 0 ? (
              <p className="text-sm text-muted">まだ口コミがありません。</p>
            ) : (
              <ul className="space-y-3">
                {sorted.map((review) => (
                  <li
                    key={review.id}
                    className="rounded-xl border border-gold/20 bg-ivory/50 px-4 py-3"
                  >
                    <p className="text-xs text-muted">
                      【{GIRL_REVIEW_CATEGORY_LABELS[review.category]}】
                    </p>
                    <p className="mt-1 text-sm text-gold-dark">
                      {formatStarRating(review.rating)}
                      <span className="ml-2 text-xs text-muted">（AI自動評価）</span>
                    </p>
                    <p className="mt-1 text-sm font-semibold text-charcoal">
                      {review.nickname}（{review.age}歳）
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-charcoal">
                      {review.comment}
                    </p>
                    <div className="mt-2 flex gap-3">
                      <button
                        type="button"
                        onClick={() => startEdit(review)}
                        className="text-xs font-medium text-gold-dark underline-offset-2 hover:underline"
                      >
                        編集
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(review.id)}
                        className="text-xs text-muted hover:text-charcoal"
                      >
                        削除
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
