import type { Metadata } from "next";
import Link from "next/link";
import { InfoPageLayout } from "@/components/InfoPageLayout";
import { buildPageMetadata } from "@/lib/seo";
import { SITE_FORMAL_NAME } from "@/lib/site";

export const metadata: Metadata = buildPageMetadata(
  "担当者紹介",
  `${SITE_FORMAL_NAME}では、採用担当者の顔写真やメッセージを掲載。どんな人と話すのか事前に確認できます。`,
  "/staff-intro",
);

export default function StaffIntroPage() {
  return (
    <InfoPageLayout
      title="担当者紹介"
      description="面接や相談の前に、採用担当者の雰囲気を知っておくと安心です。"
      pathname="/staff-intro"
      breadcrumbLabel="担当者紹介"
    >
      <article className="rounded-2xl border border-gold/25 bg-white p-5 shadow-gold sm:p-8">
        <h2 className="font-serif text-lg font-semibold text-charcoal">
          どんな人と話すのか、事前に分かります
        </h2>
        <p className="mt-4 text-sm leading-7 text-charcoal/90">
          求人詳細ページでは、採用担当者の顔写真・お名前・メッセージを掲載している店舗があります。
          「どんな人が対応してくれるのか」が分かると、相談や面接のハードルが下がります。
        </p>
        <ul className="mt-6 space-y-3 text-sm leading-7 text-charcoal/90">
          <li className="flex gap-2">
            <span className="text-gold-dark">・</span>
            <span>担当者の顔写真・役職を確認できる</span>
          </li>
          <li className="flex gap-2">
            <span className="text-gold-dark">・</span>
            <span>店舗からのメッセージで雰囲気を把握</span>
          </li>
          <li className="flex gap-2">
            <span className="text-gold-dark">・</span>
            <span>求人ページからそのままLINE相談へ進めます</span>
          </li>
        </ul>
        <Link
          href="/jobs"
          className="mt-8 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-gradient-to-b from-[#f5ede0] via-[#d4bc8e] to-[#a8894a] text-sm font-bold text-charcoal shadow-gold sm:w-auto sm:px-8"
        >
          担当者付きの求人を見る
        </Link>
      </article>
    </InfoPageLayout>
  );
}
