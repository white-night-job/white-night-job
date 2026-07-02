"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HeaderMenu } from "@/components/HeaderMenu";

export function Header() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <header className="sticky top-0 z-50 border-b border-[#C4A574]/35 bg-white">
      <div className="mx-auto flex h-[3.75rem] max-w-5xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-8">
        <Link
          href="/"
          className="header-brand group flex min-w-0 shrink items-center gap-2 sm:gap-2.5"
        >
          <span className="header-brand-emblem flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-serif text-[10px] font-bold tracking-tight sm:h-9 sm:w-9 sm:text-[11px]">
            WN
          </span>
          <span className="header-brand-type min-w-0 leading-none">
            <span className="block truncate text-[10px] font-medium tracking-[0.22em] text-[#111111]/60 sm:text-[11px]">
              White Night
            </span>
            <span className="mt-0.5 block truncate text-sm font-semibold tracking-[0.1em] text-[#111111] sm:text-[15px]">
              Job
            </span>
          </span>
        </Link>
        <HeaderMenu variant="light" />
      </div>
      {isHome && (
        <div
          className="h-px bg-gradient-to-r from-transparent via-[#C4A574]/55 to-transparent"
          aria-hidden
        />
      )}
    </header>
  );
}
