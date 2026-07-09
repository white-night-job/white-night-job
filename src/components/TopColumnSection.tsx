import Link from "next/link";
import { ColumnCard } from "@/components/column/ColumnCard";
import { luxuryPremiumHeading } from "@/lib/luxury-styles";
import { COLUMN_ARTICLES, COLUMN_TOP_FEATURED_SLUGS } from "@/data/column-articles";

export function TopColumnSection() {
  const featured = COLUMN_TOP_FEATURED_SLUGS.map((slug) =>
    COLUMN_ARTICLES.find((article) => article.slug === slug),
  ).filter((article): article is NonNullable<typeof article> => Boolean(article));

  return (
    <section id="column" aria-labelledby="top-column-heading" className="scroll-mt-24">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <h2 id="top-column-heading" className={luxuryPremiumHeading}>
          コラム
        </h2>
        <Link
          href="/column"
          className="text-sm font-medium text-gold-dark underline-offset-2 hover:underline"
        >
          もっと見る →
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {featured.map((article) => (
          <ColumnCard key={article.slug} article={article} />
        ))}
      </div>
    </section>
  );
}
