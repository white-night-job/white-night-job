import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-gold/20 bg-white">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <nav className="flex flex-wrap gap-4 text-sm text-muted">
          <Link href="/" className="hover:text-gold-dark">
            求人一覧
          </Link>
          <Link href="/report" className="hover:text-gold-dark">
            ブラック店報告
          </Link>
          <Link href="/terms-user" className="hover:text-gold-dark">
            利用規約（求職者）
          </Link>
          <Link href="/terms-shop" className="hover:text-gold-dark">
            利用規約（掲載店舗）
          </Link>
          <Link href="/privacy" className="hover:text-gold-dark">
            プライバシーポリシー
          </Link>
          <Link href="/legal" className="hover:text-gold-dark">
            特定商取引法に基づく表記
          </Link>
          <Link href="/admin" className="hover:text-gold-dark">
            求人管理
          </Link>
        </nav>
        <p className="mt-6 text-xs text-muted">© {new Date().getFullYear()} {SITE_NAME}</p>
      </div>
    </footer>
  );
}
