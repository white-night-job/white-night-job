"use client";

import Link from "next/link";
import { LineLoginButton } from "@/components/LineLoginButton";
import { ViewHistoryList } from "@/components/ViewHistoryList";
import { useUserSession } from "@/components/UserSessionProvider";
import { MyPageDiagnosisSection } from "@/components/mypage/MyPageDiagnosisSection";
import { MyPageFavoritesSection } from "@/components/mypage/MyPageFavoritesSection";
import { MyPageLogoutButton } from "@/components/mypage/MyPageLogoutButton";
import { MyPageNotificationSection } from "@/components/mypage/MyPageNotificationSection";
import { MyPageProfileCard } from "@/components/mypage/MyPageProfileCard";
import { MyPageSearchHistorySection } from "@/components/mypage/MyPageSearchHistorySection";

export default function MyPage() {
  const { isLoggedIn, ready } = useUserSession();

  if (ready && !isLoggedIn) {
    return (
      <div className="mx-auto max-w-md px-4 py-10">
        <div className="rounded-2xl border border-gold/25 bg-white p-6 text-center shadow-gold">
          <h1 className="font-serif text-xl font-semibold text-charcoal">マイページ</h1>
          <p className="mt-2 text-sm text-muted">
            マイページはLINEログイン後にご利用いただけます。
          </p>
          <LineLoginButton
            className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#06c755] px-5 text-sm font-semibold text-white"
            redirectPath="/mypage"
            action="general"
          >
            LINEでログイン
          </LineLoginButton>
        </div>
      </div>
    );
  }

  // The shell (title, profile frame, section frames, menu) renders right away;
  // each section fills itself in as its own request resolves.
  return (
    <div className="mx-auto max-w-lg px-4 py-5 sm:max-w-2xl sm:px-6 sm:py-8">
      <MyPageProfileCard />

      <MyPageFavoritesSection />

      <MyPageDiagnosisSection />

      <section className="mt-5 rounded-2xl border border-gold/20 bg-white p-5 shadow-gold">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-serif text-lg font-semibold text-charcoal">最近見た店舗</h2>
          <Link
            href="/mypage/history"
            prefetch
            className="text-xs font-medium text-gold-dark"
          >
            すべて見る
          </Link>
        </div>
        <ViewHistoryList showTitle={false} limit={5} />
      </section>

      <MyPageSearchHistorySection />

      <MyPageNotificationSection />

      <MyPageLogoutButton />
    </div>
  );
}
