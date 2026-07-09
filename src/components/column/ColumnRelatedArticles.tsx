import Link from "next/link";
import { ColumnThumbnail } from "@/components/column/ColumnThumbnail";
import type { ColumnArticle } from "@/data/column-articles";

type ColumnRelatedArticlesProps = {
  articles: ColumnArticle[];
};

export function ColumnRelatedArticles({ articles }: ColumnRelatedArticlesProps) {
  if (articles.length === 0) return null;

  return (
    <section aria-labelledby="related-articles-heading">
      <h2
        id="related-articles-heading"
        className="font-serif text-xl font-semibold text-charcoal sm:text-2xl"
      >
        関連記事
      </h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {articles.map((article) => (
          <article
            key={article.slug}
            className="overflow-hidden rounded-xl border border-gold/35 bg-white shadow-gold"
          >
            <Link href={`/column/${article.slug}`} className="block">
              <ColumnThumbnail
                title={article.title}
                tone={article.thumbnailTone}
                className="rounded-none aspect-[4/3]"
              />
            </Link>
            <div className="p-3">
              <p className="text-[11px] font-semibold text-gold-dark">
                {article.category}
              </p>
              <h3 className="mt-1 line-clamp-2 font-serif text-sm font-semibold leading-snug text-charcoal">
                <Link
                  href={`/column/${article.slug}`}
                  className="hover:text-gold-dark"
                >
                  {article.title}
                </Link>
              </h3>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
