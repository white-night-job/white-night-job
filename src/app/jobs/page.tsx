import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JobSearchSection } from "@/components/JobSearchSection";
import { buildPageMetadata } from "@/lib/seo";
import { SITE_FORMAL_NAME } from "@/lib/site";
import type { JobFilters } from "@/types/job";

export const metadata: Metadata = buildPageMetadata(
  "札幌の夜職・体験入店求人一覧",
  "札幌エリアの夜職・体験入店求人一覧ページです。ガールズバー・コンカフェ・ラウンジ・ニュークラブなど、体入ホワイトナイト掲載の審査済み優良店をエリア・職種・待遇から比較できます。初めての方でも条件を見て、自分に合う働き方を探しやすい構成です。",
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
    <div className="mx-auto box-border w-full min-w-0 max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <Breadcrumbs items={[{ label: "求人一覧" }]} />

      <div className="mb-6 min-w-0 max-w-full">
        <h1 className="font-serif text-2xl font-semibold text-charcoal sm:text-3xl">
          掲載中の求人を探す
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
