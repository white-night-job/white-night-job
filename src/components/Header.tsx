import Link from "next/link";
import { HeaderActions } from "@/components/HeaderActions";
import { LOGO_ALT } from "@/lib/site";

export function Header() {
  return (
    <header className="site-header sticky top-0 z-50">
      <div className="mx-auto flex h-[3.75rem] max-w-5xl items-center justify-between gap-3 px-4 sm:h-16 sm:gap-4 sm:px-8">
        <Link
          href="/"
          aria-label={LOGO_ALT}
          className="header-brand group flex min-w-0 shrink items-center gap-1.5 sm:gap-2.5"
        >
          <span
            className="header-brand-emblem flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-serif text-[10px] font-bold tracking-tight sm:h-[38px] sm:w-[38px] sm:text-[11.5px]"
            role="img"
            aria-label={LOGO_ALT}
          >
            WN
          </span>
          <span className="header-brand-wordmark truncate font-serif text-[12px] font-semibold leading-none sm:text-[15px]">
            White Night Job
          </span>
        </Link>
        <HeaderActions />
      </div>
      <div className="site-header-line h-px" aria-hidden />
    </header>
  );
}
