"use client";

import Link from "next/link";
import { LineLoginButton } from "@/components/LineLoginButton";
import { ViewHistoryList } from "@/components/ViewHistoryList";
import { useUserSession } from "@/components/UserSessionProvider";

export default function MyPageHistoryPage() {
  const { isLoggedIn, ready } = useUserSession();

  if (!ready) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8 sm:max-w-2xl sm:px-6">
        <div className="h-56 animate-pulse rounded-2xl bg-white" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="mx-auto max-w-md px-4 py-10">
        <div className="rounded-2xl border border-gold/25 bg-white p-6 text-center shadow-gold">
          <h1 className="font-serif text-xl font-semibold text-charcoal">最近見た店舗</h1>
          <p className="mt-2 text-sm text-muted">閲覧履歴はLINEログイン後に表示されます。</p>
          <LineLoginButton
            className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#06c755] px-5 text-sm font-semibold text-white"
            redirectPath="/mypage/history"
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
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="font-serif text-2xl font-semibold text-charcoal">最近見た店舗</h1>
        <Link href="/mypage" className="text-sm font-medium text-gold-dark">
          マイページへ
        </Link>
      </div>
      <ViewHistoryList />
    </div>
  );
}
