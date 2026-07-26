"use client";

import { useUserSession } from "@/components/UserSessionProvider";
import { MyPageProfileSkeleton } from "@/components/mypage/MyPageSkeletons";

export function MyPageProfileCard() {
  const { currentUser, isLoggedIn, ready } = useUserSession();

  const displayName = currentUser?.displayName?.trim() || "ユーザー";
  const pictureUrl = currentUser?.pictureUrl?.trim() || "";

  return (
    <section className="rounded-2xl border border-gold/25 bg-white p-5 shadow-gold">
      <h1 className="font-serif text-2xl font-semibold text-charcoal">マイページ</h1>
      {!ready || !isLoggedIn ? (
        <MyPageProfileSkeleton />
      ) : (
        <div className="mt-4 flex items-center gap-3">
          {pictureUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={pictureUrl}
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
              {displayName}
            </p>
            <span className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-[#06c755]/30 bg-[#06c755]/10 px-2.5 py-1 text-[11px] font-semibold text-[#058a42]">
              LINE連携済み
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
