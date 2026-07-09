import type { Metadata } from "next";
import { InfoPageLayout } from "@/components/InfoPageLayout";
import { buildPageMetadata } from "@/lib/seo";
import { SITE_FORMAL_NAME, SITE_LEGAL_INTRO } from "@/lib/site";

export const metadata: Metadata = buildPageMetadata(
  "よくある質問",
  `${SITE_FORMAL_NAME}に関するよくある質問（FAQ）です。体験入店・応募・掲載についての疑問にお答えします。`,
  "/faq",
);

const FAQ_ITEMS = [
  {
    q: `${SITE_FORMAL_NAME}とはどのようなサイトですか？`,
    a: "体験入店を含め、安心して働ける夜職求人だけを掲載する求人サイトです。審査済みの店舗情報を、わかりやすく比較できるよう掲載しています。",
  },
  {
    q: "体験入店（体入）でも利用できますか？",
    a: "はい。体験入店を検討している方も、各店舗の条件を確認のうえ、LINEや電話で相談・応募いただけます。",
  },
  {
    q: "応募はどのように行いますか？",
    a: "各求人ページから掲載店舗へ直接ご連絡ください。当サイトは求人掲載と応募導線の提供を行い、雇用契約の当事者ではありません。",
  },
  {
    q: "ブラック店舗を見つけた場合は？",
    a: "ブラック店舗報告フォームよりご連絡ください。内容を確認し、必要に応じて掲載内容の見直し等を行います。",
  },
  {
    q: "店舗掲載を希望する場合は？",
    a: "店舗向け掲載案内ページをご覧のうえ、お問い合わせフォームよりご連絡ください。",
  },
];

export default function FaqPage() {
  return (
    <InfoPageLayout
      title="よくある質問（FAQ）"
      description={`${SITE_LEGAL_INTRO}利用者の皆さまから寄せられる質問をまとめています。`}
      pathname="/faq"
      breadcrumbLabel="よくある質問"
    >
      <div className="space-y-4">
        {FAQ_ITEMS.map((item) => (
          <article
            key={item.q}
            className="rounded-2xl border border-gold/25 bg-white p-5 shadow-gold sm:p-6"
          >
            <h2 className="font-serif text-base font-semibold text-charcoal sm:text-lg">
              {item.q}
            </h2>
            <p className="mt-3 text-sm leading-7 text-charcoal/90">{item.a}</p>
          </article>
        ))}
      </div>
    </InfoPageLayout>
  );
}
