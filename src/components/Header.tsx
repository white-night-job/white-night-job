"use client";

import Link from "next/link";
import { HeaderMenu } from "@/components/HeaderMenu";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#C4A574]/28 bg-white">
      <div className="mx-auto flex h-[3.75rem] max-w-5xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-8">
        <Link
          href="/"
          className="header-brand group flex min-w-0 shrink items-center gap-2 sm:gap-2.5"
        >
          <span className="header-brand-emblem flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full font-serif text-[10.5px] font-bold tracking-tight sm:h-[38px] sm:w-[38px] sm:text-[11.5px]">
            WN
          </span>
          <span className="header-brand-type min-w-0 leading-none">
            <span className="block truncate text-[10.5px] font-medium tracking-[0.22em] text-[#111111]/60 sm:text-[11.5px]">
              White Night
            </span>
            <span className="mt-0.5 block truncate text-[15px] font-semibold tracking-[0.1em] text-[#111111] sm:text-[16px]">
              Job
            </span>
          </span>
        </Link>
        <HeaderMenu variant="light" />
      </div>
      <div
        className="h-px bg-gradient-to-r from-transparent via-[#C4A574]/40 to-transparent"
        aria-hidden
      />
    </header>
  );
}
