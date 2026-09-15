"use client";

import { useEffect, useState } from "react";

type UniqueUserCounts = {
  today: number;
  last7Days: number;
  last30Days: number;
  total: number;
  note?: string;
  message?: string;
};

const CARDS: Array<{
  key: "today" | "last7Days" | "last30Days" | "total";
  label: string;
}> = [
  { key: "today", label: "今日のユーザー数" },
  { key: "last7Days", label: "過去7日ユーザー数" },
  { key: "last30Days", label: "過去30日ユーザー数" },
  { key: "total", label: "累計ユーザー数" },
];

export function AdminUniqueUsersCard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [counts, setCounts] = useState<UniqueUserCounts | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/admin/unique-users", {
          cache: "no-store",
          credentials: "include",
        });
        const data = (await response.json().catch(() => ({}))) as UniqueUserCounts;
        if (!response.ok) {
          throw new Error(data.message || "取得に失敗しました。");
        }
        if (!cancelled) setCounts(data);
      } catch (err) {
        if (!cancelled) {
          setCounts(null);
          setError(err instanceof Error ? err.message : "取得に失敗しました。");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="mb-4 rounded-2xl border border-[rgba(184,149,90,0.35)] bg-[rgba(20,18,14,0.72)] p-4 sm:p-5">
      <div className="mb-3">
        <h2 className="m-0 font-serif text-lg font-semibold text-[#f3e6c8]">
          ユニークユーザー数
        </h2>
        <p className="mt-1 mb-0 text-xs leading-relaxed text-[rgba(243,230,200,0.65)]">
          ページ表示回数ではなく、同一visitorの重複を除いた人数です。
        </p>
      </div>

      {error ? (
        <p className="m-0 text-sm text-[#f0b4a8]">{error}</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {CARDS.map((card) => (
            <div
              key={card.key}
              className="rounded-xl border border-[rgba(184,149,90,0.28)] bg-[rgba(12,11,9,0.55)] px-3 py-3"
            >
              <p className="m-0 text-[11px] font-medium text-[rgba(243,230,200,0.7)] sm:text-xs">
                {card.label}
              </p>
              <p className="mt-2 mb-0 font-serif text-2xl font-semibold text-[#f3e6c8] sm:text-3xl">
                {loading || !counts
                  ? "—"
                  : Number(counts[card.key] ?? 0).toLocaleString("ja-JP")}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
