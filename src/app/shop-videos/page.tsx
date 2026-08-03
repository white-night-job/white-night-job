import type { Metadata } from "next";
import Link from "next/link";
import { InfoPageLayout } from "@/components/InfoPageLayout";
import { buildPageMetadata } from "@/lib/seo";
import { SITE_FORMAL_NAME } from "@/lib/site";

export const metadata: Metadata = buildPageMetadata(
  "店内動画で雰囲気を確認｜札幌の夜職求人",
  "体入ホワイトナイトでは、店内の雰囲気が分かる動画を掲載している店舗があります。札幌の夜職・体験入店求人へ応募する前に、お店の空気感や接客のイメージを事前に確認でき、ミスマッチを減らしやすいのが特長です。写真だけでは伝わりにくい店内の空気感を、動画で補完できます。",
  "/shop-videos",
);

export default function ShopVideosPage() {
  return (
    <InfoPageLayout
      title="店内動画"
      description="写真だけでは伝わりにくい店内の雰囲気を、動画で事前にチェックできます。"
      pathname="/shop-videos"
      breadcrumbLabel="店内動画"
    >
      <article className="rounded-2xl border border-gold/25 bg-white p-5 shadow-gold sm:p-8">
        <h2 className="font-serif text-lg font-semibold text-charcoal">
          お店の雰囲気を、動画で確認
        </h2>
        <p className="mt-4 text-sm leading-7 text-charcoal/90">
          求人詳細ページでは、店内の様子が分かる動画を掲載している店舗があります。
          照明や座席の雰囲気、スタッフの雰囲気など、実際に近いイメージを持ってから応募・相談できます。
        </p>
        <ul className="mt-6 space-y-3 text-sm leading-7 text-charcoal/90">
          <li className="flex gap-2">
            <span className="text-gold-dark">・</span>
            <span>店内の雰囲気を事前にイメージできる</span>
          </li>
          <li className="flex gap-2">
            <span className="text-gold-dark">・</span>
            <span>写真とあわせて比較検討しやすい</span>
          </li>
          <li className="flex gap-2">
            <span className="text-gold-dark">・</span>
            <span>気になる店舗は求人ページから詳しく確認</span>
          </li>
        </ul>
        <Link
          href="/jobs"
          className="mt-8 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-gradient-to-b from-[#f5ede0] via-[#d4bc8e] to-[#a8894a] text-sm font-bold text-charcoal shadow-gold sm:w-auto sm:px-8"
        >
          求人一覧を見る
        </Link>
      </article>
    </InfoPageLayout>
  );
}
