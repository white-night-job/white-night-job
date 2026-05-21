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
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted sm:text-base">
          審査済みの優良店のみ厳選。ブラック店は報告フォームからご連絡ください。
        </p>
      </div>
    </section>
  );
}
