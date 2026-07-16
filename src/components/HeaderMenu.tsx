"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ShieldAlert } from "lucide-react";

type MenuIconName =
  | "beginner"
  | "search"
  | "list"
  | "new"
  | "pickup"
  | "alert"
  | "building"
  | "book"
  | "document"
  | "megaphone"
  | "heart"
  | "bell"
  | "line"
  | "user"
  | "logout";

type NavItem = {
  href: string;
  label: string;
  icon: MenuIconName;
  match?: "exact" | "prefix" | "hash";
};

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "ホーム", icon: "heart", match: "exact" },
  { href: "/#shop-search", label: "お店を探す", icon: "search", match: "hash" },
  { href: "/column", label: "コラム", icon: "book", match: "prefix" },
  { href: "/consultation", label: "AI相談", icon: "line", match: "prefix" },
  { href: "/diagnosis", label: "あなたに合う職種診断", icon: "list", match: "prefix" },
  { href: "/report", label: "ブラック店報告", icon: "alert", match: "exact" },
  { href: "/#first-time-guide", label: "初めての方へ", icon: "beginner", match: "hash" },
  { href: "/#new-shops", label: "新着店舗", icon: "new", match: "hash" },
  { href: "/#pickup-shops", label: "PICK UP店舗", icon: "pickup", match: "hash" },
  { href: "/jobs", label: "求人一覧", icon: "list", match: "prefix" },
  { href: "/terms-user", label: "利用規約（求職者）", icon: "book", match: "exact" },
  { href: "/terms-shop", label: "利用規約（掲載店舗）", icon: "book", match: "exact" },
  { href: "/legal", label: "特定商取引法に基づく表記", icon: "document", match: "exact" },
  { href: "/shop-login", label: "店舗様ログイン", icon: "building", match: "prefix" },
  { href: "/for-shops", label: "掲載をご検討の方はこちら", icon: "megaphone", match: "prefix" },
];

