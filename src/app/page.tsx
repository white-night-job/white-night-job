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
        <section className="space-y-4">
          <Link
            href="#first-time-guide"
            className="animate-fade-up group relative block overflow-hidden rounded-3xl border border-gold/50 bg-gradient-to-br from-gold-light via-gold to-gold-dark px-5 py-6 text-center shadow-[0_18px_45px_rgba(201,169,98,0.32)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(201,169,98,0.42)] sm:px-8 sm:py-8"
          >
            <span
              className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.55),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.28),transparent_28%)] opacity-80"
              aria-hidden
            />
            <span className="relative block text-xs font-semibold tracking-[0.25em] text-white/85">
              いつでも相談できる安心感
            </span>
            <span className="relative mt-2 block font-serif text-2xl font-bold leading-tight text-white drop-shadow-sm sm:text-3xl">
              業界唯一
            </span>
            <span className="relative mt-1 block text-base font-bold leading-relaxed text-white sm:text-xl">
              全掲載店舗相談受付実施
            </span>
          </Link>
          <Link
            href="#first-time-guide"
            className="animate-fade-up animation-delay-150 group block rounded-3xl border border-gold/35 bg-white px-5 py-5 text-center shadow-[0_12px_32px_rgba(33,29,24,0.08)] transition-all duration-300 hover:-translate-y-1 hover:border-gold hover:bg-gold-light/15 hover:shadow-gold sm:px-8 sm:py-6"
          >
            <span className="block text-sm font-semibold text-gold-dark">
              初めてでも安心して探せます
            </span>
            <span className="mt-1 block font-serif text-lg font-semibold text-charcoal sm:text-xl">
              🔰 初めてご利用される方はこちら
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
