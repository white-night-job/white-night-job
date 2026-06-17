import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

const footerSections = [
  {
    title: "White Night Job",
    links: [
      { href: "/#first-time-guide", label: "初めての方へ" },
      { href: "/jobs", label: "求人一覧" },
      { href: "/#shop-search", label: "店舗を探す" },
      { href: "/report", label: "ブラック店報告" },
      { href: "/shop-login", label: "店舗ログイン" },
    ],
  },
  {
    title: "掲載店舗向け",
    links: [
      { href: "/shop-login", label: "店舗ログイン" },
      { href: "/terms-shop", label: "利用規約（掲載店舗）" },
      { href: "/legal", label: "特定商取引法に基づく表記" },
    ],
  },
  {
    title: "サポート",
    links: [
      { href: "/terms-user", label: "利用規約（求職者）" },
      { href: "/privacy", label: "プライバシーポリシー" },
      { href: "/report", label: "ブラック店報告" },
      { href: "/report", label: "お問い合わせ" },
    ],
  },
] as const;

const linkClassName =
  "text-sm text-white/85 transition-colors hover:text-gold-light";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-gold/25 bg-gradient-to-b from-charcoal to-[#12100c]">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <nav
          aria-label="フッターナビゲーション"
          className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6"
        >
          {footerSections.map((section) => (
            <div key={section.title}>
              <h2 className="font-serif text-sm font-semibold tracking-wide text-gold-light">
                {section.title}
              </h2>
              <ul className="mt-3 space-y-2">
                {section.links.map((link) => (
                  <li key={`${section.title}-${link.label}`}>
                    <Link href={link.href} className={linkClassName}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <p className="mt-8 border-t border-gold/15 pt-5 text-center text-xs text-white/50">
          © {SITE_NAME}
        </p>
      </div>
    </footer>
  );
}
