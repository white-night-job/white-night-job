import type { Metadata } from "next";
import { ColumnCard } from "@/components/column/ColumnCard";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import {
  COLUMN_ARTICLES,
  COLUMN_LIST_DESCRIPTION,
  COLUMN_LIST_TITLE,
} from "@/data/column-articles";
import { buildPageMetadata, buildWebPageJsonLd } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata(
  COLUMN_LIST_TITLE,
  COLUMN_LIST_DESCRIPTION,
  "/column",
);

export default function ColumnListPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <JsonLd
        data={buildWebPageJsonLd(
          COLUMN_LIST_TITLE,
          COLUMN_LIST_DESCRIPTION,
          "/column",
        )}
      />
      <Breadcrumbs items={[{ label: "コラム" }]} />

      <header className="mb-8">
        <h1 className="font-serif text-2xl font-semibold text-charcoal sm:text-3xl">
          {COLUMN_LIST_TITLE}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
          {COLUMN_LIST_DESCRIPTION}
        </p>
      </header>

      <div className="column-list-grid grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {COLUMN_ARTICLES.map((article) => (
          <ColumnCard key={article.slug} article={article} />
        ))}
      </div>
    </div>
  );
}
