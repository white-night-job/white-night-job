import Link from "next/link";
import { luxuryPremiumCard } from "@/lib/luxury-styles";
import { SITE_FORMAL_NAME } from "@/lib/site";

export function ColumnLineCta() {
  return (
    <section
      aria-labelledby="column-line-cta-heading"
      className={`px-5 py-6 sm:px-6 sm:py-8 ${luxuryPremiumCard}`}
    >
      <h2
        id="column-line-cta-heading"
        className="font-serif text-lg font-semibold text-charcoal sm:text-xl"
      >
        LINEで相談する
      </h2>
      <p className="mt-3 text-sm leading-7 text-charcoal/90 sm:text-base sm:leading-8">
        {SITE_FORMAL_NAME}掲載店舗の多くは、LINEで体験入店前の相談を受け付けています。
        気になる求人の詳細ページから、お店に直接メッセージを送れます。
      </p>
      <Link
        href="/jobs"
        className="btn-gold-metal relative mt-5 inline-flex min-h-11 items-center justify-center rounded-full px-6 text-sm font-semibold text-charcoal"
      >
        求人を探してLINE相談する
      </Link>
    </section>
  );
}
