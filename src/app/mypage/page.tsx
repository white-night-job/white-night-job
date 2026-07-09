"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MyPageFavoriteCard } from "@/components/MyPageFavoriteCard";
import { ViewHistoryList } from "@/components/ViewHistoryList";
import { useUserSession } from "@/components/UserSessionProvider";
import {
  buildJobsSearchUrl,
  describeSearchHistory,
  loadSearchHistory,
  type SavedSearchFilters,
} from "@/lib/search-history";
import type { Job } from "@/types/job";

type NotificationSettings = {
  notifyNewJobs: boolean;
  notifyPickupJobs: boolean;
  notifyFavoriteUpdates: boolean;
};

export default function MyPage() {
  const router = useRouter();
  const { currentUser, isLoggedIn, ready, refreshSession } = useUserSession();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchHistory, setSearchHistory] = useState<SavedSearchFilters | null>(null);
  const [settings, setSettings] = useState<NotificationSettings>({
    notifyNewJobs: true,
    notifyPickupJobs: true,
    notifyFavoriteUpdates: true,
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }

    setSearchHistory(loadSearchHistory());

    Promise.all([
      fetch("/api/favorites", { cache: "no-store", credentials: "include" }),
      fetch("/api/notification-settings", {
        cache: "no-store",
        credentials: "include",
      }),
    ])
      .then(async ([favoritesResponse, settingsResponse]) => {
        if (favoritesResponse.ok) {
          const data = (await favoritesResponse.json()) as { jobs?: Job[] };
          setJobs(data.jobs ?? []);
        }
        if (settingsResponse.ok) {
          const data = (await settingsResponse.json()) as NotificationSettings;
          setSettings(data);
        }
      })
      .finally(() => setLoading(false));
  }, [isLoggedIn, ready]);

  async function saveSettings() {
    setSavingSettings(true);
    setSettingsMessage("");
    try {
      const response = await fetch("/api/notification-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(settings),
      });
      if (!response.ok) throw new Error("保存に失敗しました。");
      setSettingsMessage("通知設定を保存しました。");
    } catch (error) {
      console.error("[mypage] settings save failed:", error);
      setSettingsMessage("通知設定の保存に失敗しました。");
    } finally {
      setSavingSettings(false);
    }
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/user/logout", { method: "POST", credentials: "include" });
      await refreshSession();
      router.push("/");
    } catch (error) {
      console.error("[mypage] logout failed:", error);
    } finally {
      setLoggingOut(false);
    }
  }

  if (!ready || loading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8 sm:max-w-2xl sm:px-6">
        <div className="h-64 animate-pulse rounded-2xl border border-gold/15 bg-white" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="mx-auto max-w-md px-4 py-10">
        <div className="rounded-2xl border border-gold/25 bg-white p-6 text-center shadow-gold">
          <h1 className="font-serif text-xl font-semibold text-charcoal">マイページ</h1>
          <p className="mt-2 text-sm text-muted">
            マイページはLINEログイン後にご利用いただけます。
          </p>
          <a
            href="/api/line/login?redirect=/mypage"
            className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#06c755] px-5 text-sm font-semibold text-white"
          >
            LINEでログイン
          </a>
        </div>
      </div>
    );
  }

  const searchSummary = searchHistory ? describeSearchHistory(searchHistory) : [];

  return (
    <div className="mx-auto max-w-lg px-4 py-5 sm:max-w-2xl sm:px-6 sm:py-8">
      <section className="rounded-2xl border border-gold/25 bg-white p-5 shadow-gold">
        <h1 className="font-serif text-2xl font-semibold text-charcoal">マイページ</h1>
        <div className="mt-4 flex items-center gap-3">
          {currentUser?.pictureUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentUser.pictureUrl}
              alt=""
              className="h-14 w-14 rounded-full border-2 border-gold/35 object-cover shadow-gold"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-gold/35 bg-ivory text-xl shadow-gold">
              👤
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-serif text-lg font-semibold text-charcoal">
              {currentUser?.displayName ?? "ユーザー"}
            </p>
            <span className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-[#06c755]/30 bg-[#06c755]/10 px-2.5 py-1 text-[11px] font-semibold text-[#058a42]">
              LINE連携済み
            </span>
          </div>
        </div>
      </section>

      <section className="mt-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-serif text-lg font-semibold text-charcoal">お気に入り店舗</h2>
          <Link href="/mypage/favorites" className="text-xs font-medium text-gold-dark">
            すべて見る
          </Link>
        </div>
        {jobs.length === 0 ? (
          <div className="rounded-2xl border border-gold/20 bg-white p-5 text-sm text-muted">
            まだお気に入り登録された店舗はありません。
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.slice(0, 3).map((job) => (
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
      </section>

      <section className="mt-5 rounded-2xl border border-gold/20 bg-white p-5 shadow-gold">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-serif text-lg font-semibold text-charcoal">最近見た店舗</h2>
          <Link href="/mypage/history" className="text-xs font-medium text-gold-dark">
            すべて見る
          </Link>
        </div>
        <ViewHistoryList showTitle={false} />
      </section>

      <section className="mt-5 rounded-2xl border border-gold/20 bg-white p-5 shadow-gold">
        <h2 className="font-serif text-lg font-semibold text-charcoal">最近の検索条件</h2>
        {searchSummary.length === 0 ? (
          <p className="mt-2 text-sm text-muted">保存された検索条件はありません。</p>
        ) : (
          <ul className="mt-3 space-y-1.5 text-sm text-charcoal">
            {searchSummary.map((line) => (
              <li key={line} className="flex gap-2">
                <span className="text-gold-dark">・</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        )}
        {searchHistory && (
          <Link
            href={buildJobsSearchUrl(searchHistory)}
            className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-full border border-gold/40 bg-ivory px-4 text-sm font-semibold text-gold-dark"
          >
            前回の条件で検索する
          </Link>
        )}
      </section>

      <section className="mt-5 rounded-2xl border border-gold/20 bg-white p-5 shadow-gold">
        <h2 className="font-serif text-lg font-semibold text-charcoal">通知設定</h2>
        <div className="mt-4 space-y-3">
          <label className="flex items-center gap-3 text-sm text-charcoal">
            <input
              type="checkbox"
              checked={settings.notifyNewJobs}
              onChange={(event) =>
                setSettings((c) => ({ ...c, notifyNewJobs: event.target.checked }))
              }
            />
            新着店舗通知
          </label>
          <label className="flex items-center gap-3 text-sm text-charcoal">
            <input
              type="checkbox"
              checked={settings.notifyPickupJobs}
              onChange={(event) =>
                setSettings((c) => ({ ...c, notifyPickupJobs: event.target.checked }))
              }
            />
            PICK UP店舗通知
          </label>
          <label className="flex items-center gap-3 text-sm text-charcoal">
            <input
              type="checkbox"
              checked={settings.notifyFavoriteUpdates}
              onChange={(event) =>
                setSettings((c) => ({ ...c, notifyFavoriteUpdates: event.target.checked }))
              }
            />
            お気に入り店舗の更新通知
          </label>
        </div>
        <button
          type="button"
          onClick={saveSettings}
          disabled={savingSettings}
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-gradient-to-r from-gold to-gold-dark px-4 text-sm font-semibold text-white disabled:opacity-60"
        >
          {savingSettings ? "保存中..." : "通知設定を保存"}
        </button>
        {settingsMessage && <p className="mt-2 text-sm text-muted">{settingsMessage}</p>}
      </section>

      <button
        type="button"
        onClick={handleLogout}
        disabled={loggingOut}
        className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-full border border-charcoal/20 bg-white px-4 text-sm font-semibold text-charcoal shadow-gold disabled:opacity-60"
      >
        {loggingOut ? "ログアウト中..." : "ログアウト"}
      </button>
    </div>
  );
}
