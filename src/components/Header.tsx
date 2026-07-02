"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HeaderMenu } from "@/components/HeaderMenu";
import { SITE_NAME } from "@/lib/site";

export function Header() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <header
      className={`sticky top-0 z-50 border-b backdrop-blur-md header-glow-line ${
        isHome
          ? "border-gold/50 bg-gradient-to-r from-white via-champagne to-white"
          : "border-gold/35 bg-ivory/95 shadow-luxury-sm"
      }`}
    >
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-2 px-3 sm:h-16 sm:px-6">
        <Link href="/" className="flex min-w-0 shrink items-center gap-1.5 sm:gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gold-mid/60 bg-gradient-gold-metal text-[10px] font-bold text-charcoal shadow-metal sm:h-8 sm:w-8 sm:text-xs">
            WN
          </span>
          <span
            className={`truncate font-serif text-sm font-semibold sm:text-xl ${
              isHome ? "text-gradient-gold" : "text-charcoal"
            }`}
          >
            {SITE_NAME}
          </span>
        </Link>
        <HeaderMenu variant={isHome ? "premium" : "light"} />
      </div>
      {isHome && (
        <div
          className="h-px bg-gradient-to-r from-transparent via-gold to-transparent"
          aria-hidden
        />
      )}
    </header>
  );
}
