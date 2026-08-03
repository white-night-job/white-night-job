import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DistrictSeoView } from "@/components/seo/DistrictSeoView";
import {
  DISTRICT_AREA_PAGES,
  getDistrictJobTypePage,
} from "@/lib/district-seo";
import { getPublishedSeoJobsPage } from "@/lib/seo-area-jobs";
import { buildPageMetadata } from "@/lib/seo";

type PageProps = {
  params: Promise<{ districtSlug: string; jobTypeSlug: string }>;
  searchParams: Promise<{ page?: string }>;
};

export async function generateStaticParams() {
  return DISTRICT_AREA_PAGES.flatMap((area) =>
    area.jobTypePages.map((page) => ({
      districtSlug: area.slug,
      jobTypeSlug: page.slug,
    })),
  );
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { districtSlug, jobTypeSlug } = await params;
  const matched = getDistrictJobTypePage(districtSlug, jobTypeSlug);
  if (!matched) return { title: "ページが見つかりません" };
  return buildPageMetadata(
    matched.jobTypePage.title,
    matched.jobTypePage.description,
    matched.jobTypePage.path,
    { absoluteTitle: true },
  );
}

export default async function DistrictJobTypePage({
  params,
  searchParams,
}: PageProps) {
  const { districtSlug, jobTypeSlug } = await params;
  const matched = getDistrictJobTypePage(districtSlug, jobTypeSlug);
  if (!matched) notFound();

  const { area, jobTypePage } = matched;
  const query = await searchParams;
  const pageNum = Math.max(1, Number(query.page) || 1);

  const jobsResult = await getPublishedSeoJobsPage({
    district: area.district,
    jobType: jobTypePage.jobType,
    page: pageNum,
  });

  return (
    <DistrictSeoView
      area={area}
      jobTypePage={jobTypePage}
      jobsResult={jobsResult}
      availableJobTypePages={area.jobTypePages}
    />
  );
}
