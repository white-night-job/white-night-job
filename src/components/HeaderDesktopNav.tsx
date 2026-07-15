"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { MemberGateModal } from "@/components/MemberGateModal";
import { useUserSession } from "@/components/UserSessionProvider";
import { MEMBER_PATHS } from "@/lib/member-access";

type NavItem = {
  href?: string;
  label: string;
  action?: "chat" | "diagnosis";
  memberOnly?: boolean;
  match?: "exact" | "prefix" | "hash";
};

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "ホーム", match: "exact" },
  { href: "/#shop-search", label: "お店を探す", match: "hash" },
  { href: "/column", label: "コラム", match: "prefix" },
  { label: "AI相談", action: "chat", memberOnly: true },
  { label: "職種診断", action: "diagnosis", memberOnly: true },
  { href: "/report", label: "ブラック店報告", match: "exact" },
];

function isActive(pathname: string, item: NavItem) {
  if (!item.href) return false;
  if (item.match === "exact") return pathname === item.href;
  if (item.match === "prefix") {
    if (item.href === "/column") {
      return pathname === "/column" || pathname.startsWith("/column/");
    }
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }
  return false;
}

export function HeaderDesktopNav() {
  const pathname = usePathname();
  const { isLoggedIn, ready } = useUserSession();
  const [gate, setGate] = useState<"ai" | "diagnosis" | null>(null);
  const lineLoginHref = `/api/line/login?redirect=${encodeURIComponent(pathname || "/")}`;

  function handleAction(item: NavItem) {
    if (item.action === "chat") {
      if (isLoggedIn) {
        window.location.href = MEMBER_PATHS.consultation;
        return;
      }
      setGate("ai");
      return;
    }
    if (item.action === "diagnosis") {
      if (isLoggedIn) {
        window.location.href = MEMBER_PATHS.diagnosis;
        return;
      }
      setGate("diagnosis");
    }
  }

  return (
    <>
      <nav className="site-header-desktop-nav" aria-label="メインメニュー">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item);
          if (item.href && !item.action) {
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`site-header-desktop-link ${active ? "is-active" : ""}`}
              >
                {item.label}
              </Link>
            );
          }
          return (
            <button
              key={item.label}
              type="button"
              className="site-header-desktop-link"
              onClick={() => handleAction(item)}
              disabled={!ready && item.memberOnly}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

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
          店舗様ログイン
        </Link>
      </div>

      <MemberGateModal
        open={gate === "ai"}
        onClose={() => setGate(null)}
        title="AI相談はLINEログイン後に利用できます"
        description="LINEログインすると、相談履歴を保存しながらAIへ相談できます。"
        redirectPath={MEMBER_PATHS.consultation}
      />
      <MemberGateModal
        open={gate === "diagnosis"}
        onClose={() => setGate(null)}
        title="職種診断はLINEログイン後に利用できます"
        description="診断結果を保存して、あなたに合う職種や求人をいつでも確認できます。"
        redirectPath={MEMBER_PATHS.diagnosis}
      />
    </>
  );
}
