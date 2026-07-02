import { SafetyBadge } from "./SafetyBadge";

function HeroBackground() {
  return (
    <>
      <div className="hero-gold-bg absolute inset-0" aria-hidden />
      <div className="hero-gold-corner-vignette absolute inset-0" aria-hidden />
      <div className="hero-gold-texture absolute inset-0" aria-hidden />
      <div className="hero-geo-pattern absolute inset-0" aria-hidden />
      <div className="hero-glow hero-glow--center" aria-hidden />
      <div className="hero-glow hero-glow--left" aria-hidden />
      <div className="hero-glow hero-glow--right" aria-hidden />
      <div className="hero-hairline absolute inset-0" aria-hidden />
      <div className="luxury-shimmer pointer-events-none absolute inset-0 opacity-35" aria-hidden />
      <div
        className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent sm:inset-x-8"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-6 bottom-0 h-px bg-gradient-to-r from-transparent via-gold-dark/50 to-transparent sm:inset-x-8"
        aria-hidden
      />
    </>
  );
}

export function Hero() {
  return (
    <section className="hero-panel relative overflow-hidden rounded-3xl px-6 py-10 sm:px-8 sm:py-12 md:py-14">
      <HeroBackground />

      <div className="relative">
        <SafetyBadge size="lg" variant="hero" />

        <h1 className="hero-title mt-4 max-w-xl font-serif text-[1.65rem] leading-snug text-balance sm:mt-5 sm:text-[1.8rem] md:text-[2.25rem]">
          安心して働ける、
          <br />
          優良認定店専門サイト
        </h1>

        <div className="mt-6 flex flex-col items-center justify-center sm:mt-7">
          <p className="font-serif text-[2rem] font-black leading-none tracking-[0.22em] hero-brand-metal sm:text-[2.75rem] md:text-[3.25rem]">
            White Night
          </p>
          <div className="hero-brand-line mt-3 w-full max-w-[16rem] sm:max-w-[20rem]" aria-hidden />
          <p className="mt-3 font-serif text-sm font-bold uppercase tracking-[0.55em] hero-brand-metal sm:text-base md:text-lg">
            Job
          </p>
        </div>

        <p className="mt-5 max-w-lg text-sm leading-relaxed text-white/85 sm:mt-6 sm:text-base">
          審査済みの優良店のみ厳選。ブラック店は報告フォームからご連絡ください。
        </p>
      </div>
    </section>
  );
}
