import Link from "next/link";
import { ColumnCard } from "@/components/column/ColumnCard";
import { COLUMN_ARTICLES, COLUMN_TOP_FEATURED_SLUGS } from "@/data/column-articles";

export function TopColumnSection() {
  const featured = COLUMN_TOP_FEATURED_SLUGS.map((slug) =>
    COLUMN_ARTICLES.find((article) => article.slug === slug),
  ).filter((article): article is NonNullable<typeof article> => Boolean(article));

  return (
    <section id="column" aria-labelledby="top-column-heading" className="column-top-section scroll-mt-24">
      <div className="column-top-heading-wrap">
        <div className="listing-panel-heading">
          <span className="listing-heading-line" aria-hidden />
          <h2 id="top-column-heading" className="listing-heading-text">
            コラム
          </h2>
          <span className="listing-heading-line" aria-hidden />
        </div>
        <Link href="/column" className="column-top-more">
          もっと見る →
        </Link>
      </div>

      <div className="column-top-carousel sm:hidden">
        <div className="listing-carousel-track">
          <div className="column-top-scroll">
            {featured.map((article) => (
              <div key={article.slug} className="column-top-scroll-item snap-start">
                <ColumnCard article={article} variant="top" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="hidden gap-5 sm:grid sm:grid-cols-2 lg:grid-cols-3">
        {featured.map((article) => (
          <ColumnCard key={article.slug} article={article} variant="top" />
        ))}
      </div>
    </section>
  );
}
