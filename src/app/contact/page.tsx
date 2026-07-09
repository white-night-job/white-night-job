import type { Metadata } from "next";
import Link from "next/link";
import { InfoPageLayout } from "@/components/InfoPageLayout";
import { buildPageMetadata } from "@/lib/seo";
import { SITE_FORMAL_NAME, SITE_LEGAL_INTRO } from "@/lib/site";

export const metadata: Metadata = buildPageMetadata(
  "お問い合わせ",
  `${SITE_FORMAL_NAME}へのお問い合わせ方法をご案内します。`,
  "/contact",
);

export default function ContactPage() {
  return (
    <InfoPageLayout
      title="お問い合わせ"
      description={`${SITE_LEGAL_INTRO}ご質問・ご相談は以下の方法でお受けしています。`}
      pathname="/contact"
      breadcrumbLabel="お問い合わせ"
    >
      <div className="space-y-4">
        <article className="rounded-2xl border border-gold/25 bg-white p-5 shadow-gold sm:p-6">
          <h2 className="font-serif text-lg font-semibold text-charcoal">
            求職者・一般のお問い合わせ
          </h2>
          <p className="mt-3 text-sm leading-7 text-charcoal/90">
            求人内容や店舗に関する不安、ブラック店舗の疑いがある場合は、
            <Link href="/report" className="text-gold-dark underline-offset-2 hover:underline">
              ブラック店舗報告フォーム
            </Link>
            よりご連絡ください。
          </p>
        </article>
        <article className="rounded-2xl border border-gold/25 bg-white p-5 shadow-gold sm:p-6">
          <h2 className="font-serif text-lg font-semibold text-charcoal">
            掲載店舗・掲載のお問い合わせ
          </h2>
          <p className="mt-3 text-sm leading-7 text-charcoal/90">
            求人掲載をご検討の店舗様は、
            <Link href="/for-shops" className="text-gold-dark underline-offset-2 hover:underline">
              店舗向け掲載案内
            </Link>
            ページのお問い合わせフォームをご利用ください。
          </p>
        </article>
        <article className="rounded-2xl border border-gold/25 bg-white p-5 shadow-gold sm:p-6">
          <h2 className="font-serif text-lg font-semibold text-charcoal">運営会社</h2>
          <p className="mt-3 text-sm leading-7 text-charcoal/90">
            合同会社COMSIA
            <br />
            詳細は
            <Link href="/company" className="text-gold-dark underline-offset-2 hover:underline">
              会社概要
            </Link>
            をご覧ください。
          </p>
        </article>
      </div>
    </InfoPageLayout>
  );
}
