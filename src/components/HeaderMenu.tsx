"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const NAV_ITEMS = [
  { href: "/#first-time-guide", label: "初めての方へ" },
  { href: "/#shop-search", label: "店舗を探す" },
  { href: "/jobs", label: "求人一覧" },
  { href: "/report", label: "ブラック店報告" },
] as const;

export function HeaderMenu({ variant = "light" }: { variant?: "light" | "dark" }) {
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
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

  const shopHref = shopAuthenticated ? "/shop-dashboard" : "/shop-login";
  const shopLabel = shopAuthenticated ? "店舗管理" : "店舗ログイン";
  const hideShopLink = pathname.startsWith("/admin");

  const isDark = variant === "dark";

  return (
    <div ref={menuRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-controls="site-header-menu"
        aria-label="メニュー"
        className={`flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-full border px-3 text-sm font-semibold shadow-metal transition hover:shadow-luxury-glow sm:min-w-[5.5rem] sm:px-4 ${
          isDark
            ? "border-gold-mid/55 bg-gradient-gold-metal text-void hover:border-gold-light"
            : "border-gold/45 bg-gradient-to-br from-ivory to-[#FFF9EE] text-gold-dark hover:border-gold"
        }`}
      >
        <svg
          className="h-5 w-5 shrink-0 text-gold"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
        <span className="hidden sm:inline">メニュー</span>
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="メニューを閉じる"
            className="fixed inset-0 z-40 bg-charcoal/20"
            onClick={() => setOpen(false)}
          />
          <nav
            id="site-header-menu"
            className={`absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[min(18rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border shadow-luxury ${
              isDark
                ? "border-gold/45 bg-gradient-to-br from-charcoal to-void"
                : "border-gold/30 bg-white"
            }`}
          >
            <ul className="divide-y divide-gold/20 py-1">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex min-h-12 items-center px-4 py-3 text-sm font-medium transition ${
                      isDark
                        ? "text-white/85 hover:bg-gold/10 hover:text-gold-light"
                        : "text-charcoal hover:bg-ivory hover:text-gold-dark"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              {!hideShopLink && (
                <li>
                  <Link
                    href={shopHref}
                    onClick={() => setOpen(false)}
                    className={`flex min-h-12 items-center px-4 py-3 text-sm font-semibold transition ${
                      shopAuthenticated
                        ? "bg-gradient-to-r from-gold/10 to-gold-light/20 text-gold-dark hover:from-gold/15 hover:to-gold-light/30"
                        : "text-gold-dark hover:bg-ivory"
                    } ${shopReady ? "" : "opacity-80"}`}
                  >
                    {shopLabel}
                  </Link>
                </li>
              )}
            </ul>
          </nav>
        </>
      )}
    </div>
  );
}
