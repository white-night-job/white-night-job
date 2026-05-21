import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-gold/20 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:h-16 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-gold bg-gradient-to-br from-gold-light to-gold text-xs font-bold text-white">
            WN
          </span>
          <span className="font-serif text-lg font-semibold text-charcoal sm:text-xl">
            {SITE_NAME}
          </span>
        </Link>
        <nav className="flex gap-4 text-xs font-medium text-muted sm:gap-6 sm:text-sm">
          <Link href="/" className="hover:text-gold-dark">
            求人一覧
          </Link>
          <Link href="/report" className="hover:text-gold-dark">
            ブラック店報告
          </Link>
        </nav>
      </div>
    </header>
  );
}
