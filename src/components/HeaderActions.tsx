"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { HeaderMenu } from "@/components/HeaderMenu";
import { useUserSession } from "@/components/UserSessionProvider";

export function HeaderActions() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, isLoggedIn, ready, refreshSession } = useUserSession();
  const [shopAuthenticated, setShopAuthenticated] = useState(false);
  const [shopReady, setShopReady] = useState(false);

  useEffect(() => {
    fetch("/api/shop-session", { cache: "no-store", credentials: "include" })
      .then((response) => response.json())
      .then((data: { authenticated?: boolean }) => {
        setShopAuthenticated(Boolean(data.authenticated));
      })
      .catch(() => setShopAuthenticated(false))
      .finally(() => setShopReady(true));
  }, [pathname]);

  const hideShopLink = pathname.startsWith("/admin");
  const shopHref = shopAuthenticated ? "/shop-dashboard" : "/shop-login";
  const shopLabel = shopAuthenticated ? "店舗管理" : "店舗様ログイン";
  const lineLoginRedirect =
    pathname === "/" || !pathname ? "/mypage" : pathname;

  async function handleLogout() {
    await fetch("/api/user/logout", { method: "POST", credentials: "include" });
    await refreshSession();
    router.push("/");
  }

  return (
    <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
      {ready && isLoggedIn ? (
        <div className="flex items-center gap-1 sm:gap-1.5">
          <Link
            href="/mypage"
            className="header-user-link hidden sm:inline-flex"
          >
            マイページ
          </Link>
          <Link
            href="/favorites"
            className="header-user-link hidden sm:inline-flex"
          >
            お気に入り
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="header-user-link hidden sm:inline-flex"
          >
            ログアウト
          </button>
          <span className="inline-flex rounded-full border border-gold/40 bg-white/90 px-2 py-1 text-[10px] font-semibold text-gold-dark sm:hidden">
            {currentUser?.displayName ? `${currentUser.displayName.slice(0, 6)}…` : "ログイン中"}
          </span>
        </div>
      ) : (
        ready && (
          <div className="flex items-center gap-1 sm:gap-1.5">
            <a
              href={`/api/line/login?redirect=${encodeURIComponent(lineLoginRedirect)}`}
              className="header-user-link hidden sm:inline-flex"
            >
              LINEログイン
            </a>
            <Link href="/jobs" className="header-user-link hidden sm:inline-flex">
              ゲストで利用
            </Link>
          </div>
        )
      )}
      {!hideShopLink && (
        <Link
          href={shopHref}
          className={`header-shop-btn ${shopReady ? "" : "opacity-80"}`}
        >
          {shopLabel}
        </Link>
      )}
      <HeaderMenu />
    </div>
  );
}
