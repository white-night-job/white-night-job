import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ColumnArticleBody } from "@/components/column/ColumnArticleBody";
import { ColumnLineCta } from "@/components/column/ColumnLineCta";
import { ColumnRecommendedJobs } from "@/components/column/ColumnRecommendedJobs";
import { ColumnRelatedArticles } from "@/components/column/ColumnRelatedArticles";
import { ColumnTableOfContents } from "@/components/column/ColumnTableOfContents";
import { JsonLd } from "@/components/JsonLd";
import {
  COLUMN_ARTICLES,
  getColumnArticle,
  getRelatedArticles,
} from "@/data/column-articles";
import { buildArticleJsonLd, buildArticleMetadata } from "@/lib/seo";
import { SITE_FORMAL_NAME } from "@/lib/site";

type ColumnArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return COLUMN_ARTICLES.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: ColumnArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getColumnArticle(slug);
  if (!article) return {};

  return buildArticleMetadata(
    article.title,
    article.metaDescription,
    `/column/${article.slug}`,
  );
}

export default async function ColumnArticlePage({ params }: ColumnArticlePageProps) {
  const { slug } = await params;
  const article = getColumnArticle(slug);
  if (!article) notFound();

  const relatedArticles = getRelatedArticles(article.relatedSlugs);
  const pathname = `/column/${article.slug}`;

  return (
    <div className="column-article-shell mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <JsonLd
        data={buildArticleJsonLd({
          title: article.title,
          description: article.metaDescription,
          pathname,
          dateModified: article.updatedAtIso,
          category: article.category,
        })}
      />

      <Breadcrumbs
        items={[
          { label: "コラム", href: "/column" },
          { label: article.title },
        ]}
      />

      <header className="mb-8">
        <p className="text-xs font-semibold tracking-wide text-gold-dark">
          {article.category}
        </p>
        <h1 className="mt-2 font-serif text-2xl font-semibold text-charcoal sm:text-3xl">
          {article.title}
        </h1>
        <p className="mt-3 text-xs text-muted">更新日：{article.updatedAt}</p>
      </header>

      <div className="mb-8">
        <ColumnTableOfContents sections={article.sections} />
      </div>

      <ColumnArticleBody sections={article.sections} />

      <div className="mt-12 space-y-10 border-t border-gold/20 pt-10">
        <ColumnRecommendedJobs article={article} />
        <ColumnRelatedArticles articles={relatedArticles} />
        <ColumnLineCta />
      </div>

      <footer className="mt-10 border-t border-gold/15 pt-6">
        <p className="text-sm leading-relaxed text-muted">
          {SITE_FORMAL_NAME}では安心して働ける店舗のみ掲載しています。
        </p>
      </footer>
    </div>
  );
}
