import { SafetyBadge } from "./SafetyBadge";
import { luxuryDarkCard } from "@/lib/luxury-styles";

export function Hero() {
  return (
    <section
      className={`relative overflow-hidden rounded-2xl px-5 py-6 sm:px-7 sm:py-8 ${luxuryDarkCard}`}
    >
      <div className="luxury-shimmer pointer-events-none absolute inset-0 opacity-40" aria-hidden />
      <div className="relative">
        <SafetyBadge size="lg" />
        <h1 className="mt-3 max-w-xl font-serif text-[1.375rem] font-semibold leading-snug text-balance sm:text-2xl md:text-3xl">
          <span className="text-gradient-gold">安心</span>
          <span className="text-white/90">して働ける、</span>
          <br />
          <span className="text-white/90">優良認定店専門サイト</span>
        </h1>
        <div className="mt-4 flex flex-col items-center justify-center">
          <div className="inline-flex flex-col items-stretch border-y border-gold/50">
            <p className="py-0 font-serif text-2xl font-bold leading-none tracking-[0.25em] text-gradient-gold sm:text-3xl md:text-4xl">
              White Night
            </p>
          </div>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.5em] text-gold-mid sm:text-sm">
            Job
          </p>
        </div>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/70 sm:text-base">
          審査済みの優良店のみ厳選。ブラック店は報告フォームからご連絡ください。
        </p>
      </div>
    </section>
  );
}
