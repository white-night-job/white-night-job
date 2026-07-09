import Link from "next/link";
import { ColumnThumbnail } from "@/components/column/ColumnThumbnail";
import type { ColumnArticle } from "@/data/column-articles";

type ColumnCardProps = {
  article: ColumnArticle;
};

export function ColumnCard({ article }: ColumnCardProps) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-gold/45 bg-gradient-to-br from-white via-ivory to-champagne shadow-luxury transition-transform duration-300 hover:-translate-y-0.5">
      <Link href={`/column/${article.slug}`} className="block">
        <ColumnThumbnail title={article.title} tone={article.thumbnailTone} />
      </Link>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <p className="text-xs font-semibold tracking-wide text-gold-dark">
          {article.category}
        </p>
        <h2 className="mt-2 font-serif text-lg font-semibold leading-snug text-charcoal sm:text-xl">
          <Link
            href={`/column/${article.slug}`}
            className="hover:text-gold-dark"
          >
            {article.title}
          </Link>
        </h2>
        <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-muted">
          {article.description}
        </p>
        <p className="mt-4 text-xs text-muted">更新日：{article.updatedAt}</p>
      </div>
    </article>
  );
}
