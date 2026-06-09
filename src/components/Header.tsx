import Link from "next/link";
import { HeaderShopLink } from "@/components/HeaderShopLink";
import { SITE_NAME } from "@/lib/site";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-gold/20 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-2 px-3 sm:h-16 sm:px-6">
        <Link href="/" className="flex min-w-0 shrink items-center gap-1.5 sm:gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gold bg-gradient-to-br from-gold-light to-gold text-[10px] font-bold text-white sm:h-8 sm:w-8 sm:text-xs">
            WN
          </span>
          <span className="truncate font-serif text-sm font-semibold text-charcoal sm:text-xl">
            {SITE_NAME}
          </span>
        </Link>
        <nav className="flex shrink-0 items-center gap-1.5 text-[10px] font-medium text-muted sm:gap-4 sm:text-sm">
          <Link href="/#first-time-guide" className="whitespace-nowrap hover:text-gold-dark">
            初めての方へ
          </Link>
          <Link href="/#shop-search" className="whitespace-nowrap hover:text-gold-dark">
            店舗を探す🔍
          </Link>
          <Link href="/jobs" className="whitespace-nowrap hover:text-gold-dark">
            求人一覧
          </Link>
          <Link href="/report" className="whitespace-nowrap hover:text-gold-dark">
            ブラック店報告
          </Link>
          <HeaderShopLink />
        </nav>
      </div>
    </header>
  );
}
