"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUserSession } from "@/components/UserSessionProvider";

export function HeaderDesktopNav() {
  const pathname = usePathname();
  const { isLoggedIn } = useUserSession();
  const lineLoginHref = `/api/line/login?redirect=${encodeURIComponent(pathname || "/")}`;

  return (
    <div className="site-header-desktop-actions">
      {isLoggedIn ? (
        <Link href="/mypage" className="site-header-desktop-action">
          マイページ
        </Link>
      ) : (
        <a href={lineLoginHref} className="site-header-desktop-action">
          ログイン
        </a>
      )}
      <Link href="/shop-login" className="site-header-desktop-action is-shop">
        店舗ログイン
      </Link>
    </div>
  );
}
