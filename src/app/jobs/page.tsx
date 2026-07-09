import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JobSearchSection } from "@/components/JobSearchSection";
import { buildPageMetadata } from "@/lib/seo";
import { SITE_FORMAL_NAME } from "@/lib/site";
import type { JobFilters } from "@/types/job";

export const metadata: Metadata = buildPageMetadata(
  "求人一覧",
  `${SITE_FORMAL_NAME}の求人一覧。体験入店・ガールズバー・コンカフェ・ラウンジ・ニュークラブなど、審査済み店舗の求人を掲載しています。`,
  "/jobs",
);

interface JobsPageProps {
  searchParams: Promise<{
    district?: string;
    jobType?: string;
    q?: string;
    minSalary?: string;
    benefit?: string | string[];
  }>;
}

function toArray(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const params = await searchParams;
  const filters: JobFilters = {
    district: params.district ?? null,
    jobType: params.jobType ?? null,
    query: params.q ?? null,
    minSalary: params.minSalary ?? null,
    benefits: toArray(params.benefit),
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <Breadcrumbs items={[{ label: "求人一覧" }]} />

      <div className="mb-6">
        <h1 className="font-serif text-2xl font-semibold text-charcoal sm:text-3xl">
          求人一覧
        </h1>
        <p className="mt-2 text-sm text-muted">
          {SITE_FORMAL_NAME}に掲載中の、審査済み店舗の求人です。
        </p>
      </div>

      <div className="space-y-6">
        <JobSearchSection initialFilters={filters} title="掲載求人" />
      </div>
    </div>
  );
}