function MenuIcon({ name }: { name: MenuIconName }) {
  const common = {
    className: "header-menu-icon",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    "aria-hidden": true as const,
  };

  switch (name) {
    case "beginner":
      return (
        <svg {...common}>
          <path
            d="M12 3.5c2.2 1.8 3.8 2.4 6 2.4v6.2c0 3.7-2.5 6.4-6 8.4-3.5-2-6-4.7-6-8.4V5.9c2.2 0 3.8-.6 6-2.4z"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M12 9v4M12 15.5h.01"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      );
    case "search":
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="6.25" strokeWidth="1.5" />
          <path d="M16 16l3.5 3.5" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "list":
      return (
        <svg {...common}>
          <path
            d="M8 7h11M8 12h11M8 17h11M5 7h.01M5 12h.01M5 17h.01"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case "new":
      return (
        <svg {...common}>
          <path
            d="M12 4.5l1.6 4.2H18l-3.5 2.7 1.3 4.3L12 13.8 8.2 15.7l1.3-4.3L6 8.7h4.4L12 4.5z"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "pickup":
      return (
        <svg {...common}>
          <path
            d="M12 4.5l1.9 4.8 5.1.4-3.9 3.3 1.2 5-4.3-2.7-4.3 2.7 1.2-5-3.9-3.3 5.1-.4L12 4.5z"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "alert":
      return (
        <ShieldAlert
          className="header-menu-icon"
          strokeWidth={1.5}
          aria-hidden
        />
      );
    case "building":
      return (
        <svg {...common}>
          <path
            d="M4.5 20.5h15M6.5 20.5V6.5A1.5 1.5 0 018 5h8a1.5 1.5 0 011.5 1.5v14"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M9.5 9h1M13.5 9h1M9.5 12.5h1M13.5 12.5h1M9.5 16h1M13.5 16h1"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case "book":
      return (
        <svg {...common}>
          <path
            d="M5.5 5.5A2 2 0 017.5 4H18v15.5H7.5a2 2 0 000 4H18"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M7.5 19.5V4" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "document":
      return (
        <svg {...common}>
          <path
            d="M7.5 3.5h6.5L18.5 8v12a1 1 0 01-1 1h-10a1 1 0 01-1-1v-15a1 1 0 011-1z"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M14 3.5V8h4.5M9 12h6M9 15.5h6" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "megaphone":
      return (
        <svg {...common}>
          <path
            d="M4.5 10.5v3c0 .8.7 1.5 1.5 1.5h1.2l2.8 3.2c.4.4 1 .1 1-.4V6.2c0-.5-.6-.8-1-.4L7.2 9H6c-.8 0-1.5.7-1.5 1.5z"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M11 7.5c2.2.8 4.5 2.2 6.5 4-2 1.8-4.3 3.2-6.5 4"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M18.5 9.5c1.2 1.1 1.8 2.3 1.8 2.5s-.6 1.4-1.8 2.5" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "heart":
      return (
        <svg {...common}>
          <path
            d="M12 20s-6.8-4.3-8.6-8.2c-1.3-2.9.4-6.3 3.8-6.8 2-.3 3.5.6 4.8 2 1.3-1.4 2.8-2.3 4.8-2 3.4.5 5.1 3.9 3.8 6.8C18.8 15.7 12 20 12 20z"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "bell":
      return (
        <svg {...common}>
          <path
            d="M12 4.5a4.5 4.5 0 00-4.5 4.5v2.3c0 1.4-.5 2.8-1.5 3.8l-1 1.1h14l-1-1.1a5.4 5.4 0 01-1.5-3.8V9A4.5 4.5 0 0012 4.5z"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M10 19a2 2 0 004 0" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "line":
      return (
        <svg {...common}>
          <path
            d="M4 8.5C4 5.5 7.6 3 12 3s8 2.5 8 5.5-3.6 5.5-8 5.5h-1.2l-3 2.8c-.4.3-1 .1-1-.4V14C5.1 13.2 4 11.9 4 10.2V8.5z"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "user":
      return (
        <svg {...common}>
          <circle cx="12" cy="8.5" r="3.25" strokeWidth="1.5" />
          <path
            d="M5.5 19.5c.8-3 3.4-5 6.5-5s5.7 2 6.5 5"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case "logout":
      return (
        <svg {...common}>
          <path d="M14 7V5.5A1.5 1.5 0 0012.5 4h-6A1.5 1.5 0 005 5.5v13A1.5 1.5 0 006.5 20h6a1.5 1.5 0 001.5-1.5V17" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M10 12h9M16.5 8.5 20 12l-3.5 3.5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return null;
  }
}

function isItemActive(pathname: string, item: NavItem) {
  if (item.match === "prefix") {
    if (item.href === "/jobs") return pathname === "/jobs" || pathname.startsWith("/jobs/");
    if (item.href === "/shop-login") {
      return pathname.startsWith("/shop-login") || pathname.startsWith("/shop-dashboard");
    }
    if (item.href === "/for-shops") {
      return pathname === "/for-shops" || pathname.startsWith("/for-shops/");
    }
    if (item.href === "/column") {
      return pathname === "/column" || pathname.startsWith("/column/");
    }
    if (item.href === "/mypage") {
      return pathname === "/mypage" || pathname.startsWith("/mypage/");
    }
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }

  if (item.match === "exact") {
    return pathname === item.href;
  }

  return false;
}

export function HeaderMenu() {
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);
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
    function handlePointerDown(event: MouseEvent | TouchEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    if (!open) return;

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const hideShopLink = pathname.startsWith("/admin");

  const items = NAV_ITEMS.filter((item) => {
    if (item.icon === "building" && hideShopLink) return false;
    return true;
  }).map((item) => {
    if (item.icon === "building") {
      return {
        ...item,
        href: shopAuthenticated ? "/shop-dashboard" : "/shop-login",
        label: shopAuthenticated ? "店舗ログイン" : "店舗様ログイン",
      };
    }
    return item;
  });

  return (
    <div ref={menuRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-controls="site-header-menu"
        aria-label="メニュー"
        className="header-menu-btn flex min-h-11 min-w-11 items-center justify-center rounded-lg border px-2 sm:min-h-10 sm:min-w-[4.25rem] sm:px-3"
      >
        <svg
          className="h-4 w-4 shrink-0 sm:h-[18px] sm:w-[18px]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M4 7h16M4 12h16M4 17h16"
          />
        </svg>
        <span className="ml-1.5 hidden text-[11px] font-semibold tracking-wide sm:inline">
          メニュー
        </span>
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="メニューを閉じる"
            className="fixed inset-0 z-40 bg-charcoal/20"
            onClick={() => setOpen(false)}
          />
          <nav id="site-header-menu" className="header-menu-panel">
            <ul className="header-menu-list">
              {items.map((item) => {
                const active = isItemActive(pathname, item);
                return (
                  <li key={`${item.label}-${item.href}`}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={`header-menu-item ${active ? "is-active" : ""}`}
                      aria-current={active ? "page" : undefined}
                    >
                      <MenuIcon name={item.icon} />
                      <span className="header-menu-item-label">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </>
      )}
    </div>
  );
}
