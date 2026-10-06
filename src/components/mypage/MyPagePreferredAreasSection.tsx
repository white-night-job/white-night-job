"use client";

import { useEffect, useState } from "react";
import { MyPageSectionSkeleton } from "@/components/mypage/MyPageSkeletons";
import {
  formatPreferredAreaList,
  PREFERRED_AREA_OPTIONS,
} from "@/lib/preferred-areas";
import { savePreferredAreas, usePreferredAreas } from "@/lib/preferred-areas-client";
import type { District } from "@/types/job";

export function MyPagePreferredAreasSection() {
  const { userId, areas, configured, ready } = usePreferredAreas();
  const [selected, setSelected] = useState<District[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (ready) setSelected(areas);
  }, [ready, areas]);

  function toggle(area: District) {
    setMessage("");
    setSelected((current) =>
      current.includes(area)
        ? current.filter((item) => item !== area)
        : [...current, area],
    );
  }

  async function save() {
    if (!userId) return;
    setSaving(true);
    setMessage("");
    try {
      const saved = await savePreferredAreas(userId, selected);
      setMessage(
        saved.length > 0
          ? "希望エリアを保存しました。"
          : "希望エリアを未設定にしました（全エリアを表示します）。",
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mt-5 rounded-2xl border border-gold/20 bg-white p-5 shadow-gold">
      <h2 className="font-serif text-lg font-semibold text-charcoal">希望エリア</h2>

      {!ready ? (
        <div className="mt-3">
          <MyPageSectionSkeleton height="h-24" />
        </div>
      ) : (
        <>
          {configured ? (
            <p className="mt-2 text-sm font-semibold text-charcoal">
              希望エリア：{formatPreferredAreaList(areas)}
            </p>
          ) : (
            <div className="mt-3 rounded-xl border border-gold/30 bg-ivory p-4">
              <p className="text-sm font-semibold text-charcoal">
                まずは希望エリアを設定してください
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                設定したエリアに合わせて、診断結果やおすすめ求人を表示します。
                希望エリアを設定すると、あなた向けの求人を絞り込めます。
              </p>
            </div>
          )}

          <p className="mt-4 text-xs text-muted">複数選択できます</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {PREFERRED_AREA_OPTIONS.map((option) => (
              <label
                key={option.value}
                className="inline-flex min-h-10 items-center gap-2 rounded-full border border-gold/25 bg-ivory/50 px-3 py-2 text-sm text-charcoal"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(option.value)}
                  onChange={() => toggle(option.value)}
                />
                {option.label}
              </label>
            ))}
          </div>

          <button
            type="button"
            onClick={() => void save()}
            disabled={saving || !userId}
            className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-gradient-to-r from-gold to-gold-dark px-4 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? "保存中..." : "希望エリアを保存"}
          </button>
          {message && <p className="mt-2 text-sm text-muted">{message}</p>}
        </>
      )}
    </section>
  );
}
