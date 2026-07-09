import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { buildPageMetadata, buildWebPageJsonLd } from "@/lib/seo";
import { SITE_FORMAL_NAME, SITE_LEGAL_INTRO, SITE_TAGLINE } from "@/lib/site";

export const metadata: Metadata = buildPageMetadata(
  "利用規約",
  `${SITE_FORMAL_NAME}の利用規約ページです。求職者向け・掲載店舗向けの規約をご確認いただけます。`,
  "/terms",
);

export default function TermsPage() {
  const description = `${SITE_LEGAL_INTRO}利用規約は、利用者区分ごとに分かれています。該当する規約をご確認ください。`;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <JsonLd data={buildWebPageJsonLd("利用規約", description, "/terms")} />
      <Breadcrumbs items={[{ label: "利用規約" }]} />

      <header className="mb-8">
        <h1 className="font-serif text-2xl font-semibold text-charcoal sm:text-3xl">
          利用規約
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">{description}</p>
      </header>

      <section className="space-y-4 rounded-2xl border border-gold/25 bg-white p-5 shadow-gold sm:p-8">
        <Link
          href="/terms-user"
          className="block rounded-xl border border-gold/25 bg-ivory/40 px-4 py-4 transition hover:border-gold/40 hover:bg-ivory"
        >
          <p className="font-serif text-lg font-semibold text-charcoal">
            求職者向け利用規約
          </p>
          <p className="mt-1 text-sm text-muted">
            {SITE_FORMAL_NAME}における求人の閲覧・応募・相談・ブラック店舗報告など、求職者向けの利用条件です。
          </p>
        </Link>
        <Link
          href="/terms-shop"
          className="block rounded-xl border border-gold/25 bg-ivory/40 px-4 py-4 transition hover:border-gold/40 hover:bg-ivory"
        >
          <p className="font-serif text-lg font-semibold text-charcoal">
            掲載店舗向け利用規約
          </p>
          <p className="mt-1 text-sm text-muted">
            求人掲載・料金・ログイン情報管理・上位表示機能など、掲載店舗向けの利用条件です。
          </p>
        </Link>
      </section>

      <footer className="mt-8 border-t border-gold/15 pt-6">
        <p className="text-sm leading-relaxed text-muted">{SITE_TAGLINE}</p>
      </footer>
    </div>
  );
}
