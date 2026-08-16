import type { Metadata } from "next";
import Link from "next/link";
import { JobDetailClient } from "@/components/JobDetailClient";
import { JsonLd } from "@/components/JsonLd";
import { StoreInfoView } from "@/components/StoreInfoView";
import { listGirlReviewsForJob } from "@/lib/girl-reviews-db";
import { getPublishedJobDetail } from "@/lib/job-detail-data";
import { isUncontractedPlan } from "@/lib/job-plan";
import {
  buildJobDetailMetadata,
  buildJobPostingJsonLd,
  buildJobReviewsJsonLd,
} from "@/lib/seo";
import type { GirlReview } from "@/types/girl-review";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  let job = null;
  try {
    job = await getPublishedJobDetail(id);
  } catch (error) {
    console.error("[job-detail] generateMetadata failed", {
      jobId: id,
      error,
    });
  }
  if (!job) {
    return { title: "求人が見つかりません" };
  }
  return buildJobDetailMetadata(job);
}

export default async function JobDetailPage({ params }: PageProps) {
  const { id } = await params;
  const startedAt = Date.now();
  let job = null;
  let girlReviews: GirlReview[] = [];
  try {
    job = await getPublishedJobDetail(id);
  } catch (error) {
    console.error("[job-detail] page fetch failed", {
      jobId: id,
      error,
      ms: Date.now() - startedAt,
    });
  }

  if (job && !isUncontractedPlan(job.plan)) {
    try {
      girlReviews = await listGirlReviewsForJob(job.id);
    } catch (error) {
      console.error("[job-detail] girl reviews fetch failed", {
        jobId: id,
        error,
      });
    }
  }

  if (process.env.NODE_ENV === "development") {
    console.info("[job-detail] page render", {
      jobId: id,
      found: Boolean(job),
      ms: Date.now() - startedAt,
    });
  }

  if (!job) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">求人が見つかりません</h1>
        <Link href="/" className="mt-6 inline-block text-gold-dark">
          ← 求人一覧へ
        </Link>
      </div>
    );
  }

  if (isUncontractedPlan(job.plan)) {
    return (
      <>
        <JsonLd data={buildJobPostingJsonLd(job)} />
        <StoreInfoView job={job} />
      </>
    );
  }

  const reviewsJsonLd = buildJobReviewsJsonLd(job, girlReviews);

  return (
    <>
      <JsonLd data={buildJobPostingJsonLd(job)} />
      {reviewsJsonLd ? <JsonLd data={reviewsJsonLd} /> : null}
      <JobDetailClient job={job} girlReviews={girlReviews} />
    </>
  );
}
