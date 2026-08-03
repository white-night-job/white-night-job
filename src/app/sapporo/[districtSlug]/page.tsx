import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DistrictSeoView } from "@/components/seo/DistrictSeoView";
import {
  DISTRICT_AREA_PAGES,
  getDistrictAreaPage,
} from "@/lib/district-seo";
import { getPublishedSeoJobsPage } from "@/lib/seo-area-jobs";
import { buildPageMetadata } from "@/lib/seo";

type PageProps = {
  params: Promise<{ districtSlug: string }>;
  searchParams: Promise<{ page?: string }>;
};

export function generateStaticParams() {
  return DISTRICT_AREA_PAGES.map((page) => ({
    districtSlug: page.slug,
  }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { districtSlug } = await params;
  const area = getDistrictAreaPage(districtSlug);
  if (!area) return { title: "ページが見つかりません" };
  return buildPageMetadata(area.title, area.description, area.path, {
    absoluteTitle: true,
  });
}

export default async function DistrictAreaPage({
  params,
  searchParams,
}: PageProps) {
  const { districtSlug } = await params;
  const area = getDistrictAreaPage(districtSlug);
  if (!area) notFound();

  const query = await searchParams;
  const page = Math.max(1, Number(query.page) || 1);
  const jobsResult = await getPublishedSeoJobsPage({
    district: area.district,
    page,
  });

  return (
    <DistrictSeoView
      area={area}
      jobsResult={jobsResult}
      availableJobTypePages={area.jobTypePages}
    />
  );
}
