import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { SusukinoSeoView } from "@/components/seo/SusukinoSeoView";
import { getPublishedSeoJobsPage } from "@/lib/seo-area-jobs";
import { buildPageMetadata } from "@/lib/seo";
import {
  getSusukinoJobTypePage,
  SUSUKINO_DISTRICT,
  SUSUKINO_GIRLSBAR_PATH,
  SUSUKINO_JOB_TYPE_PAGES,
} from "@/lib/susukino-seo";

type PageProps = {
  params: Promise<{ jobTypeSlug: string }>;
  searchParams: Promise<{ page?: string }>;
};

export function generateStaticParams() {
  return SUSUKINO_JOB_TYPE_PAGES.map((page) => ({
    jobTypeSlug: page.slug,
  }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { jobTypeSlug } = await params;
  if (jobTypeSlug === "girls-bar") {
    return buildPageMetadata(
      "すすきののガールズバー求人｜優良店専門 White Night Job",
      "すすきのでガールズバー求人を探すならWhite Night Job。独自審査を通過した優良店の求人を掲載。時給・待遇・勤務時間・口コミなどを比較して、自分に合ったガールズバーを探せます。",
      SUSUKINO_GIRLSBAR_PATH,
      { absoluteTitle: true },
    );
  }
  const page = getSusukinoJobTypePage(jobTypeSlug);
  if (!page) {
    return { title: "ページが見つかりません" };
  }
  return buildPageMetadata(page.title, page.description, page.path, {
    absoluteTitle: true,
  });
}

export default async function SusukinoJobTypePage({
  params,
  searchParams,
}: PageProps) {
  const { jobTypeSlug } = await params;
  if (jobTypeSlug === "girls-bar") {
    permanentRedirect(SUSUKINO_GIRLSBAR_PATH);
  }

  const page = getSusukinoJobTypePage(jobTypeSlug);
  if (!page) notFound();

  const query = await searchParams;
  const pageNum = Math.max(1, Number(query.page) || 1);
  const jobsResult = await getPublishedSeoJobsPage({
    district: SUSUKINO_DISTRICT,
    jobType: page.jobType,
    page: pageNum,
  });

  return (
    <SusukinoSeoView
      pathname={page.path}
      title={page.title}
      description={page.description}
      h1={page.h1}
      intro={page.intro}
      beginnerGuide={page.guide}
      faqs={page.faqs}
      jobsResult={jobsResult}
      breadcrumbLabel={page.h1}
      jobTypePage={page}
      showJobTypeLinks
      contentSections={page.contentSections}
      faqHeading={page.faqHeading}
    />
  );
}
