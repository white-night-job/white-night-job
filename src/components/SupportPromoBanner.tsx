import Link from "next/link";
import { TOP_CTA_PROMO_LAYOUT } from "@/components/top-cta-styles";
import { luxuryPremiumCard } from "@/lib/luxury-styles";

type SupportPromoBannerProps = {
  className?: string;
  embedded?: boolean;
  inset?: boolean;
  standalone?: boolean;
};

function PromoContent() {
  return (
  <>
      <span className="flex shrink-0 items-center justify-center gap-1.5 text-[10px] font-bold leading-none tracking-[0.2em] text-[#e8e0cc] sm:text-xs">
        <span className="text-[#d4c9a8]">★</span>
        <span className="text-[#d4c9a8]">★</span>
        <span className="font-serif text-sm text-[#faf9f7] sm:text-base">♛</span>
        <span className="text-[#d4c9a8]">★</span>
        <span className="text-[#d4c9a8]">★</span>
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
          <span className="relative z-10 flex w-full min-w-0 items-center justify-center border border-[#b8a876]/60 bg-gradient-to-b from-charcoal via-void to-dark-brown px-8 py-1 font-serif text-sm font-black leading-snug tracking-[0.12em] text-gradient-gold shadow-metal before:absolute before:inset-x-8 before:top-0 before:h-px before:bg-[#d4c9a8]/50 after:absolute after:inset-x-8 after:bottom-0 after:h-px after:bg-[#7a6b46]/40 sm:px-12 sm:text-base">
            業界唯一
          </span>
        </span>

        <span className="w-full font-serif text-sm font-black leading-snug tracking-[0.06em] text-[#faf9f7] sm:text-base">
          全掲載店舗
        </span>
        <span className="w-full font-serif text-sm font-black leading-snug tracking-[0.06em] text-[#faf9f7] sm:text-base">
          相談受付実施
        </span>
      </div>
    </>
  );
}

export function SupportPromoBanner({
  className = "",
  embedded = false,
  inset = false,
  standalone = false,
}: SupportPromoBannerProps) {
  if (standalone) {
    return (
      <Link
        href="#support-section"
        className={`group block px-4 py-3 transition hover:opacity-95 sm:px-5 sm:py-4 ${TOP_CTA_PROMO_LAYOUT} ${className}`}
      >
        <div className="relative z-10 flex w-full flex-col items-center justify-center gap-0.5 sm:gap-1">
          <PromoContent />
        </div>
        <span className="sr-only">不安や疑問を事前に相談できる、安心のサポート体制。詳しく見る</span>
      </Link>
    );
  }

  if (embedded && inset) {
    return (
      <Link
        href="#support-section"
        className={`group block px-3 py-2.5 transition hover:opacity-95 sm:px-4 sm:py-3 ${TOP_CTA_PROMO_LAYOUT} ${className}`}
      >
        <div className="relative z-10 flex w-full flex-col items-center justify-center gap-0.5 sm:gap-1">
          <PromoContent />
        </div>
        <span className="sr-only">不安や疑問を事前に相談できる、安心のサポート体制。詳しく見る</span>
      </Link>
    );
  }

  if (embedded) {
    return (
      <Link
        href="#support-section"
        className={`group block rounded-2xl border border-[#c4b896]/35 bg-black/20 px-3 py-4 transition hover:bg-black/28 sm:px-4 sm:py-5 ${TOP_CTA_PROMO_LAYOUT} ${className}`}
      >
        <div className="relative z-10 flex w-full flex-col items-center justify-center gap-1 sm:gap-1.5">
          <PromoContent />
        </div>
        <span className="sr-only">不安や疑問を事前に相談できる、安心のサポート体制。詳しく見る</span>
      </Link>
    );
  }

  return (
    <Link
      href="#support-section"
      className={`animate-fade-up group relative block overflow-hidden rounded-3xl transition-all duration-300 hover:-translate-y-1 hover:shadow-luxury-glow ${luxuryPremiumCard} ${TOP_CTA_PROMO_LAYOUT} ${className}`}
    >
      <span
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_0%,rgba(255,255,255,0.5)_28%,rgba(249,231,165,0.35)_48%,rgba(255,255,255,0.2)_68%,transparent_100%)]"
        aria-hidden
      />
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-light to-transparent"
        aria-hidden
      />
      <span
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold-dark/60 to-transparent"
        aria-hidden
      />

      <div className="relative z-10 flex w-full flex-col items-center justify-center gap-1 px-3.5 sm:gap-1.5 sm:px-4">
        <PromoContent />
      </div>

      <span className="sr-only">不安や疑問を事前に相談できる、安心のサポート体制。詳しく見る</span>
    </Link>
  );
}
