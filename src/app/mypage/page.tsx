"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { LineLoginButton } from "@/components/LineLoginButton";
import { ViewHistoryList } from "@/components/ViewHistoryList";
import { useUserSession } from "@/components/UserSessionProvider";
import { MyPageAccordionSection } from "@/components/mypage/MyPageAccordionSection";
import { MyPageDiagnosisSection } from "@/components/mypage/MyPageDiagnosisSection";
import { MyPageFavoritesSection } from "@/components/mypage/MyPageFavoritesSection";
import { MyPageLogoutButton } from "@/components/mypage/MyPageLogoutButton";
import { MyPageNotificationSection } from "@/components/mypage/MyPageNotificationSection";
import { MyPageProfileCard } from "@/components/mypage/MyPageProfileCard";
import { MyPageSearchHistorySection } from "@/components/mypage/MyPageSearchHistorySection";

type SectionKey =
  | "search"
  | "favorites"
  | "history"
  | "diagnosis"
  | "notifications";

const INITIAL_OPEN: Record<SectionKey, boolean> = {
  search: false,
  favorites: false,
  history: false,
  diagnosis: false,
  notifications: false,
};

export default function MyPage() {
  const { isLoggedIn, ready } = useUserSession();
  const [openSections, setOpenSections] =
    useState<Record<SectionKey, boolean>>(INITIAL_OPEN);

  const toggleSection = useCallback((key: SectionKey) => {
    setOpenSections((current) => ({
      ...current,
      [key]: !current[key],
    }));
  }, []);

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

      <MyPageSearchHistorySection
        open={openSections.search}
        onToggle={() => toggleSection("search")}
      />

      <MyPageFavoritesSection
        open={openSections.favorites}
        onToggle={() => toggleSection("favorites")}
      />

      <MyPageAccordionSection
        title="最近見た店舗"
        open={openSections.history}
        onToggle={() => toggleSection("history")}
        headerAside={
          <Link
            href="/mypage/history"
            prefetch
            className="text-xs font-medium text-gold-dark"
          >
            すべて見る
          </Link>
        }
      >
        <ViewHistoryList showTitle={false} limit={5} />
      </MyPageAccordionSection>

      <MyPageDiagnosisSection
        open={openSections.diagnosis}
        onToggle={() => toggleSection("diagnosis")}
      />

      <MyPageNotificationSection
        open={openSections.notifications}
        onToggle={() => toggleSection("notifications")}
      />

      <MyPageLogoutButton />
    </div>
  );
}
