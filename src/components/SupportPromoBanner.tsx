import Link from "next/link";
import { TOP_CTA_PROMO_LAYOUT } from "@/components/top-cta-styles";

type SupportPromoBannerProps = {
  className?: string;
};

const EDGE_LINE_CLASS =
  "pointer-events-none absolute top-3 bottom-3 w-3 bg-gradient-to-b from-black via-[#15110b] to-black sm:top-3.5 sm:bottom-3.5 sm:w-3.5";

export function SupportPromoBanner({ className = "" }: SupportPromoBannerProps) {
  return (
    <Link
      href="#support-section"
      className={`animate-fade-up group relative block overflow-hidden rounded-3xl border border-gold-dark/40 bg-[linear-gradient(135deg,#fff3b4_0%,#e6bd52_24%,#9c6716_52%,#f8df79_76%,#b06f16_100%)] shadow-[0_18px_45px_rgba(201,169,98,0.34),0_0_32px_rgba(232,213,163,0.32),inset_0_1px_0_rgba(255,255,255,0.65)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_60px_rgba(201,169,98,0.48),0_0_50px_rgba(232,213,163,0.55),inset_0_1px_0_rgba(255,255,255,0.75)] ${TOP_CTA_PROMO_LAYOUT} ${className}`}
    >
      <span
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_0%,rgba(255,255,255,0.18)_27%,rgba(255,255,255,0.72)_43%,rgba(255,255,255,0.18)_58%,transparent_100%),radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.58),transparent_16%),radial-gradient(circle_at_78%_72%,rgba(255,255,255,0.36),transparent_18%)] opacity-95"
        aria-hidden
      />

      <span
        className={`${EDGE_LINE_CLASS} left-0 origin-left -skew-x-6 shadow-[4px_0_0_rgba(0,0,0,0.45)]`}
        aria-hidden
      />
      <span
        className="pointer-events-none absolute bottom-3 left-2 top-3 w-1.5 origin-left -skew-x-6 bg-black/80 sm:bottom-3.5 sm:left-2.5 sm:top-3.5 sm:w-2"
        aria-hidden
      />
      <span
        className={`${EDGE_LINE_CLASS} right-0 origin-right skew-x-6 shadow-[-4px_0_0_rgba(0,0,0,0.45)]`}
        aria-hidden
      />
      <span
        className="pointer-events-none absolute bottom-3 right-2 top-3 w-1.5 origin-right skew-x-6 bg-black/80 sm:bottom-3.5 sm:right-2.5 sm:top-3.5 sm:w-2"
        aria-hidden
      />

      <span className="sparkle pointer-events-none left-[5%] top-[18%]">✦</span>
      <span className="sparkle animation-delay-150 pointer-events-none right-[5%] top-[16%] text-sm">
        ✧
      </span>
      <span className="sparkle animation-delay-300 pointer-events-none left-[8%] bottom-[20%] text-xs">
        ✦
      </span>
      <span className="sparkle animation-delay-450 pointer-events-none right-[8%] bottom-[18%] text-xs">
        ✧
      </span>
      <span className="sparkle animation-delay-600 pointer-events-none left-[48%] top-[10%] text-[10px]">
        ✦
      </span>

      <div className="relative z-10 flex w-full flex-col items-center justify-center gap-1 px-3.5 sm:gap-1.5 sm:px-4">
        <span className="flex shrink-0 items-center justify-center gap-1.5 text-[10px] font-bold leading-none tracking-[0.2em] text-[#7b4f0b] drop-shadow-[0_1px_0_rgba(255,255,255,0.45)] sm:text-xs">
          <span>★</span>
          <span>★</span>
          <span className="font-serif text-sm text-[#7b4f0b] sm:text-base">♛</span>
          <span>★</span>
          <span>★</span>
        </span>

        <div className="flex w-full flex-col items-center gap-0.5 text-center sm:gap-1">
          <span className="relative flex w-full max-w-[24rem] items-center justify-center sm:max-w-[30rem]">
            <span
              className="absolute -left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 bg-black [clip-path:polygon(100%_0,0_50%,100%_100%)] shadow-[0_5px_12px_rgba(0,0,0,0.35)] sm:-left-4 sm:h-6 sm:w-6"
              aria-hidden
            />
            <span
              className="absolute -right-3.5 top-1/2 h-5 w-5 -translate-y-1/2 bg-black [clip-path:polygon(0_0,100%_50%,0_100%)] shadow-[0_5px_12px_rgba(0,0,0,0.35)] sm:-right-4 sm:h-6 sm:w-6"
              aria-hidden
            />
            <span className="relative z-10 flex w-full min-w-0 items-center justify-center border border-black/80 bg-[linear-gradient(180deg,#2b2418_0%,#050505_44%,#1a140d_100%)] px-8 py-0.5 font-serif text-sm font-black leading-snug tracking-[0.12em] text-gold-light shadow-[0_10px_24px_rgba(0,0,0,0.42)] before:absolute before:inset-x-8 before:top-0 before:h-px before:bg-white/30 sm:px-12 sm:text-base">
              業界唯一
            </span>
          </span>

          <span className="w-full font-serif text-base font-black leading-snug tracking-[0.06em] text-black [text-shadow:0_1px_0_rgba(255,255,255,0.55),0_2px_6px_rgba(0,0,0,0.12)] sm:text-lg">
            全掲載店舗
          </span>
          <span className="w-full font-serif text-base font-black leading-snug tracking-[0.06em] text-black [text-shadow:0_1px_0_rgba(255,255,255,0.55),0_2px_6px_rgba(0,0,0,0.12)] sm:text-lg">
            相談受付実施
          </span>
        </div>
      </div>

      <span className="sr-only">不安や疑問を事前に相談できる、安心のサポート体制。詳しく見る</span>
    </Link>
  );
}
