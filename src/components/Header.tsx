"use client";

import Link from "next/link";
import { useEffect } from "react";
import { HeaderActions } from "@/components/HeaderActions";
import { LOGO_ALT } from "@/lib/site";

export function Header() {
  useEffect(() => {
    const onScroll = () => {
      document.documentElement.classList.toggle(
        "is-header-scrolled",
        window.scrollY > 6,
      );
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="site-header sticky top-0 z-50">
      <div className="site-header-inner mx-auto flex w-full max-w-none items-center justify-between gap-2 px-4 sm:max-w-5xl sm:gap-4 sm:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-6">
          <Link
            href="/"
            aria-label={LOGO_ALT}
            className="header-brand group flex min-w-0 shrink items-center gap-1.5 sm:gap-2.5"
          >
            <span
              className="header-brand-emblem flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-serif text-[9px] font-bold tracking-tight sm:h-[38px] sm:w-[38px] sm:text-[11.5px]"
              role="img"
              aria-label={LOGO_ALT}
            >
              WN
            </span>
            <span className="header-brand-wordmark truncate font-serif text-[11px] font-semibold leading-none sm:text-[15px]">
              White Night Job
            </span>
          </Link>
          <nav
            aria-label="メインナビゲーション"
            className="hidden items-center gap-1 md:flex"
          >
            <Link
              href="/column"
              className="header-nav-link rounded-lg px-3 py-2 text-[13px] font-medium text-white/85 transition-colors hover:text-gold-light"
            >
              コラム
            </Link>
          </nav>
        </div>
        <HeaderActions />
      </div>
      <div className="site-header-line h-px" aria-hidden />
    </header>
  );
}
