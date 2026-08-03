import Link from "next/link";
import { JobCard } from "@/components/JobCard";
import { JsonLd } from "@/components/JsonLd";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import {
  buildFaqPageJsonLd,
  buildJobPostingItemListJsonLd,
  buildWebPageJsonLd,
} from "@/lib/seo";
import type { SeoJobsPageResult } from "@/lib/seo-area-jobs";
import {
  buildDistrictBenefitLinks,
  DISTRICT_SEO_RELATED_LINKS,
  type DistrictAreaPage,
  type DistrictJobTypePage,
} from "@/lib/district-seo";
import type { SeoColumnLink } from "@/lib/seo-area-job-type-content";

type DistrictSeoViewProps = {
  area: DistrictAreaPage;
  jobsResult: SeoJobsPageResult;
  jobTypePage?: DistrictJobTypePage;
  /** Job-type chips to show (only pages that currently have published jobs). */
  availableJobTypePages: DistrictJobTypePage[];
};

function pageHref(basePath: string, page: number) {
  if (page <= 1) return basePath;
  return `${basePath}?page=${page}`;
}

export function DistrictSeoView({
  area,
  jobsResult,
  jobTypePage,
  availableJobTypePages,
}: DistrictSeoViewProps) {
  const pathname = jobTypePage?.path ?? area.path;
  const title = jobTypePage?.title ?? area.title;
  const description = jobTypePage?.description ?? area.description;
  const h1 = jobTypePage?.h1 ?? area.h1;
  const intro = jobTypePage?.intro ?? area.intro;
  const beginnerGuide = jobTypePage?.guide ?? area.beginnerGuide;
  const faqs = jobTypePage?.faqs ?? area.faqs;
  const columnLinks: SeoColumnLink[] =
    jobTypePage?.columnLinks ?? area.columnLinks;
  const { jobs, page, total, totalPages } = jobsResult;
  const benefitLinks = buildDistrictBenefitLinks(area.district);
  const listHeading = jobTypePage
    ? `公開中の${jobTypePage.displayName}求人`
    : `公開中の${area.displayName}求人`;

  const relatedLinks = DISTRICT_SEO_RELATED_LINKS.filter(
    (link) => link.href !== area.path,
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <JsonLd data={buildWebPageJsonLd(title, description, pathname)} />
      <JsonLd data={buildFaqPageJsonLd([...faqs])} />
      {jobs.length > 0 && (
        <JsonLd
          data={buildJobPostingItemListJsonLd(jobs, {
            name: listHeading,
            pathname,
          })}
        />
      )}

      <Breadcrumbs
        items={[
          {
            label: area.h1,
            href: jobTypePage ? area.path : undefined,
          },
          ...(jobTypePage ? [{ label: jobTypePage.h1 }] : []),
        ]}
      />

      <header className="mt-4">
        <h1 className="font-serif text-2xl font-semibold text-charcoal sm:text-3xl">
          {h1}
        </h1>
        <div className="mt-4 space-y-3 text-sm leading-7 text-charcoal sm:text-base sm:leading-8">
          {intro.map((paragraph) => (
            <p key={paragraph.slice(0, 28)}>{paragraph}</p>
          ))}
        </div>
      </header>

      {availableJobTypePages.length > 0 && (
        <section className="mt-8" aria-labelledby="district-job-types">
          <h2
            id="district-job-types"
            className="font-serif text-xl font-semibold text-charcoal"
          >
            職種別の{area.displayName}求人
          </h2>
          <p className="mt-2 text-sm text-muted">
            気になる職種から、{area.displayName}エリアの求人ページを探せます。
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {availableJobTypePages.map((item) => (
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

      <section className="mt-8" aria-labelledby="district-benefits">
        <h2
          id="district-benefits"
          className="font-serif text-xl font-semibold text-charcoal"
        >
          待遇から探す
        </h2>
        <p className="mt-2 text-sm text-muted">
          希望の働き方に近い条件で、{area.displayName}の求人一覧へ絞り込めます。
        </p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {benefitLinks.map((item) => (
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

      <section className="mt-10" aria-labelledby="district-jobs">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2
              id="district-jobs"
              className="font-serif text-xl font-semibold text-charcoal"
            >
              {listHeading}
            </h2>
            <p className="mt-1 text-sm text-muted">
              公開中の求人のみ表示しています（{total}件）
            </p>
          </div>
          <Link
            href={`/jobs?district=${encodeURIComponent(area.district)}${
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
              他のエリアや求人一覧もあわせてご覧ください。
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

      <section className="mt-10" aria-labelledby="district-beginner">
        <h2
          id="district-beginner"
          className="font-serif text-xl font-semibold text-charcoal"
        >
          未経験から探す方へ
        </h2>
        <div className="mt-3 space-y-3 text-sm leading-7 text-charcoal sm:text-base sm:leading-8">
          {beginnerGuide.map((paragraph) => (
            <p key={paragraph.slice(0, 28)}>{paragraph}</p>
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

      <section className="mt-10" aria-labelledby="district-columns">
        <h2
          id="district-columns"
          className="font-serif text-xl font-semibold text-charcoal"
        >
          関連コラム
        </h2>
        <ul className="mt-4 space-y-2">
          {columnLinks.map((link) => (
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

      <section className="mt-10" aria-labelledby="district-faq">
        <h2
          id="district-faq"
          className="font-serif text-xl font-semibold text-charcoal"
        >
          よくある質問
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

      <section className="mt-10 mb-4" aria-labelledby="district-related">
        <h2
          id="district-related"
          className="font-serif text-xl font-semibold text-charcoal"
        >
          関連エリアの求人
        </h2>
        <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
          {jobTypePage && (
            <li>
              <Link
                href={area.path}
                className="text-sm font-medium text-gold-dark underline-offset-2 hover:underline"
              >
                {area.displayName}の夜職求人（全職種）
              </Link>
            </li>
          )}
          {relatedLinks.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="text-sm font-medium text-gold-dark underline-offset-2 hover:underline"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
