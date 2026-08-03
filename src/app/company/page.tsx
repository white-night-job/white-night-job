import type { Metadata } from "next";
import Link from "next/link";
import { InfoPageLayout } from "@/components/InfoPageLayout";
import {
  BUSINESS_ADDRESS_DISPLAY,
  BUSINESS_AREA_SERVED,
  BUSINESS_DESCRIPTION,
  BUSINESS_EMAIL,
  BUSINESS_HOURS_DISPLAY,
  BUSINESS_LEGAL_NAME,
  BUSINESS_PHONE_DISPLAY,
  BUSINESS_PHONE_TEL,
  BUSINESS_REPRESENTATIVE,
} from "@/lib/business";
import { buildPageMetadata } from "@/lib/seo";
import { SITE_FORMAL_NAME, SITE_LEGAL_INTRO } from "@/lib/site";

export const metadata: Metadata = buildPageMetadata(
  "会社概要｜運営情報",
  "体入ホワイトナイト（White Night Job）の運営会社情報です。事業者名・所在地・連絡先など、札幌の夜職求人サイトを安心してご利用いただくための基本情報をわかりやすく掲載しています。サイト運営方針の確認にもご活用ください。運営主体を明示し、求職者と店舗双方が安心して利用できる体制を整えています。",
  "/company",
);

const UPDATED_AT = "2026年8月1日";

export default function CompanyPage() {
  return (
    <InfoPageLayout
      title="会社概要"
      description={`${SITE_LEGAL_INTRO}運営会社およびサービス概要を掲載しています。`}
      pathname="/company"
      breadcrumbLabel="会社概要"
      updatedAt={UPDATED_AT}
    >
      <article className="space-y-6 rounded-2xl border border-gold/25 bg-white p-5 shadow-gold sm:p-8">
        <section>
          <h2 className="border-b border-gold/20 pb-2 font-serif text-lg font-semibold text-charcoal">
            サービス名称
          </h2>
          <p className="mt-4 text-sm leading-7 text-charcoal/90">{SITE_FORMAL_NAME}</p>
        </section>
        <section>
          <h2 className="border-b border-gold/20 pb-2 font-serif text-lg font-semibold text-charcoal">
            運営会社
          </h2>
          <p className="mt-4 text-sm leading-7 text-charcoal/90">{BUSINESS_LEGAL_NAME}</p>
        </section>
        <section>
          <h2 className="border-b border-gold/20 pb-2 font-serif text-lg font-semibold text-charcoal">
            代表者
          </h2>
          <p className="mt-4 text-sm leading-7 text-charcoal/90">
            {BUSINESS_REPRESENTATIVE}
          </p>
        </section>
        <section>
          <h2 className="border-b border-gold/20 pb-2 font-serif text-lg font-semibold text-charcoal">
            所在地
          </h2>
          <p className="mt-4 text-sm leading-7 text-charcoal/90">
            {BUSINESS_ADDRESS_DISPLAY}
          </p>
          <p className="mt-2 text-sm leading-7 text-muted">
            登記上の所在地です。来店対応の店舗・事務所はありません。
          </p>
        </section>
        <section>
          <h2 className="border-b border-gold/20 pb-2 font-serif text-lg font-semibold text-charcoal">
            電話番号
          </h2>
          <p className="mt-4 text-sm leading-7 text-charcoal/90">
            <a
              href={`tel:${BUSINESS_PHONE_TEL}`}
              className="text-gold-dark underline-offset-2 hover:underline"
            >
              {BUSINESS_PHONE_DISPLAY}
            </a>
          </p>
        </section>
        <section>
          <h2 className="border-b border-gold/20 pb-2 font-serif text-lg font-semibold text-charcoal">
            問い合わせメール
          </h2>
          <p className="mt-4 text-sm leading-7 text-charcoal/90">
            <a
              href={`mailto:${BUSINESS_EMAIL}`}
              className="text-gold-dark underline-offset-2 hover:underline"
            >
              {BUSINESS_EMAIL}
            </a>
          </p>
        </section>
        <section>
          <h2 className="border-b border-gold/20 pb-2 font-serif text-lg font-semibold text-charcoal">
            受付時間
          </h2>
          <p className="mt-4 text-sm leading-7 text-charcoal/90">
            {BUSINESS_HOURS_DISPLAY}
          </p>
          <p className="mt-2 text-sm leading-7 text-muted">
            お問い合わせの受付時間です。
          </p>
        </section>
        <section>
          <h2 className="border-b border-gold/20 pb-2 font-serif text-lg font-semibold text-charcoal">
            対応エリア
          </h2>
          <p className="mt-4 text-sm leading-7 text-charcoal/90">
            {BUSINESS_AREA_SERVED.join("、")}
          </p>
        </section>
        <section>
          <h2 className="border-b border-gold/20 pb-2 font-serif text-lg font-semibold text-charcoal">
            事業内容
          </h2>
          <p className="mt-4 text-sm leading-7 text-charcoal/90">
            {BUSINESS_DESCRIPTION}
          </p>
        </section>
        <section>
          <h2 className="border-b border-gold/20 pb-2 font-serif text-lg font-semibold text-charcoal">
            お問い合わせ
          </h2>
          <p className="mt-4 text-sm leading-7 text-charcoal/90">
            お問い合わせは
            <Link
              href="/contact"
              className="text-gold-dark underline-offset-2 hover:underline"
            >
              お問い合わせページ
            </Link>
            よりご連絡ください。
          </p>
        </section>
      </article>
    </InfoPageLayout>
  );
}
