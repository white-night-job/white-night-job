import type { Metadata } from "next";
import Link from "next/link";
import { JobDetailClient } from "@/components/JobDetailClient";
import { JsonLd } from "@/components/JsonLd";
import { getPublishedJobDetail } from "@/lib/job-detail-data";
import {
  buildJobDetailMetadata,
  buildJobPostingJsonLd,
} from "@/lib/seo";

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

  return (
    <>
      <JsonLd data={buildJobPostingJsonLd(job)} />
      <JobDetailClient job={job} />
    </>
  );
}
