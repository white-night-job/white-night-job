"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HeaderMenu } from "@/components/HeaderMenu";
import { SITE_NAME } from "@/lib/site";

export function Header() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <header className="sticky top-0 z-50 border-b border-[#C4A574]/35 bg-white">
      <div className="mx-auto flex h-[3.75rem] max-w-5xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-8">
        <Link href="/" className="flex min-w-0 shrink items-center gap-2 sm:gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#C4A574]/50 bg-[#FAF8F5] font-serif text-[11px] font-bold text-[#111111] sm:h-9 sm:w-9 sm:text-xs">
            WN
          </span>
          <span className="truncate font-serif text-base font-semibold tracking-wide text-[#111111] sm:text-lg">
            {SITE_NAME}
          </span>
        </Link>
        <HeaderMenu variant="light" />
      </div>
      {isHome && (
        <div className="h-px bg-gradient-to-r from-transparent via-[#C4A574]/55 to-transparent" aria-hidden />
      )}
    </header>
  );
}
