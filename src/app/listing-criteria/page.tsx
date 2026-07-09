import type { Metadata } from "next";
import { InfoPageLayout } from "@/components/InfoPageLayout";
import { buildPageMetadata } from "@/lib/seo";
import { SITE_FORMAL_NAME, SITE_LEGAL_INTRO } from "@/lib/site";

export const metadata: Metadata = buildPageMetadata(
  "優良店掲載基準",
  `${SITE_FORMAL_NAME}の優良店掲載基準です。安心して働ける店舗のみを掲載するための審査方針をご説明します。`,
  "/listing-criteria",
);

const UPDATED_AT = "2026年7月9日";

const CRITERIA = [
  "法令を遵守し、適正な労働条件で募集を行っていること",
  "求人内容と実態に大きな乖離がないこと",
  "未払い・過度な罰金・不当なノルマ等のトラブル報告が継続していないこと",
  "応募者・在籍キャストへの対応が誠実であること",
  "虚偽の待遇表示や誇大広告を行っていないこと",
  "相談窓口への対応体制があること（当サイト方針に沿う場合）",
];

export default function ListingCriteriaPage() {
  return (
    <InfoPageLayout
      title="優良店掲載基準"
      description={`${SITE_LEGAL_INTRO}掲載店舗の選定にあたり、以下の観点を重視しています。`}
      pathname="/listing-criteria"
      breadcrumbLabel="優良店掲載基準"
      updatedAt={UPDATED_AT}
    >
      <article className="rounded-2xl border border-gold/25 bg-white p-5 shadow-gold sm:p-8">
        <h2 className="font-serif text-lg font-semibold text-charcoal">
          {SITE_FORMAL_NAME}の掲載方針
        </h2>
        <p className="mt-4 text-sm leading-7 text-charcoal/90">
          当サイトは、求職者が安心して体験入店・応募できる環境づくりを目的としています。そのため、通常の審査に加え、独自の基準で掲載可否を判断します。
        </p>
        <ul className="mt-6 space-y-3 text-sm leading-7 text-charcoal/90">
          {CRITERIA.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="text-gold-dark">・</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm leading-7 text-muted">
          審査結果の詳細や個別店舗の評価内容は開示しておりません。ブラック店舗の疑いがある場合は、報告フォームよりご連絡ください。
        </p>
      </article>
    </InfoPageLayout>
  );
}
