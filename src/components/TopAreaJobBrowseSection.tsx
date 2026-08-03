import { PopularAreaJobTypeLinks } from "@/components/seo/PopularAreaJobTypeLinks";
import { SusukinoSeoLinks } from "@/components/seo/SusukinoSeoLinks";
import { luxuryPremiumCard } from "@/lib/luxury-styles";

/**
 * Crawlable area × job-type internal links for the homepage.
 * URLs must stay aligned with SEO landing pages under /sapporo/...
 */
export function TopAreaJobBrowseSection() {
  return (
    <section
      id="area-job-browse"
      aria-labelledby="area-job-browse-heading"
      className={`relative scroll-mt-20 overflow-hidden px-5 py-8 sm:px-8 sm:py-10 ${luxuryPremiumCard}`}
    >
      <div
        className="luxury-shimmer pointer-events-none absolute inset-0 opacity-40"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full bg-champagne/45 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-16 -left-12 h-44 w-44 rounded-full bg-gold-mid/15 blur-3xl"
        aria-hidden
      />

      <div className="relative">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.35em] text-gold-dark">
          Area & Job Type
        </p>
        <h2
          id="area-job-browse-heading"
          className="font-serif text-xl font-semibold text-gradient-gold sm:text-2xl"
        >
          札幌の夜職求人をエリア・職種から探す
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-muted sm:text-base sm:leading-8">
          エリアと職種から、札幌の夜職・体験入店求人を比較できます。
        </p>

        <div className="mt-6 space-y-6 rounded-2xl border border-gold/25 bg-white/90 p-4 shadow-luxury-sm sm:p-6">
          <SusukinoSeoLinks showPrefix={false} />
          <div className="border-t border-gold/15 pt-5">
            <PopularAreaJobTypeLinks showHeading={false} />
          </div>
        </div>
      </div>
    </section>
  );
}
