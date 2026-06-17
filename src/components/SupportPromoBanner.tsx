import Link from "next/link";

export function SupportPromoBanner() {
  return (
    <Link
      href="#support-section"
      className="animate-fade-up group relative block overflow-hidden rounded-3xl border border-gold-dark/40 bg-[linear-gradient(135deg,#fff3b4_0%,#e6bd52_24%,#9c6716_52%,#f8df79_76%,#b06f16_100%)] px-5 py-5 text-center shadow-[0_18px_45px_rgba(201,169,98,0.34),0_0_32px_rgba(232,213,163,0.32),inset_0_1px_0_rgba(255,255,255,0.65)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_60px_rgba(201,169,98,0.48),0_0_50px_rgba(232,213,163,0.55),inset_0_1px_0_rgba(255,255,255,0.75)] sm:px-8 sm:py-6"
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
      <span className="relative mx-auto mb-0.5 flex items-center justify-center gap-2 text-xs font-bold tracking-[0.28em] text-[#7b4f0b] drop-shadow-[0_1px_0_rgba(255,255,255,0.45)] sm:text-sm">
        <span>★</span>
        <span>★</span>
        <span className="font-serif text-base leading-none text-[#7b4f0b] drop-shadow-[0_0_8px_rgba(123,79,11,0.22)] sm:text-lg">
          ♛
        </span>
        <span>★</span>
        <span>★</span>
      </span>
      <span className="relative mx-auto inline-flex min-w-[12rem] items-center justify-center sm:min-w-[17rem]">
        <span
          className="absolute -left-4 top-1/2 h-7 w-7 -translate-y-1/2 bg-black [clip-path:polygon(100%_0,0_50%,100%_100%)] shadow-[0_8px_18px_rgba(0,0,0,0.35)] sm:-left-5 sm:h-8 sm:w-8"
          aria-hidden
        />
        <span
          className="absolute -right-4 top-1/2 h-7 w-7 -translate-y-1/2 bg-black [clip-path:polygon(0_0,100%_50%,0_100%)] shadow-[0_8px_18px_rgba(0,0,0,0.35)] sm:-right-5 sm:h-8 sm:w-8"
          aria-hidden
        />
        <span className="relative z-10 inline-flex items-center justify-center border border-black/80 bg-[linear-gradient(180deg,#2b2418_0%,#050505_44%,#1a140d_100%)] px-8 py-1.5 font-serif text-xl font-black tracking-[0.18em] text-gold-light shadow-[0_12px_30px_rgba(0,0,0,0.48),0_0_18px_rgba(0,0,0,0.25)] drop-shadow-[0_1px_0_rgba(255,255,255,0.18)] before:absolute before:inset-x-8 before:top-0 before:h-px before:bg-white/30 sm:px-14 sm:text-2xl">
          業界唯一
        </span>
      </span>
      <span className="relative mx-auto mt-3 block max-w-[19rem] py-0.5 font-serif text-[2.15rem] font-black leading-[1.24] tracking-[0.14em] text-black [text-shadow:0_1px_0_rgba(255,255,255,0.55),0_2px_8px_rgba(0,0,0,0.16)] sm:max-w-none sm:text-[3.5rem] sm:leading-[1.14]">
        全掲載店舗
        <br className="sm:hidden" />
        相談受付実施
      </span>
      <span className="relative mt-1 block text-sm font-semibold text-black/75">
        不安や疑問を事前に相談できる、安心のサポート体制
      </span>
      <span className="relative mx-auto mt-3 inline-flex min-h-9 items-center justify-center border border-black bg-gradient-to-r from-black via-[#18130d] to-black px-7 py-2 text-sm font-bold text-white shadow-[0_0_20px_rgba(232,213,163,0.28)] transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-[0_0_28px_rgba(232,213,163,0.42)]">
        詳しく見る
        <span className="ml-3 text-white">→</span>
      </span>
    </Link>
  );
}
