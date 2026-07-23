import type { Metadata } from "next";
import Link from "next/link";
import { JobDetailClient } from "@/components/JobDetailClient";
import { getPublishedJobDetail } from "@/lib/job-detail-data";
import { SITE_BRAND_JA, SITE_URL } from "@/lib/site";

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
  const title = `${job.shopName}｜${job.jobType}の求人`;
  const description =
    job.introductionText?.slice(0, 120) ||
    `${job.shopName}（${job.district}）の求人情報。時給 ${job.salary}`;
  return {
    title,
    description,
    openGraph: {
      title: `${title}｜${SITE_BRAND_JA}`,
      description,
      url: `${SITE_URL}/jobs/${job.id}`,
      type: "website",
    },
  };
}

export default async function JobDetailPage({ params }: PageProps) {
  const { id } = await params;
  const startedAt = Date.now();
  let job = null;
  try {
    job = await getPublishedJobDetail(id);
  } catch (error) {
    console.error("[job-detail] page fetch failed", {
      jobId: id,
      error,
      ms: Date.now() - startedAt,
    });
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

  return <JobDetailClient job={job} />;
}
