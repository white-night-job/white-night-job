import type { Metadata } from "next";
import { SusukinoSeoView } from "@/components/seo/SusukinoSeoView";
import { getPublishedSeoJobsPage } from "@/lib/seo-area-jobs";
import { buildPageMetadata } from "@/lib/seo";
import {
  SUSUKINO_AREA_PAGE,
  SUSUKINO_DISTRICT,
} from "@/lib/susukino-seo";

type PageProps = {
  searchParams: Promise<{ page?: string }>;
};

export const metadata: Metadata = buildPageMetadata(
  SUSUKINO_AREA_PAGE.title,
  SUSUKINO_AREA_PAGE.description,
  SUSUKINO_AREA_PAGE.path,
  { absoluteTitle: true },
);

export default async function SusukinoAreaPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const jobsResult = await getPublishedSeoJobsPage({
    district: SUSUKINO_DISTRICT,
    page,
  });

  return (
    <SusukinoSeoView
      pathname={SUSUKINO_AREA_PAGE.path}
      title={SUSUKINO_AREA_PAGE.title}
      description={SUSUKINO_AREA_PAGE.description}
      h1={SUSUKINO_AREA_PAGE.h1}
      intro={SUSUKINO_AREA_PAGE.intro}
      beginnerGuide={SUSUKINO_AREA_PAGE.beginnerGuide}
      faqs={SUSUKINO_AREA_PAGE.faqs}
      jobsResult={jobsResult}
      breadcrumbLabel="すすきのの夜職求人"
      showJobTypeLinks
    />
  );
}
