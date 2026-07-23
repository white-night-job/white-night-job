"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Bot, BookOpen, ClipboardList, Home, MapPin, ShieldAlert, Lock, Sparkles, Star, Store } from "lucide-react";
import { MemberGateModal } from "@/components/MemberGateModal";
import { useUserSession } from "@/components/UserSessionProvider";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { MEMBER_PATHS } from "@/lib/member-access";

type DrawerItem = {
  href?: string;
  label: string;
  action?: "chat" | "diagnosis";
  memberOnly?: boolean;
  match?: "exact" | "prefix" | "hash";
  icon?: ReactNode;
  desktopIcon?: ReactNode;
};

const DRAWER_ICON_PROPS = {
  className: "header-drawer-item-icon",
  strokeWidth: 1.5,
} as const;

const MAIN_ITEMS: DrawerItem[] = [
  {
    href: "/",
    label: "ホーム",
    match: "exact",
    desktopIcon: <Home {...DRAWER_ICON_PROPS} />,
  },
  {
    href: "/#shop-search",
    label: "お店を探す",
    match: "hash",
    desktopIcon: <MapPin {...DRAWER_ICON_PROPS} />,
  },
  {
    href: "/#new-shops",
    label: "新着店舗",
    match: "hash",
    desktopIcon: <Sparkles {...DRAWER_ICON_PROPS} />,
  },
  {
    href: "/#pickup-shops",
    label: "PICK UP店舗",
    match: "hash",
    desktopIcon: <Star {...DRAWER_ICON_PROPS} />,
  },
  {
    href: "/#new-open-shops",
    label: "新規オープン店舗",
    match: "hash",
    desktopIcon: <Store {...DRAWER_ICON_PROPS} />,
  },
  {
    href: "/column",
    label: "コラム",
    match: "prefix",
    desktopIcon: <BookOpen {...DRAWER_ICON_PROPS} />,
  },
  {
    label: "AI相談",
    action: "chat",
    memberOnly: true,
    icon: <Bot {...DRAWER_ICON_PROPS} />,
  },
  {
    label: "あなたに合う職種診断",
    action: "diagnosis",
    memberOnly: true,
    icon: <ClipboardList {...DRAWER_ICON_PROPS} />,
  },
  {
    href: "/report",
    label: "ブラック店報告",
    match: "exact",
    icon: <ShieldAlert {...DRAWER_ICON_PROPS} />,
  },
];

const SHOP_ITEMS: DrawerItem[] = [
  { href: "/shop-login", label: "店舗ログイン", match: "prefix" },
  { href: "/for-shops", label: "掲載をご検討の方はこちら", match: "prefix" },
];

const FOOTER_ITEMS: DrawerItem[] = [
  { href: "/terms-user", label: "利用規約", match: "exact" },
  { href: "/privacy", label: "プライバシーポリシー", match: "exact" },
  { href: "/contact", label: "お問い合わせ", match: "exact" },
];

function isItemActive(pathname: string, item: DrawerItem) {
  if (!item.href) return false;
  if (item.match === "prefix") {
    if (item.href === "/column") {
      return pathname === "/column" || pathname.startsWith("/column/");
    }
    if (item.href === "/shop-login") {
      return (
        pathname.startsWith("/shop-login") ||
        pathname.startsWith("/shop-dashboard")
      );
    }
    if (item.href === "/for-shops") {
      return pathname === "/for-shops" || pathname.startsWith("/for-shops/");
    }
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }
  if (item.match === "exact") {
    return pathname === item.href;
  }
  return false;
}

function openChatBot() {
  window.dispatchEvent(new CustomEvent("wn:open-chat"));
}

