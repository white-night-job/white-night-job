"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type DrawerItem = {
  href?: string;
  label: string;
  action?: "chat";
  match?: "exact" | "prefix" | "hash";
};

const MAIN_ITEMS: DrawerItem[] = [
  { href: "/", label: "ホーム", match: "exact" },
  { href: "/#shop-search", label: "お店を探す", match: "hash" },
  { href: "/column", label: "コラム", match: "prefix" },
  { label: "AI相談", action: "chat" },
  { href: "/#night-job-diagnosis", label: "職種診断", match: "hash" },
];

const SHOP_ITEMS: DrawerItem[] = [
  { href: "/shop-login", label: "店舗ログイン", match: "prefix" },
  { href: "/for-shops", label: "掲載をご希望の方", match: "prefix" },
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
  const [open, setOpen] = useState(false);
  const [shopAuthenticated, setShopAuthenticated] = useState(false);

  useEffect(() => {
    fetch("/api/shop-session", { cache: "no-store", credentials: "include" })
      .then((response) => response.json())
      .then((data: { authenticated?: boolean }) => {
        setShopAuthenticated(Boolean(data.authenticated));
      })
      .catch(() => setShopAuthenticated(false));
  }, [pathname]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const hideShopSection = pathname.startsWith("/admin");
  const shopLoginHref = shopAuthenticated ? "/shop-dashboard" : "/shop-login";
  const shopLoginLabel = shopAuthenticated ? "店舗管理" : "店舗ログイン";

  function handleItemClick(item: DrawerItem) {
    if (item.action === "chat") {
      openChatBot();
    }
    setOpen(false);
  }

  function renderItem(item: DrawerItem, key: string) {
    const active = isItemActive(pathname, item);
    const className = `header-drawer-item ${active ? "is-active" : ""}`;

    if (item.action === "chat") {
      return (
        <li key={key}>
          <button type="button" onClick={() => handleItemClick(item)} className={className}>
            {item.label}
          </button>
        </li>
      );
    }

    const href =
      item.href === "/shop-login" ? shopLoginHref : item.href!;
    const label =
      item.href === "/shop-login" ? shopLoginLabel : item.label;

    return (
      <li key={key}>
        <Link
          href={href}
          onClick={() => setOpen(false)}
          className={className}
          aria-current={active ? "page" : undefined}
        >
          {label}
        </Link>
      </li>
    );
  }

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

      {open && (
        <div className="header-drawer-root" role="presentation">
          <button
            type="button"
            aria-label="メニューを閉じる"
            className="header-drawer-backdrop"
            onClick={() => setOpen(false)}
          />
          <nav
            id="header-drawer-panel"
            aria-label="サイトメニュー"
            className="header-drawer-panel"
          >
            <div className="header-drawer-head">
              <p className="header-drawer-head-label font-serif">Menu</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="header-drawer-close"
                aria-label="閉じる"
              >
                ×
              </button>
            </div>

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
          </nav>
        </div>
      )}
    </>
  );
}
