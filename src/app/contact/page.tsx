import type { Metadata } from "next";
import Link from "next/link";
import { InfoPageLayout } from "@/components/InfoPageLayout";
import {
  BUSINESS_ADDRESS_DISPLAY,
  BUSINESS_EMAIL,
  BUSINESS_HOURS_DISPLAY,
  BUSINESS_LEGAL_NAME,
  BUSINESS_PHONE_DISPLAY,
  BUSINESS_PHONE_TEL,
} from "@/lib/business";
import { buildPageMetadata } from "@/lib/seo";
import { SITE_FORMAL_NAME, SITE_LEGAL_INTRO } from "@/lib/site";

export const metadata: Metadata = buildPageMetadata(
  "お問い合わせ｜札幌の夜職求人サイト",
  "体入ホワイトナイト（White Night Job）へのお問い合わせ方法をご案内します。求人掲載・応募・掲載内容に関するご質問は、必要事項をご記入のうえお送りください。内容確認後、順次ご返信いたしますのでお気軽にご連絡ください。お急ぎの内容も、確認後できるだけ早くご案内できるよう対応します。",
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
            公式のお問い合わせ先
          </h2>
          <dl className="mt-4 space-y-3 text-sm leading-7 text-charcoal/90">
            <div>
              <dt className="font-medium text-charcoal">運営会社</dt>
              <dd className="mt-0.5">{BUSINESS_LEGAL_NAME}</dd>
            </div>
            <div>
              <dt className="font-medium text-charcoal">所在地</dt>
              <dd className="mt-0.5">{BUSINESS_ADDRESS_DISPLAY}</dd>
              <dd className="mt-1 text-muted">
                登記上の所在地です。来店対応の店舗・事務所はありません。
              </dd>
            </div>
            <div>
              <dt className="font-medium text-charcoal">電話番号</dt>
              <dd className="mt-0.5">
                <a
                  href={`tel:${BUSINESS_PHONE_TEL}`}
                  className="text-gold-dark underline-offset-2 hover:underline"
                >
                  {BUSINESS_PHONE_DISPLAY}
                </a>
              </dd>
            </div>
            <div>
              <dt className="font-medium text-charcoal">メール</dt>
              <dd className="mt-0.5">
                <a
                  href={`mailto:${BUSINESS_EMAIL}`}
                  className="text-gold-dark underline-offset-2 hover:underline"
                >
                  {BUSINESS_EMAIL}
                </a>
              </dd>
            </div>
            <div>
              <dt className="font-medium text-charcoal">受付時間</dt>
              <dd className="mt-0.5">{BUSINESS_HOURS_DISPLAY}</dd>
            </div>
          </dl>
          <p className="mt-4 text-sm leading-7 text-muted">
            詳細な会社情報は
            <Link
              href="/company"
              className="text-gold-dark underline-offset-2 hover:underline"
            >
              会社概要
            </Link>
            をご覧ください。
          </p>
        </article>

        <article className="rounded-2xl border border-gold/25 bg-white p-5 shadow-gold sm:p-6">
          <h2 className="font-serif text-lg font-semibold text-charcoal">
            求職者・一般のお問い合わせ
          </h2>
          <p className="mt-3 text-sm leading-7 text-charcoal/90">
            求人内容や店舗に関する不安、ブラック店舗の疑いがある場合は、
            <Link
              href="/report"
              className="text-gold-dark underline-offset-2 hover:underline"
            >
              ブラック店舗報告フォーム
            </Link>
            よりご連絡ください。その他のご相談は上記の公式電話・メールでも受け付けています。
          </p>
        </article>

        <article className="rounded-2xl border border-gold/25 bg-white p-5 shadow-gold sm:p-6">
          <h2 className="font-serif text-lg font-semibold text-charcoal">
            掲載店舗・掲載のお問い合わせ
          </h2>
          <p className="mt-3 text-sm leading-7 text-charcoal/90">
            求人掲載をご検討の店舗様は、
            <Link
              href="/for-shops"
              className="text-gold-dark underline-offset-2 hover:underline"
            >
              店舗向け掲載案内
            </Link>
            ページのお問い合わせフォーム、または上記の公式連絡先をご利用ください。
          </p>
        </article>
      </div>
    </InfoPageLayout>
  );
}