export function HeaderDrawer() {
  const pathname = usePathname();
  const isDesktop = useIsDesktop();
  const { isLoggedIn, ready } = useUserSession();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [shopAuthenticated, setShopAuthenticated] = useState(false);
  const [memberGate, setMemberGate] = useState<"chat" | "diagnosis" | null>(null);

  const closeDrawer = useCallback(() => {
    setOpen(false);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetch("/api/shop-session", { cache: "no-store", credentials: "include" })
      .then((response) => response.json())
      .then((data: { authenticated?: boolean }) => {
        setShopAuthenticated(Boolean(data.authenticated));
      })
      .catch(() => setShopAuthenticated(false));
  }, [pathname]);

  useEffect(() => {
    closeDrawer();
  }, [pathname, closeDrawer]);

  useEffect(() => {
    if (!open) return;

    const scrollY = window.scrollY;
    const { style } = document.body;
    const previous = {
      position: style.position,
      top: style.top,
      left: style.left,
      right: style.right,
      width: style.width,
      overflow: style.overflow,
    };

    style.position = "fixed";
    style.top = `-${scrollY}px`;
    style.left = "0";
    style.right = "0";
    style.width = "100%";
    style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeDrawer();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      style.position = previous.position;
      style.top = previous.top;
      style.left = previous.left;
      style.right = previous.right;
      style.width = previous.width;
      style.overflow = previous.overflow;
      window.scrollTo(0, scrollY);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, closeDrawer]);

  const hideShopSection = pathname.startsWith("/admin");
  const shopLoginHref = shopAuthenticated ? "/shop-dashboard" : "/shop-login";
  const shopLoginLabel = "店舗ログイン";

  function handleMemberAction(item: DrawerItem) {
    closeDrawer();

    if (!ready) return;

    if (item.action === "chat") {
      if (isLoggedIn) {
        if (isDesktop) {
          window.location.href = MEMBER_PATHS.consultation;
          return;
        }
        openChatBot();
        return;
      }
      setMemberGate("chat");
      return;
    }

    if (item.action === "diagnosis") {
      if (isLoggedIn) {
        window.location.href = MEMBER_PATHS.diagnosis;
        return;
      }
      setMemberGate("diagnosis");
    }
  }

  function resolveItemIcon(item: DrawerItem) {
    if (item.icon) return item.icon;
    if (isDesktop && item.desktopIcon) return item.desktopIcon;
    return null;
  }

  function renderItem(item: DrawerItem, key: string) {
    const active =
      item.action === "diagnosis"
        ? pathname === MEMBER_PATHS.diagnosis
        : isItemActive(pathname, item);
    const className = `header-drawer-item ${active ? "is-active" : ""}`;
    const showMemberBadge = item.memberOnly && ready && !isLoggedIn;
    const itemIcon = resolveItemIcon(item);

    if (item.action === "chat" || item.action === "diagnosis") {
      return (
        <li key={key}>
          <button
            type="button"
            onClick={() => handleMemberAction(item)}
            className={className}
          >
            <span className="header-drawer-item-main">
              {itemIcon}
              <span className="header-drawer-item-label">{item.label}</span>
            </span>
            {showMemberBadge && (
              <span className="header-drawer-member-badge">
                <Lock
                  className="header-drawer-member-lock-icon"
                  strokeWidth={1.75}
                  aria-hidden
                />
                <span className="header-drawer-member-lock-emoji" aria-hidden>
                  🔒
                </span>
                LINE会員限定
              </span>
            )}
          </button>
        </li>
      );
    }

    const href = item.href === "/shop-login" ? shopLoginHref : item.href!;
    const label = item.href === "/shop-login" ? shopLoginLabel : item.label;

    return (
      <li key={key}>
        <Link
          href={href}
          onClick={closeDrawer}
          className={className}
          aria-current={active ? "page" : undefined}
        >
          <span className="header-drawer-item-main">
            {itemIcon}
            <span className="header-drawer-item-label">{label}</span>
          </span>
        </Link>
      </li>
    );
  }

  const drawerPanel =
    open && mounted
      ? createPortal(
          <div
            className={`header-drawer-root${isDesktop ? " is-pc" : ""}`}
            role="presentation"
          >
            <button
              type="button"
              aria-label="メニューを閉じる"
              className="header-drawer-backdrop"
              onClick={closeDrawer}
            />
            <nav
              id="header-drawer-panel"
              aria-label="サイトメニュー"
              className="header-drawer-panel"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="header-drawer-head">
                <p className="header-drawer-head-label font-serif">
                  {isDesktop ? "MENU" : "Menu"}
                </p>
                <button
                  type="button"
                  onClick={closeDrawer}
                  className="header-drawer-close"
                  aria-label="閉じる"
                >
                  ×
                </button>
              </div>

              <div className="header-drawer-body">
                <ul className="header-drawer-list">
                  {MAIN_ITEMS.map((item) => renderItem(item, item.label))}
                </ul>

                {!hideShopSection && (
                  <>
                    <div className="header-drawer-divider" aria-hidden />
                    <p className="header-drawer-section-label">店舗様</p>
                    <ul className="header-drawer-list">
                      {SHOP_ITEMS.map((item) => renderItem(item, item.label))}
                    </ul>
                  </>
                )}

                <div className="header-drawer-divider" aria-hidden />
                <ul className="header-drawer-list header-drawer-list-footer">
                  {FOOTER_ITEMS.map((item) => renderItem(item, item.label))}
                </ul>
              </div>
            </nav>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="header-drawer-panel"
        aria-label="メニュー"
        className="header-icon-btn header-drawer-trigger"
      >
        <span aria-hidden>☰</span>
      </button>

      {drawerPanel}

      <MemberGateModal
        open={memberGate === "chat"}
        onClose={() => setMemberGate(null)}
        title="AI相談はLINEログイン後に利用できます"
        description="LINEログインすると、相談履歴を保存しながらAIへ相談できます。"
        redirectPath={MEMBER_PATHS.consultation}
        action="consultation"
      />
      <MemberGateModal
        open={memberGate === "diagnosis"}
        onClose={() => setMemberGate(null)}
        title="職種診断はLINEログイン後に利用できます"
        description="診断結果を保存して、あなたに合う職種や求人をいつでも確認できます。"
        redirectPath={MEMBER_PATHS.diagnosis}
        action="diagnosis"
      />
    </>
  );
}
