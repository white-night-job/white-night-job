import Link from "next/link";
import {
  BUSINESS_ADDRESS_DISPLAY,
  BUSINESS_EMAIL,
  BUSINESS_HOURS_DISPLAY,
  BUSINESS_LEGAL_NAME,
  BUSINESS_MAPS_SEARCH_URL,
  BUSINESS_PHONE_DISPLAY,
  BUSINESS_PHONE_TEL,
} from "@/lib/business";
import {
  SITE_BRAND_JA,
  SITE_FORMAL_NAME,
  SITE_TAGLINE,
} from "@/lib/site";

const footerSections = [
  {
    title: SITE_FORMAL_NAME,
    links: [
      { href: "/column", label: "コラム" },
      { href: "/first-time-guide", label: "初めての方へ" },
      { href: "/cast-guide", label: "キャスト向けガイド" },
      { href: "/#about-brand", label: `${SITE_BRAND_JA}とは` },
      { href: "/jobs", label: "求人一覧" },
      { href: "/sapporo/susukino", label: "すすきのの夜職求人" },
      { href: "/#shop-search", label: "店舗を探す" },
      { href: "/faq", label: "よくある質問" },
    ],
  },
  {
    title: "掲載店舗向け",
    links: [
      { href: "/for-shops", label: "店舗向け掲載案内" },
      { href: "/shop-login", label: "店舗ログイン" },
      { href: "/terms-shop", label: "利用規約（掲載店舗）" },
      { href: "/legal", label: "特定商取引法に基づく表記" },
    ],
  },
  {
    title: "サポート",
    links: [
      { href: "/contact", label: "お問い合わせ" },
      { href: "/report", label: "ブラック店舗報告" },
      { href: "/company", label: "会社概要" },
      { href: "/terms", label: "利用規約" },
      { href: "/terms-user", label: "利用規約（求職者）" },
      { href: "/privacy", label: "プライバシーポリシー" },
    ],
  },
] as const;

const linkClassName =
  "text-sm text-white/85 transition-colors hover:text-gold-light";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-gold/35 bg-gradient-to-b from-charcoal to-[#12100c]">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <p className="mb-6 text-center text-sm leading-7 text-white/75">
          {SITE_TAGLINE}
        </p>

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

        <div className="mt-8 border-t border-gold/15 pt-5 text-sm leading-7 text-white/70">
          <p className="font-medium text-gold-light">{BUSINESS_LEGAL_NAME}</p>
          <p className="mt-1">{BUSINESS_ADDRESS_DISPLAY}</p>
          <p className="mt-1">
            電話：
            <a
              href={`tel:${BUSINESS_PHONE_TEL}`}
              className="text-white/85 underline-offset-2 hover:text-gold-light hover:underline"
            >
              {BUSINESS_PHONE_DISPLAY}
            </a>
            <span className="mx-2 text-white/35" aria-hidden>
              /
            </span>
            メール：
            <a
              href={`mailto:${BUSINESS_EMAIL}`}
              className="text-white/85 underline-offset-2 hover:text-gold-light hover:underline"
            >
              {BUSINESS_EMAIL}
            </a>
          </p>
          <p className="mt-1">営業時間：{BUSINESS_HOURS_DISPLAY}</p>
          <p className="mt-2">
            <a
              href={BUSINESS_MAPS_SEARCH_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold-light underline-offset-2 hover:underline"
            >
              Googleマップで所在地を見る
            </a>
            <span className="mx-2 text-white/35" aria-hidden>
              /
            </span>
            <Link
              href="/company"
              className="text-gold-light underline-offset-2 hover:underline"
            >
              会社概要
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-white/50">
          © {SITE_FORMAL_NAME}
        </p>
      </div>
    </footer>
  );
}
