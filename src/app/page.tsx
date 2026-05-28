import { Suspense } from "react";
import Link from "next/link";
import { FirstTimeGuide } from "@/components/FirstTimeGuide";
import { Hero } from "@/components/Hero";
import { JobSearchSection } from "@/components/JobSearchSection";
import type { JobFilters } from "@/types/job";

interface HomePageProps {
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

export default async function HomePage({ searchParams }: HomePageProps) {
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
      <Hero />

      <div className="mt-6 space-y-6">
        <section className="grid gap-3 rounded-3xl border border-gold/25 bg-white p-4 shadow-[0_10px_35px_rgba(33,29,24,0.08)] sm:grid-cols-2 sm:p-5">
          <Link
            href="#first-time-guide"
            className="group flex min-h-16 items-center justify-center rounded-2xl border border-gold/40 bg-charcoal px-5 py-4 text-center text-sm font-semibold leading-relaxed text-gold-light shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-gold hover:bg-black hover:shadow-gold sm:text-base"
          >
            <span className="transition-transform duration-300 group-hover:scale-[1.02]">
              業界唯一　全掲載店舗相談受付実施
            </span>
          </Link>
          <Link
            href="#first-time-guide"
            className="group flex min-h-16 items-center justify-center rounded-2xl border border-gold/50 bg-gradient-to-r from-gold-light via-white to-gold-light px-5 py-4 text-center text-sm font-semibold leading-relaxed text-charcoal shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-gold hover:shadow-gold sm:text-base"
          >
            <span className="transition-transform duration-300 group-hover:scale-[1.02]">
              初めてご利用される方はこちら
            </span>
          </Link>
        </section>

        <Suspense fallback={<div className="h-52 animate-pulse rounded-2xl bg-white" />}>
          <JobSearchSection initialFilters={filters} title="求人一覧" />
        </Suspense>

        <FirstTimeGuide />
      </div>
    </div>
  );
}
