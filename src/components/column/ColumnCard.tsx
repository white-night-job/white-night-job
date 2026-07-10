import Link from "next/link";
import { ColumnThumbnail } from "@/components/column/ColumnThumbnail";
import type { ColumnArticle } from "@/data/column-articles";

type ColumnCardProps = {
  article: ColumnArticle;
  variant?: "default" | "top";
};

export function ColumnCard({ article, variant = "default" }: ColumnCardProps) {
  return (
    <article
      className={`column-premium-card flex h-full flex-col overflow-hidden ${
        variant === "top" ? "column-premium-card-top" : ""
      }`}
    >
      <Link href={`/column/${article.slug}`} className="block">
        <ColumnThumbnail
          title={article.title}
          tone={article.thumbnailTone}
          className="column-premium-thumb"
        />
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
