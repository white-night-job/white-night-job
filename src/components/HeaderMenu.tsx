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

export function HeaderMenu() {
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

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
          <nav
            id="site-header-menu"
            className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[min(18rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-[#C4A574]/35 bg-gradient-to-br from-white via-[#faf7f2] to-[#f0e6d4] shadow-luxury"
          >
            <ul className="divide-y divide-[#C4A574]/20 py-1">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex min-h-11 items-center px-4 py-2.5 text-sm font-medium text-[#111111] transition hover:bg-[#C4A574]/10 hover:text-[#5a4828]"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </>
      )}
    </div>
  );
}
