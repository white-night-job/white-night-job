import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DistrictSeoView } from "@/components/seo/DistrictSeoView";
import {
  DISTRICT_AREA_PAGES,
  getDistrictJobTypePage,
  jobTypeSlugFromJobType,
} from "@/lib/district-seo";
import {
  getPublishedSeoJobsPage,
  listPublishedJobTypesForDistrict,
} from "@/lib/seo-area-jobs";
import { buildPageMetadata } from "@/lib/seo";

type PageProps = {
  params: Promise<{ districtSlug: string; jobTypeSlug: string }>;
  searchParams: Promise<{ page?: string }>;
};

export async function generateStaticParams() {
  const params: Array<{ districtSlug: string; jobTypeSlug: string }> = [];

  for (const area of DISTRICT_AREA_PAGES) {
    try {
      const types = await listPublishedJobTypesForDistrict(area.district);
      for (const jobType of types) {
        const slug = jobTypeSlugFromJobType(jobType);
        if (!slug) continue;
        if (!area.jobTypePages.some((page) => page.slug === slug)) continue;
        params.push({ districtSlug: area.slug, jobTypeSlug: slug });
      }
    } catch (error) {
      console.error("[district-job-type] generateStaticParams failed", {
        district: area.district,
        error,
      });
    }
  }

  return params;
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

  const [jobsResult, publishedTypes] = await Promise.all([
    getPublishedSeoJobsPage({
      district: area.district,
      jobType: jobTypePage.jobType,
      page: pageNum,
    }),
    listPublishedJobTypesForDistrict(area.district),
  ]);

  if (jobsResult.total === 0) {
    notFound();
  }

  const availableJobTypePages = area.jobTypePages.filter((item) =>
    publishedTypes.includes(item.jobType),
  );

  return (
    <DistrictSeoView
      area={area}
      jobTypePage={jobTypePage}
      jobsResult={jobsResult}
      availableJobTypePages={availableJobTypePages}
    />
  );
}
