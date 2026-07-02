import Link from "next/link";

type SupportPromoBannerProps = {
  className?: string;
  embedded?: boolean;
  inset?: boolean;
  standalone?: boolean;
};

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
        className={`group flex min-h-[3.25rem] w-full items-center justify-center px-4 py-3 transition hover:opacity-90 sm:min-h-[3.5rem] sm:px-6 ${className}`}
      >
        <div className="flex flex-col items-center gap-1 text-center sm:flex-row sm:gap-4">
          <span className="font-serif text-xs font-bold tracking-[0.2em] text-[#D4AF37] sm:text-sm">
            業界唯一
          </span>
          <span className="hidden h-4 w-px bg-white/25 sm:block" aria-hidden />
          <span className="font-serif text-sm font-semibold tracking-wide text-white sm:text-base">
            全掲載店舗 相談受付実施
          </span>
        </div>
        <span className="sr-only">不安や疑問を事前に相談できる、安心のサポート体制。詳しく見る</span>
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
