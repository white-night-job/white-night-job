import type { Metadata } from "next";
import Link from "next/link";
import { InfoPageLayout } from "@/components/InfoPageLayout";
import { buildPageMetadata } from "@/lib/seo";
import { SITE_FORMAL_NAME, SITE_LEGAL_INTRO } from "@/lib/site";

export const metadata: Metadata = buildPageMetadata(
  "キャスト向けガイド",
  `${SITE_FORMAL_NAME}のキャスト向けガイド。体験入店・応募前の確認ポイントや安心して働くためのヒントをご紹介します。`,
  "/cast-guide",
);

const TIPS = [
  "体験入店前に、時給・ノルマ・罰金・送迎・衣装ルールを必ず確認する",
  "面接だけでも、無理にその場で入店を決めなくてよい",
  "不安があれば、相談窓口のある店舗を優先して検討する",
  "待遇タグやキャストの声を参考に、自分に合う環境か見極める",
  "トラブルがあれば、ブラック店舗報告フォームから連絡する",
];

export default function CastGuidePage() {
  return (
    <InfoPageLayout
      title="キャスト向けガイド"
      description={`${SITE_LEGAL_INTRO}キャスト・求職者の方が安心してお店選びをするためのガイドです。`}
      pathname="/cast-guide"
      breadcrumbLabel="キャスト向けガイド"
    >
      <article className="rounded-2xl border border-gold/25 bg-white p-5 shadow-gold sm:p-8">
        <h2 className="font-serif text-lg font-semibold text-charcoal">
          {SITE_FORMAL_NAME}でのお店選び
        </h2>
        <p className="mt-4 text-sm leading-7 text-charcoal/90">
          当サイトでは、審査済み店舗の求人を掲載しています。体験入店を含め、自分のペースで比較しながら進められるよう情報を整理しています。
        </p>
        <ul className="mt-6 space-y-3 text-sm leading-7 text-charcoal/90">
          {TIPS.map((tip) => (
            <li key={tip} className="flex gap-2">
              <span className="text-gold-dark">・</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm leading-7 text-charcoal/90">
          より詳しい案内は
          <Link href="/first-time-guide" className="text-gold-dark underline-offset-2 hover:underline">
            初めての方へ
          </Link>
          もあわせてご覧ください。
        </p>
      </article>
    </InfoPageLayout>
  );
}
