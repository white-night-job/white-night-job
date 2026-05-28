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
            href="#support-system"
            className="animate-fade-up group relative block overflow-hidden rounded-3xl border border-gold/50 bg-gradient-to-br from-black via-[#171109] to-[#332612] px-5 py-7 text-center shadow-[0_18px_45px_rgba(33,29,24,0.2),0_0_34px_rgba(201,169,98,0.22)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(33,29,24,0.28),0_0_46px_rgba(201,169,98,0.34)] sm:px-8 sm:py-9"
          >
            <span
              className="absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,rgba(232,213,163,0.14)_35%,rgba(255,255,255,0.22)_48%,rgba(232,213,163,0.12)_60%,transparent_100%),radial-gradient(circle_at_top,rgba(201,169,98,0.42),transparent_34%)] opacity-90"
              aria-hidden
            />
            <span className="absolute -left-8 top-5 h-16 w-2 -rotate-45 bg-black/70 shadow-[18px_18px_0_rgba(0,0,0,0.55)] sm:-left-5" aria-hidden />
            <span className="absolute -left-2 bottom-4 h-14 w-2 -rotate-45 bg-black/55 shadow-[18px_18px_0_rgba(0,0,0,0.4)]" aria-hidden />
            <span className="absolute -right-8 top-5 h-16 w-2 rotate-45 bg-black/70 shadow-[-18px_18px_0_rgba(0,0,0,0.55)] sm:-right-5" aria-hidden />
            <span className="absolute -right-2 bottom-4 h-14 w-2 rotate-45 bg-black/55 shadow-[-18px_18px_0_rgba(0,0,0,0.4)]" aria-hidden />
            <span className="relative mx-auto inline-flex rounded-full border border-gold/50 bg-black px-5 py-2 font-serif text-xl font-bold tracking-wide text-gold-light shadow-[0_0_22px_rgba(201,169,98,0.28)] sm:text-2xl">
              業界唯一
            </span>
            <span className="relative mt-4 block text-lg font-bold leading-relaxed text-white sm:text-2xl">
              全掲載店舗相談受付実施
            </span>
            <span className="relative mt-2 block text-sm font-medium text-gold-light/90">
              不安や疑問を事前に相談できる、安心のサポート体制
            </span>
            <span className="relative mx-auto mt-5 inline-flex min-h-11 items-center justify-center rounded-full border border-gold/60 bg-gradient-to-r from-gold-light to-gold px-6 py-3 text-sm font-bold text-charcoal shadow-md transition-transform duration-300 group-hover:scale-105">
              詳しく見る
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
