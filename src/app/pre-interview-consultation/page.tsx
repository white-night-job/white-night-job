import type { Metadata } from "next";
import Link from "next/link";
import { InfoPageLayout } from "@/components/InfoPageLayout";
import { buildPageMetadata } from "@/lib/seo";
import { SITE_FORMAL_NAME } from "@/lib/site";

export const metadata: Metadata = buildPageMetadata(
  "面接前相談受付",
  `${SITE_FORMAL_NAME}では、掲載店舗すべてで面接前の相談を受け付けています。無理な勧誘を避け、安心して話を聞けます。`,
  "/pre-interview-consultation",
);

export default function PreInterviewConsultationPage() {
  return (
    <InfoPageLayout
      title="面接前相談受付"
      description="「まずは話だけ聞きたい」という方も歓迎。掲載店舗すべてで面接前の相談窓口をご用意しています。"
      pathname="/pre-interview-consultation"
      breadcrumbLabel="面接前相談受付"
    >
      <article className="rounded-2xl border border-gold/25 bg-white p-5 shadow-gold sm:p-8">
        <h2 className="font-serif text-lg font-semibold text-charcoal">
          面接の前に、気軽に相談できます
        </h2>
        <p className="mt-4 text-sm leading-7 text-charcoal/90">
          「面接に行ったらそのまま入店扱いになってしまった…」といった不安を減らすため、
          {SITE_FORMAL_NAME}では全掲載店舗に相談受付を設けています。
        </p>
        <ul className="mt-6 space-y-3 text-sm leading-7 text-charcoal/90">
          <li className="flex gap-2">
            <span className="text-gold-dark">・</span>
            <span>時給・ノルマ・シフトなど、気になる条件を事前に確認</span>
          </li>
          <li className="flex gap-2">
            <span className="text-gold-dark">・</span>
            <span>無理にその場で決めなくても大丈夫</span>
          </li>
          <li className="flex gap-2">
            <span className="text-gold-dark">・</span>
            <span>求人ページのLINE相談から、店舗へ直接メッセージ可能</span>
          </li>
        </ul>
        <Link
          href="/jobs"
          className="mt-8 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-gradient-to-b from-[#f5ede0] via-[#d4bc8e] to-[#a8894a] text-sm font-bold text-charcoal shadow-gold sm:w-auto sm:px-8"
        >
          相談できるお店を探す
        </Link>
      </article>
    </InfoPageLayout>
  );
}
