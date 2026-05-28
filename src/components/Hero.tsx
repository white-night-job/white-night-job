import { SafetyBadge } from "./SafetyBadge";

export function Hero() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-gold/25 bg-white px-5 py-8 shadow-gold sm:px-8 sm:py-10">
      <div className="relative">
        <div className="mb-5 flex flex-col items-center gap-1">
          <div className="rounded-2xl border border-gold/35 bg-gradient-to-br from-charcoal via-[#1b150d] to-[#3a2b13] px-6 py-4 text-center shadow-[0_0_28px_rgba(201,169,98,0.24)]">
            <p className="font-serif text-xl font-bold tracking-[0.25em] text-white drop-shadow-[0_0_14px_rgba(232,213,163,0.42)] sm:text-2xl">
              White Night
            </p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.5em] text-[#d4af37] sm:text-sm">
              Job
            </p>
          </div>
        </div>
        <SafetyBadge size="lg" />
        <h1 className="mt-4 max-w-xl font-serif text-[1.375rem] font-semibold leading-snug text-balance sm:text-2xl md:text-3xl">
          <span className="text-gradient-gold">安心</span>
          <span className="text-charcoal">して働ける、</span>
          <br />
          <span className="text-charcoal">優良認定店専門サイト</span>
        </h1>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted sm:text-base">
          審査済みの優良店のみ厳選。ブラック店は報告フォームからご連絡ください。
        </p>
      </div>
    </section>
  );
}
