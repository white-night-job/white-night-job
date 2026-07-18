"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LineLoginButton } from "@/components/LineLoginButton";
import { useUserSession } from "@/components/UserSessionProvider";

export function HeaderDesktopNav() {
  const pathname = usePathname();
  const { isLoggedIn } = useUserSession();

  return (
    <div className="site-header-desktop-actions">
      {isLoggedIn ? (
        <Link href="/mypage" className="site-header-desktop-action">
          マイページ
        </Link>
      ) : (
        <LineLoginButton
          className="site-header-desktop-action"
          redirectPath={pathname || "/"}
          action="general"
          preferWebOAuthOutsideLine
        >
          ログイン
        </LineLoginButton>
      )}
      <Link href="/shop-login" className="site-header-desktop-action is-shop">
        店舗ログイン
      </Link>
    </div>
  );
}
