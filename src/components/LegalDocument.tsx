import Link from "next/link";
import type { ReactNode } from "react";
import { BackToApplyButton } from "@/components/BackToApplyButton";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { buildWebPageJsonLd } from "@/lib/seo";
import { SITE_FORMAL_NAME, SITE_TAGLINE } from "@/lib/site";

export type LegalSection = {
  id: string;
  title: string;
  content: ReactNode;
};

type LegalDocumentProps = {
  title: string;
  description: string;
  updatedAt: string;
  pathname: string;
  breadcrumbLabel: string;
  sections: LegalSection[];
  showBackToApply?: boolean;
};

const FOOTER_LINKS = [
  { href: "/terms", label: "利用規約" },
  { href: "/terms-user", label: "求職者向け利用規約" },
  { href: "/terms-shop", label: "掲載店舗向け利用規約" },
  { href: "/privacy", label: "プライバシーポリシー" },
  { href: "/legal", label: "特定商取引法に基づく表記" },
  { href: "/company", label: "会社概要" },
  { href: "/contact", label: "お問い合わせ" },
  { href: "/report", label: "ブラック店舗報告" },
] as const;

export function LegalDocument({
  title,
  description,
  updatedAt,
  pathname,
  breadcrumbLabel,
  sections,
  showBackToApply = false,
}: LegalDocumentProps) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <JsonLd data={buildWebPageJsonLd(title, description, pathname)} />
      {showBackToApply ? <BackToApplyButton /> : null}
      <Breadcrumbs items={[{ label: breadcrumbLabel }]} />

      <header className="mb-8">
        <h1 className="font-serif text-2xl font-semibold text-charcoal sm:text-3xl">
          {title}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">{description}</p>
        <p className="mt-2 text-xs text-muted">最終更新日：{updatedAt}</p>
      </header>

      <article className="space-y-8 rounded-2xl border border-gold/25 bg-white p-5 shadow-gold sm:p-8">
        {sections.map((section) => (
          <section key={section.id} id={section.id} className="scroll-mt-24">
            <h2 className="border-b border-gold/20 pb-2 font-serif text-lg font-semibold text-charcoal sm:text-xl">
              {section.title}
            </h2>
            <div className="mt-4 space-y-3 text-sm leading-7 text-charcoal/90">
              {section.content}
            </div>
          </section>
        ))}
      </article>

      <footer className="mt-8 border-t border-gold/15 pt-6">
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
