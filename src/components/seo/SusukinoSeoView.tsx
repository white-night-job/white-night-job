import Link from "next/link";
import { JobCard } from "@/components/JobCard";
import { JsonLd } from "@/components/JsonLd";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import {
  buildCollectionPageJsonLd,
  buildFaqPageJsonLd,
  buildJobPostingItemListJsonLd,
  buildWebPageJsonLd,
  type BreadcrumbItem,
} from "@/lib/seo";
import type { SeoJobsPageResult } from "@/lib/seo-area-jobs";
import {
  RELATED_AREA_LINKS,
  SUSUKINO_BENEFIT_LINKS,
  SUSUKINO_JOB_TYPE_PAGES,
  type SusukinoJobTypePage,
} from "@/lib/susukino-seo";
import {
  getAreaJobTypeColumnLinks,
  type SeoColumnLink,
} from "@/lib/seo-area-job-type-content";

type FaqItem = { question: string; answer: string };

type SusukinoSeoViewProps = {
  pathname: string;
  title: string;
  description: string;
  h1: string;
  intro: readonly string[];
  beginnerGuide: readonly string[];
  faqs: readonly FaqItem[];
  jobsResult: SeoJobsPageResult;
  breadcrumbLabel: string;
  jobTypePage?: SusukinoJobTypePage;
  showJobTypeLinks?: boolean;
  columnLinks?: SeoColumnLink[];
  contentSections?: Array<{ heading: string; paragraphs: readonly string[] }>;
  faqHeading?: string;
};

function pageHref(basePath: string, page: number) {
  if (page <= 1) return basePath;
  return `${basePath}?page=${page}`;
}

