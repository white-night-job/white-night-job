import type { Metadata } from "next";
import Link from "next/link";
import { InfoPageLayout } from "@/components/InfoPageLayout";
import { buildPageMetadata } from "@/lib/seo";
import { SITE_FORMAL_NAME, SITE_LEGAL_INTRO } from "@/lib/site";

export const metadata: Metadata = buildPageMetadata(
  "会社概要",
  `${SITE_FORMAL_NAME}の運営会社情報です。`,
  "/company",
);

const UPDATED_AT = "2026年7月9日";

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
          <p className="mt-4 text-sm leading-7 text-charcoal/90">合同会社COMSIA</p>
        </section>
        <section>
          <h2 className="border-b border-gold/20 pb-2 font-serif text-lg font-semibold text-charcoal">
            代表者
          </h2>
          <p className="mt-4 text-sm leading-7 text-charcoal/90">西東時雄</p>
        </section>
        <section>
          <h2 className="border-b border-gold/20 pb-2 font-serif text-lg font-semibold text-charcoal">
            所在地
          </h2>
          <p className="mt-4 text-sm leading-7 text-charcoal/90">
            〒063-0811 北海道札幌市西区琴似1条5丁目4-18細川ビル3階
          </p>
        </section>
        <section>
          <h2 className="border-b border-gold/20 pb-2 font-serif text-lg font-semibold text-charcoal">
            事業内容
          </h2>
          <p className="mt-4 text-sm leading-7 text-charcoal/90">
            {SITE_FORMAL_NAME}の運営、夜職求人の掲載・管理、掲載店舗向け支援サービスの提供
          </p>
        </section>
        <section>
          <h2 className="border-b border-gold/20 pb-2 font-serif text-lg font-semibold text-charcoal">
            お問い合わせ
          </h2>
          <p className="mt-4 text-sm leading-7 text-charcoal/90">
            お問い合わせは
            <Link href="/contact" className="text-gold-dark underline-offset-2 hover:underline">
              お問い合わせページ
            </Link>
            よりご連絡ください。
          </p>
        </section>
      </article>
    </InfoPageLayout>
  );
}
