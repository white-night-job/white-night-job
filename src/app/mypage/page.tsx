"use client";

import { LineLoginButton } from "@/components/LineLoginButton";
import { useUserSession } from "@/components/UserSessionProvider";
import { MyPageDiagnosisSection } from "@/components/mypage/MyPageDiagnosisSection";
import { MyPageMenu } from "@/components/mypage/MyPageMenu";
import { MyPageProfileCard } from "@/components/mypage/MyPageProfileCard";
import { MyPageSearchHistorySection } from "@/components/mypage/MyPageSearchHistorySection";
import { useCallback, useState } from "react";

type SectionKey = "search" | "diagnosis";

const INITIAL_OPEN: Record<SectionKey, boolean> = {
  search: false,
  diagnosis: false,
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

  return (
    <div className="mx-auto max-w-lg px-4 py-5 sm:max-w-2xl sm:px-6 sm:py-8">
      <MyPageProfileCard />

      <MyPageMenu />

      <div className="mt-6 space-y-0">
        <MyPageSearchHistorySection
          open={openSections.search}
          onToggle={() => toggleSection("search")}
        />
        <MyPageDiagnosisSection
          open={openSections.diagnosis}
          onToggle={() => toggleSection("diagnosis")}
        />
      </div>
    </div>
  );
}
