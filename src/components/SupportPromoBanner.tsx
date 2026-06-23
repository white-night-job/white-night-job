import Link from "next/link";
import { TOP_CTA_PROMO_LAYOUT } from "@/components/top-cta-styles";

type SupportPromoBannerProps = {
  className?: string;
};

export function SupportPromoBanner({ className = "" }: SupportPromoBannerProps) {
  return (
    <Link
      href="#support-section"
      className={`animate-fade-up group relative block overflow-hidden rounded-3xl border border-gold-dark/40 bg-[linear-gradient(135deg,#fff3b4_0%,#e6bd52_24%,#9c6716_52%,#f8df79_76%,#b06f16_100%)] shadow-[0_18px_45px_rgba(201,169,98,0.34),0_0_32px_rgba(232,213,163,0.32),inset_0_1px_0_rgba(255,255,255,0.65)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_60px_rgba(201,169,98,0.48),0_0_50px_rgba(232,213,163,0.55),inset_0_1px_0_rgba(255,255,255,0.75)] ${TOP_CTA_PROMO_LAYOUT} ${className}`}
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
      <span
        className="absolute -left-7 top-[-12px] h-[calc(100%+24px)] w-3 -rotate-12 bg-gradient-to-b from-black via-[#15110b] to-black shadow-[14px_0_0_rgba(0,0,0,0.72)] sm:-left-4 sm:w-4"
        aria-hidden
      />
      <span
        className="absolute left-3 top-[-12px] h-[calc(100%+24px)] w-2 -rotate-12 bg-black/70 sm:left-7 sm:w-3"
        aria-hidden
      />
      <span
        className="absolute -right-7 top-[-12px] h-[calc(100%+24px)] w-3 rotate-12 bg-gradient-to-b from-black via-[#15110b] to-black shadow-[-14px_0_0_rgba(0,0,0,0.72)] sm:-right-4 sm:w-4"
        aria-hidden
      />
      <span
        className="absolute right-3 top-[-12px] h-[calc(100%+24px)] w-2 rotate-12 bg-black/70 sm:right-7 sm:w-3"
        aria-hidden
      />

      <div className="relative flex w-full flex-col items-center gap-0.5">
        <span className="flex items-center justify-center gap-1.5 text-[10px] font-bold leading-none tracking-[0.24em] text-[#7b4f0b] drop-shadow-[0_1px_0_rgba(255,255,255,0.45)] sm:gap-2 sm:text-xs">
          <span>★</span>
          <span>★</span>
          <span className="font-serif text-sm text-[#7b4f0b] drop-shadow-[0_0_8px_rgba(123,79,11,0.22)] sm:text-base">
            ♛
          </span>
          <span>★</span>
          <span>★</span>
        </span>

        <div className="flex w-full flex-col items-center gap-0 text-center">
          <span className="relative inline-flex items-center justify-center">
            <span
              className="absolute -left-3 top-1/2 h-5 w-5 -translate-y-1/2 bg-black [clip-path:polygon(100%_0,0_50%,100%_100%)] shadow-[0_6px_14px_rgba(0,0,0,0.35)] sm:-left-3.5 sm:h-6 sm:w-6"
              aria-hidden
            />
            <span
              className="absolute -right-3 top-1/2 h-5 w-5 -translate-y-1/2 bg-black [clip-path:polygon(0_0,100%_50%,0_100%)] shadow-[0_6px_14px_rgba(0,0,0,0.35)] sm:-right-3.5 sm:h-6 sm:w-6"
              aria-hidden
            />
            <span className="relative z-10 inline-flex items-center justify-center border border-black/80 bg-[linear-gradient(180deg,#2b2418_0%,#050505_44%,#1a140d_100%)] px-5 py-0.5 font-serif text-base font-black tracking-[0.16em] text-gold-light shadow-[0_10px_24px_rgba(0,0,0,0.42)] before:absolute before:inset-x-5 before:top-0 before:h-px before:bg-white/30 sm:px-7 sm:text-lg">
              業界唯一
            </span>
          </span>

          <span className="font-serif text-[1.35rem] font-black leading-tight tracking-[0.12em] text-black [text-shadow:0_1px_0_rgba(255,255,255,0.55),0_2px_6px_rgba(0,0,0,0.14)] sm:text-[1.75rem]">
            全掲載店舗
          </span>
          <span className="font-serif text-[1.35rem] font-black leading-tight tracking-[0.12em] text-black [text-shadow:0_1px_0_rgba(255,255,255,0.55),0_2px_6px_rgba(0,0,0,0.14)] sm:text-[1.75rem]">
            相談受付実施
          </span>
        </div>
      </div>

      <span className="sr-only">不安や疑問を事前に相談できる、安心のサポート体制。詳しく見る</span>
    </Link>
  );
}
