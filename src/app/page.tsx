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
            href="#support-section"
            className="animate-fade-up group relative block overflow-hidden rounded-3xl border border-gold-dark/40 bg-[linear-gradient(135deg,#fff3b4_0%,#e6bd52_24%,#9c6716_52%,#f8df79_76%,#b06f16_100%)] px-5 py-8 text-center shadow-[0_18px_45px_rgba(201,169,98,0.34),0_0_32px_rgba(232,213,163,0.32),inset_0_1px_0_rgba(255,255,255,0.65)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_60px_rgba(201,169,98,0.48),0_0_50px_rgba(232,213,163,0.55),inset_0_1px_0_rgba(255,255,255,0.75)] sm:px-8 sm:py-10"
          >
            <span
              className="absolute inset-0 bg-[linear-gradient(115deg,transparent_0%,rgba(255,255,255,0.18)_27%,rgba(255,255,255,0.72)_43%,rgba(255,255,255,0.18)_58%,transparent_100%),radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.58),transparent_16%),radial-gradient(circle_at_78%_72%,rgba(255,255,255,0.36),transparent_18%)] opacity-95"
              aria-hidden
            />
            <span className="sparkle left-[12%] top-[18%]">✦</span>
            <span className="sparkle animation-delay-150 right-[14%] top-[16%] text-sm">✧</span>
            <span className="sparkle animation-delay-300 left-[20%] bottom-[24%] text-xs">✦</span>
            <span className="sparkle animation-delay-450 right-[23%] bottom-[20%] text-xs">✧</span>
            <span className="sparkle animation-delay-600 left-[48%] top-[10%] text-[10px]">✦</span>
            <span className="sparkle animation-delay-750 left-[8%] bottom-[12%] text-lg">✦</span>
            <span className="sparkle animation-delay-900 right-[8%] bottom-[12%] text-lg">✦</span>
            <span className="sparkle animation-delay-1050 left-[35%] top-[28%] text-[9px]">✧</span>
            <span className="sparkle animation-delay-1200 right-[35%] top-[30%] text-[9px]">✧</span>
            <span className="absolute -left-7 top-[-20px] h-[calc(100%+40px)] w-3 -rotate-12 bg-gradient-to-b from-black via-[#15110b] to-black shadow-[14px_0_0_rgba(0,0,0,0.72)] sm:-left-4 sm:w-4" aria-hidden />
            <span className="absolute left-3 top-[-20px] h-[calc(100%+40px)] w-2 -rotate-12 bg-black/70 sm:left-7 sm:w-3" aria-hidden />
            <span className="absolute -right-7 top-[-20px] h-[calc(100%+40px)] w-3 rotate-12 bg-gradient-to-b from-black via-[#15110b] to-black shadow-[-14px_0_0_rgba(0,0,0,0.72)] sm:-right-4 sm:w-4" aria-hidden />
            <span className="absolute right-3 top-[-20px] h-[calc(100%+40px)] w-2 rotate-12 bg-black/70 sm:right-7 sm:w-3" aria-hidden />
            <span className="relative mx-auto mb-2 flex items-center justify-center gap-2 text-sm font-bold tracking-[0.25em] text-[#7b4f0b] drop-shadow-[0_1px_0_rgba(255,255,255,0.45)] sm:text-base">
              <span>★</span>
              <span>★</span>
              <span className="font-serif text-lg leading-none text-[#7b4f0b] drop-shadow-[0_0_8px_rgba(123,79,11,0.22)] sm:text-xl">
                ♛
              </span>
              <span>★</span>
              <span>★</span>
            </span>
            <span className="relative mx-auto inline-flex [clip-path:polygon(9%_0,91%_0,100%_50%,91%_100%,9%_100%,0_50%)] border border-black/80 bg-gradient-to-r from-black via-[#1c1710] to-black px-8 py-2.5 font-serif text-xl font-bold tracking-wide text-gold-light shadow-[0_10px_26px_rgba(0,0,0,0.34)] sm:px-12 sm:text-2xl">
              業界唯一
            </span>
            <span className="relative mx-auto mt-5 block max-w-[18rem] text-2xl font-black leading-tight tracking-[0.08em] text-black drop-shadow-[0_1px_0_rgba(255,255,255,0.45)] sm:max-w-none sm:text-4xl">
              全掲載店舗
              <br className="sm:hidden" />
              相談受付実施
            </span>
            <span className="relative mt-2 block text-sm font-semibold text-black/75">
              不安や疑問を事前に相談できる、安心のサポート体制
            </span>
            <span className="relative mx-auto mt-6 inline-flex min-h-11 items-center justify-center border border-black bg-gradient-to-r from-black via-[#18130d] to-black px-8 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(232,213,163,0.28)] transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-[0_0_28px_rgba(232,213,163,0.42)]">
              詳しく見る
              <span className="ml-3 text-white">→</span>
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
