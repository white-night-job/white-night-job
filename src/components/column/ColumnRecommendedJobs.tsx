import Link from "next/link";
import { CompactJobCard } from "@/components/CompactJobCard";
import type { ColumnArticle } from "@/data/column-articles";
import { getJobsSearchPath } from "@/data/column-articles";
import { fetchColumnRecommendedJobs } from "@/lib/column-jobs";
import type { Job } from "@/types/job";

type ColumnRecommendedJobsProps = {
  article: ColumnArticle;
};

export async function ColumnRecommendedJobs({ article }: ColumnRecommendedJobsProps) {
  const jobs = await fetchColumnRecommendedJobs(article.jobFilter);
  const searchPath = getJobsSearchPath(article);

  return (
    <section aria-labelledby="recommended-jobs-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2
          id="recommended-jobs-heading"
          className="font-serif text-xl font-semibold text-charcoal sm:text-2xl"
        >
          【おすすめ店舗】
        </h2>
        <Link
          href={searchPath}
          className="text-sm font-medium text-gold-dark underline-offset-2 hover:underline"
        >
          もっと見る →
        </Link>
      </div>

      {jobs.length > 0 ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {jobs.map((job: Job) => (
            <CompactJobCard key={job.id} job={job} />
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-xl border border-gold/25 bg-white p-5 text-sm text-muted">
          現在表示できる求人がありません。
          <Link href="/jobs" className="ml-1 text-gold-dark underline-offset-2 hover:underline">
            求人一覧
          </Link>
          からお探しください。
        </p>
      )}
    </section>
  );
}
