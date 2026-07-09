import Link from "next/link";
import type { ReactNode } from "react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { buildWebPageJsonLd } from "@/lib/seo";
import { SITE_FORMAL_NAME, SITE_TAGLINE } from "@/lib/site";

const FOOTER_LINKS = [
  { href: "/terms", label: "利用規約" },
  { href: "/privacy", label: "プライバシーポリシー" },
  { href: "/legal", label: "特定商取引法に基づく表記" },
  { href: "/company", label: "会社概要" },
  { href: "/contact", label: "お問い合わせ" },
  { href: "/first-time-guide", label: "初めての方へ" },
  { href: "/listing-criteria", label: "優良店掲載基準" },
  { href: "/report", label: "ブラック店舗報告" },
  { href: "/faq", label: "よくある質問" },
  { href: "/cast-guide", label: "キャスト向けガイド" },
  { href: "/for-shops", label: "店舗向け掲載案内" },
] as const;

type InfoPageLayoutProps = {
  title: string;
  description: string;
  pathname: string;
  breadcrumbLabel: string;
  children: ReactNode;
  updatedAt?: string;
};

export function InfoPageLayout({
  title,
  description,
  pathname,
  breadcrumbLabel,
  children,
  updatedAt,
}: InfoPageLayoutProps) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <JsonLd data={buildWebPageJsonLd(title, description, pathname)} />
      <Breadcrumbs items={[{ label: breadcrumbLabel }]} />

      <header className="mb-8">
        <h1 className="font-serif text-2xl font-semibold text-charcoal sm:text-3xl">
          {title}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">{description}</p>
        {updatedAt && (
          <p className="mt-2 text-xs text-muted">最終更新日：{updatedAt}</p>
        )}
      </header>

      <div className="space-y-6">{children}</div>

      <footer className="mt-10 border-t border-gold/15 pt-6">
        <p className="text-sm leading-relaxed text-muted">{SITE_TAGLINE}</p>
        <p className="mt-2 text-xs text-muted">正式名称：{SITE_FORMAL_NAME}</p>
        <nav
          aria-label="関連ページ"
          className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted"
        >
          {FOOTER_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-gold-dark">
              {link.label}
            </Link>
          ))}
        </nav>
      </footer>
    </div>
  );
}
