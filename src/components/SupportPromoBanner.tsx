import Link from "next/link";
import { TOP_CTA_PROMO_LAYOUT } from "@/components/top-cta-styles";

type SupportPromoBannerProps = {
  className?: string;
};

export function SupportPromoBanner({ className = "" }: SupportPromoBannerProps) {
  return (
    <Link
      href="#support-section"
      className={`animate-fade-up group relative block overflow-hidden rounded-3xl border border-gold/55 bg-gradient-to-br from-void via-charcoal to-[#14100a] shadow-luxury transition-all duration-300 hover:-translate-y-0.5 hover:border-gold-mid/70 hover:shadow-luxury-glow ${TOP_CTA_PROMO_LAYOUT} ${className}`}
    >
      <span
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_0%,rgba(249,226,125,0.06)_30%,rgba(249,226,125,0.18)_48%,rgba(249,226,125,0.06)_66%,transparent_100%)]"
        aria-hidden
      />
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-light/60 to-transparent"
        aria-hidden
      />
      <span
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold-dark/50 to-transparent"
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

      <div className="relative z-10 flex w-full flex-col items-center justify-center gap-1 px-3.5 sm:gap-1.5 sm:px-4">
        <span className="flex shrink-0 items-center justify-center gap-1.5 text-[10px] font-bold leading-none tracking-[0.2em] text-gold-mid sm:text-xs">
          <span>★</span>
          <span>★</span>
          <span className="font-serif text-sm text-gold-light sm:text-base">♛</span>
          <span>★</span>
          <span>★</span>
        </span>

        <div className="flex w-full flex-col items-center gap-0.5 text-center sm:gap-1">
          <span className="relative flex w-full max-w-[24rem] items-center justify-center sm:max-w-[30rem]">
            <span
              className="absolute -left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 bg-gradient-gold-metal [clip-path:polygon(100%_0,0_50%,100%_100%)] shadow-metal sm:-left-4 sm:h-6 sm:w-6"
              aria-hidden
            />
            <span
              className="absolute -right-3.5 top-1/2 h-5 w-5 -translate-y-1/2 bg-gradient-gold-metal [clip-path:polygon(0_0,100%_50%,0_100%)] shadow-metal sm:-right-4 sm:h-6 sm:w-6"
              aria-hidden
            />
            <span className="relative z-10 flex w-full min-w-0 items-center justify-center border border-gold/50 bg-gradient-to-b from-charcoal via-void to-charcoal px-8 py-0.5 font-serif text-sm font-black leading-snug tracking-[0.12em] text-gradient-gold shadow-metal before:absolute before:inset-x-8 before:top-0 before:h-px before:bg-gold-light/40 sm:px-12 sm:text-base">
              業界唯一
            </span>
          </span>

          <span className="w-full font-serif text-base font-black leading-snug tracking-[0.06em] text-gold-light sm:text-lg">
            全掲載店舗
          </span>
          <span className="w-full font-serif text-base font-black leading-snug tracking-[0.06em] text-gold-light sm:text-lg">
            相談受付実施
          </span>
        </div>
      </div>

      <span className="sr-only">不安や疑問を事前に相談できる、安心のサポート体制。詳しく見る</span>
    </Link>
  );
}
