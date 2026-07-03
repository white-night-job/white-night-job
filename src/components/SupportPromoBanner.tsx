import Link from "next/link";

type SupportPromoBannerProps = {
  className?: string;
  embedded?: boolean;
  inset?: boolean;
  standalone?: boolean;
};

function CrownIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M4 17h16M6 17l1.2-7.2 3.3 3.6 2.5-6.2 2.5 6.2 3.3-3.6L18 17"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 17v1.5c0 .55.45 1 1 1h12c.55 0 1-.45 1-1V17"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
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
        className={`hero-promo-plate group flex min-h-[3.5rem] w-full items-center justify-center gap-2.5 px-5 py-3 transition hover:opacity-95 sm:min-h-[3.75rem] sm:gap-3 sm:px-6 sm:py-3.5 ${className}`}
      >
        <CrownIcon className="hero-promo-crown h-[18px] w-[18px] shrink-0 sm:h-5 sm:w-5" />
        <div className="flex flex-col items-center gap-0.5 text-center">
          <span className="text-[8px] font-medium tracking-[0.3em] text-[#c4a574]/60 sm:text-[9px]">
            業界唯一
          </span>
          <span className="font-serif text-[15px] font-semibold tracking-[0.1em] text-white sm:text-lg sm:tracking-[0.12em]">
            全掲載店舗 相談受付実施
          </span>
        </div>
        <span className="sr-only">
          不安や疑問を事前に相談できる、安心のサポート体制。詳しく見る
        </span>
      </Link>
    );
  }

  if (embedded && inset) {
    return (
      <Link
        href="#support-section"
        className={`group block px-3 py-2.5 transition hover:opacity-95 sm:px-4 sm:py-3 ${className}`}
      >
        <div className="relative z-10 flex w-full flex-col items-center justify-center gap-0.5 sm:gap-1">
          <span className="font-serif text-sm font-bold text-[#D4AF37]">業界唯一</span>
          <span className="font-serif text-sm text-white">全掲載店舗 相談受付実施</span>
        </div>
        <span className="sr-only">不安や疑問を事前に相談できる、安心のサポート体制。詳しく見る</span>
      </Link>
    );
  }

  if (embedded) {
    return (
      <Link
        href="#support-section"
        className={`group block rounded-xl bg-[#111111] px-3 py-4 transition hover:opacity-95 sm:px-4 sm:py-5 ${className}`}
      >
        <div className="relative z-10 flex w-full flex-col items-center justify-center gap-1 sm:gap-1.5">
          <span className="font-serif text-sm font-bold text-[#D4AF37]">業界唯一</span>
          <span className="font-serif text-sm text-white">全掲載店舗 相談受付実施</span>
        </div>
        <span className="sr-only">不安や疑問を事前に相談できる、安心のサポート体制。詳しく見る</span>
      </Link>
    );
  }

  return (
    <Link
      href="#support-section"
      className={`animate-fade-up group block rounded-2xl bg-[#111111] px-4 py-4 transition hover:opacity-95 sm:px-6 sm:py-5 ${className}`}
    >
      <div className="flex flex-col items-center gap-1 text-center sm:flex-row sm:justify-center sm:gap-4">
        <span className="font-serif text-xs font-bold tracking-[0.2em] text-[#D4AF37] sm:text-sm">
          業界唯一
        </span>
        <span className="font-serif text-sm font-semibold text-white sm:text-base">
          全掲載店舗 相談受付実施
        </span>
      </div>
      <span className="sr-only">不安や疑問を事前に相談できる、安心のサポート体制。詳しく見る</span>
    </Link>
  );
}
