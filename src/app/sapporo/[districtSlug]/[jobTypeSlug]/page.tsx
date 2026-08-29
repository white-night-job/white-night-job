import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { DistrictSeoView } from "@/components/seo/DistrictSeoView";
import {
  GIRLSBAR_LEGACY_PATH_SLUG,
  GIRLSBAR_PATH_SLUG,
} from "@/lib/area-girlsbar-seo";
import {
  DISTRICT_AREA_PAGES,
  getDistrictAreaPage,
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
  if (jobTypeSlug === GIRLSBAR_LEGACY_PATH_SLUG) {
    const area = getDistrictAreaPage(districtSlug);
    if (area) {
      const girlsbar = area.jobTypePages.find(
        (page) => page.slug === GIRLSBAR_PATH_SLUG,
      );
      if (girlsbar) {
        return buildPageMetadata(
          girlsbar.title,
          girlsbar.description,
          girlsbar.path,
          { absoluteTitle: true },
        );
      }
    }
  }

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

  if (jobTypeSlug === GIRLSBAR_LEGACY_PATH_SLUG) {
    const area = getDistrictAreaPage(districtSlug);
    if (area) {
      permanentRedirect(`${area.path}/${GIRLSBAR_PATH_SLUG}`);
    }
  }

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
