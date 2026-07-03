import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "掲載をご検討の方へ",
  description: `${SITE_NAME}への求人掲載をご検討の店舗様向けのご案内ページです。`,
};

export default function ForShopsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-8">
        <Link
          href="/"
          className="mb-4 inline-block text-sm text-muted hover:text-gold-dark"
        >
          ← トップページへ
        </Link>
        <h1 className="font-serif text-2xl font-semibold text-charcoal sm:text-3xl">
          掲載をご検討の方へ
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          {SITE_NAME}への求人掲載をご検討中の店舗様向けのご案内ページです。
          掲載プランやお申し込み方法などの詳細は、今後こちらに掲載予定です。
        </p>
      </div>

      <section className="space-y-4 rounded-2xl border border-gold/25 bg-white p-5 shadow-gold sm:p-8">
        <p className="text-sm leading-relaxed text-charcoal">
          優良認定店のみを掲載する当サイトでは、安心して働ける環境づくりに共感いただける店舗様のご掲載をお待ちしております。
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/shop-login"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-gold/50 bg-gradient-to-r from-gold-dark via-gold to-gold-mid px-5 text-sm font-semibold text-charcoal"
          >
            店舗様ログイン
          </Link>
          <Link
            href="/terms-shop"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-gold/40 bg-ivory px-5 text-sm font-semibold text-gold-dark"
          >
            掲載店舗向け利用規約
          </Link>
        </div>
      </section>
    </div>
  );
}