export function SusukinoSeoView({
  pathname,
  title,
  description,
  h1,
  intro,
  beginnerGuide,
  faqs,
  jobsResult,
  breadcrumbLabel,
  jobTypePage,
  showJobTypeLinks = true,
  columnLinks,
  contentSections,
  faqHeading = "よくある質問",
}: SusukinoSeoViewProps) {
  const { jobs, page, total, totalPages } = jobsResult;
  const listHeading = jobTypePage
    ? `公開中の${jobTypePage.displayName}求人`
    : "公開中のすすきの求人";
  const relatedColumns =
    columnLinks ??
    jobTypePage?.columnLinks ??
    getAreaJobTypeColumnLinks({
      areaKey: "すすきの",
      jobTypeSlug:
        jobTypePage?.slug === "girlsbar" ? "girls-bar" : jobTypePage?.slug,
    });
  const sections = contentSections ?? jobTypePage?.contentSections;
  const resolvedFaqHeading = faqHeading ?? jobTypePage?.faqHeading ?? "よくある質問";

  const breadcrumbItems: BreadcrumbItem[] = jobTypePage
    ? [
        { label: "札幌", href: "/jobs" },
        {
          label: "すすきの",
          href: "/sapporo/susukino",
        },
        {
          label:
            jobTypePage.slug === "girlsbar"
              ? "ガルバ・ガールズバー求人"
              : breadcrumbLabel,
        },
      ]
    : [
        { label: "札幌", href: "/jobs" },
        { label: "すすきのの夜職求人" },
      ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      {jobTypePage ? (
        <JsonLd
          data={buildCollectionPageJsonLd({
            name: title,
            description,
            pathname,
            jobs,
            breadcrumbs: breadcrumbItems,
          })}
        />
      ) : (
        <>
          <JsonLd data={buildWebPageJsonLd(title, description, pathname)} />
          {jobs.length > 0 && (
            <JsonLd
              data={buildJobPostingItemListJsonLd(jobs, {
                name: listHeading,
                pathname,
              })}
            />
          )}
        </>
      )}
      <JsonLd data={buildFaqPageJsonLd([...faqs])} />

      <Breadcrumbs
        items={breadcrumbItems}
        includeJsonLd
      />

      <header className="mt-4">
        <h1 className="font-serif text-2xl font-semibold text-charcoal sm:text-3xl">
          {h1}
        </h1>
        <div className="mt-4 space-y-3 text-sm leading-7 text-charcoal sm:text-base sm:leading-8">
          {intro.map((paragraph) => (
            <p key={paragraph.slice(0, 24)}>{paragraph}</p>
          ))}
        </div>
      </header>

      <section className="mt-10" aria-labelledby="susukino-jobs">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2
              id="susukino-jobs"
              className="font-serif text-xl font-semibold text-charcoal"
            >
              {listHeading}
            </h2>
            <p className="mt-1 text-sm text-muted">
              公開中の求人のみ表示しています（{total}件）
            </p>
          </div>
          <Link
            href={`/jobs?district=${encodeURIComponent("すすきの")}${
              jobTypePage
                ? `&jobType=${encodeURIComponent(jobTypePage.jobType)}`
                : ""
            }`}
            className="text-sm font-medium text-gold-dark underline-offset-2 hover:underline"
          >
            検索条件でさらに絞り込む
          </Link>
        </div>

        {jobs.length === 0 ? (
          <div className="rounded-2xl border border-gold/20 bg-white py-12 text-center">
            <p className="text-muted">現在、公開中の該当求人はありません。</p>
            <p className="mt-1 text-sm text-muted">
              条件を変えるか、札幌の求人一覧もご覧ください。
            </p>
            <Link
              href="/jobs"
              className="mt-4 inline-block text-sm font-medium text-gold-dark underline-offset-2 hover:underline"
            >
              札幌の求人一覧を見る
            </Link>
          </div>
        ) : (
          <div className="jobs-list-grid grid gap-4 sm:grid-cols-2">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <nav
            className="mt-6 flex items-center justify-center gap-3"
            aria-label="求人一覧のページネーション"
          >
            {page > 1 ? (
              <Link
                href={pageHref(pathname, page - 1)}
                className="rounded-full border border-gold/35 px-4 py-2 text-sm text-gold-dark"
              >
                前へ
              </Link>
            ) : (
              <span className="rounded-full border border-transparent px-4 py-2 text-sm text-muted">
                前へ
              </span>
            )}
            <span className="text-sm text-muted">
              {page} / {totalPages}
            </span>
            {page < totalPages ? (
              <Link
                href={pageHref(pathname, page + 1)}
                className="rounded-full border border-gold/35 px-4 py-2 text-sm text-gold-dark"
              >
                次へ
              </Link>
            ) : (
              <span className="rounded-full border border-transparent px-4 py-2 text-sm text-muted">
                次へ
              </span>
            )}
          </nav>
        )}
      </section>

      {sections && sections.length > 0 ? (
        <div className="mt-8 space-y-8">
          {sections.map((section) => (
            <section
              key={section.heading}
              aria-labelledby={`seo-section-${section.heading.slice(0, 12)}`}
            >
              <h2
                id={`seo-section-${section.heading.slice(0, 12)}`}
                className="font-serif text-xl font-semibold text-charcoal"
              >
                {section.heading}
              </h2>
              <div className="mt-3 space-y-3 text-sm leading-7 text-charcoal sm:text-base sm:leading-8">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph.slice(0, 24)}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : null}

      {showJobTypeLinks && (
        <section className="mt-8" aria-labelledby="susukino-job-types">
          <h2
            id="susukino-job-types"
            className="font-serif text-xl font-semibold text-charcoal"
          >
            職種別のすすきの求人
          </h2>
          <p className="mt-2 text-sm text-muted">
            気になる職種から、すすきのエリアの公開中求人を探せます。
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {SUSUKINO_JOB_TYPE_PAGES.map((item) => (
              <li key={item.slug}>
                <Link
                  href={item.path}
                  className="inline-flex rounded-full border border-gold/35 bg-white px-3.5 py-2 text-sm font-medium text-gold-dark transition-colors hover:border-gold hover:bg-champagne/40"
                >
                  {item.displayName}求人
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8" aria-labelledby="susukino-benefits">
        <h2
          id="susukino-benefits"
          className="font-serif text-xl font-semibold text-charcoal"
        >
          待遇から探す
        </h2>
        <p className="mt-2 text-sm text-muted">
          希望の働き方に近い条件で、すすきのの求人一覧へ絞り込めます。
        </p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {SUSUKINO_BENEFIT_LINKS.map((item) => (
            <li key={item.label}>
              <Link
                href={item.href}
                className="inline-flex rounded-full border border-gold/35 bg-white px-3.5 py-2 text-sm font-medium text-gold-dark transition-colors hover:border-gold hover:bg-champagne/40"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10" aria-labelledby="susukino-beginner">
        <h2
          id="susukino-beginner"
          className="font-serif text-xl font-semibold text-charcoal"
        >
          {sections && sections.length > 0
            ? "初めてガルバ求人を見る方へ"
            : "初めて夜職を探す方へ"}
        </h2>
        <div className="mt-3 space-y-3 text-sm leading-7 text-charcoal sm:text-base sm:leading-8">
          {beginnerGuide.map((paragraph) => (
            <p key={paragraph.slice(0, 24)}>{paragraph}</p>
          ))}
        </div>
        <p className="mt-4">
          <Link
            href="/first-time-guide"
            className="text-sm font-medium text-gold-dark underline-offset-2 hover:underline"
          >
            初めての方への案内を読む
          </Link>
        </p>
      </section>

      <section className="mt-10" aria-labelledby="susukino-columns">
        <h2
          id="susukino-columns"
          className="font-serif text-xl font-semibold text-charcoal"
        >
          関連コラム
        </h2>
        <ul className="mt-4 space-y-2">
          {relatedColumns.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-sm font-medium text-gold-dark underline-offset-2 hover:underline"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10" aria-labelledby="susukino-faq">
        <h2
          id="susukino-faq"
          className="font-serif text-xl font-semibold text-charcoal"
        >
          {resolvedFaqHeading}
        </h2>
        <div className="mt-4 space-y-3">
          {faqs.map((faq) => (
            <details
              key={faq.question}
              className="rounded-2xl border border-gold/25 bg-white px-4 py-3"
            >
              <summary className="cursor-pointer font-medium text-charcoal">
                {faq.question}
              </summary>
              <p className="mt-2 text-sm leading-7 text-muted">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mt-10 mb-4" aria-labelledby="susukino-related">
        <h2
          id="susukino-related"
          className="font-serif text-xl font-semibold text-charcoal"
        >
          関連エリアの求人
        </h2>
        <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
          {!jobTypePage &&
            RELATED_AREA_LINKS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm font-medium text-gold-dark underline-offset-2 hover:underline"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          {jobTypePage && (
            <>
              <li>
                <Link
                  href="/sapporo/susukino"
                  className="text-sm font-medium text-gold-dark underline-offset-2 hover:underline"
                >
                  すすきのの夜職求人（全職種）
                </Link>
              </li>
              {RELATED_AREA_LINKS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm font-medium text-gold-dark underline-offset-2 hover:underline"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </>
          )}
        </ul>
      </section>
    </div>
  );
}
