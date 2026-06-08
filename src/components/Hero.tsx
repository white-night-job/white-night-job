import { SafetyBadge } from "./SafetyBadge";

export function Hero() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-gold/25 bg-white px-5 py-8 shadow-gold sm:px-8 sm:py-10">
      <div className="relative">
        <SafetyBadge size="lg" />
        <h1 className="mt-4 max-w-xl font-serif text-[1.375rem] font-semibold leading-snug text-balance sm:text-2xl md:text-3xl">
          <span className="text-gradient-gold">安心</span>
          <span className="text-charcoal">して働ける、</span>
          <br />
          <span className="text-charcoal">優良認定店専門サイト</span>
        </h1>
        <div className="mt-5 flex flex-col items-center justify-center">
          <div className="inline-flex flex-col items-stretch border-y border-solid border-black [border-block-width:1px]">
            <p className="py-0 font-serif text-2xl font-bold leading-none tracking-[0.25em] text-[#d4af37] drop-shadow-lg [text-shadow:0_1px_0_rgba(255,255,255,0.4),0_3px_12px_rgba(0,0,0,0.24),0_0_22px_rgba(212,175,55,0.42)] sm:text-3xl md:text-4xl">
              White Night
            </p>
          </div>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.5em] text-[#e5c76b] drop-shadow-[0_0_10px_rgba(229,199,107,0.25)] sm:text-sm">
            Job
          </p>
        </div>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted sm:text-base">
          審査済みの優良店のみ厳選。ブラック店は報告フォームからご連絡ください。
        </p>
      </div>
    </section>
  );
}
