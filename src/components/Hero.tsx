import { SafetyBadge } from "./SafetyBadge";

function HeroBackground() {
  return (
    <>
      <div className="hero-gold-bg absolute inset-0" aria-hidden />
      <div className="hero-gold-corner-vignette absolute inset-0" aria-hidden />
      <div className="hero-metal-brush absolute inset-0" aria-hidden />
      <div className="hero-geo-pattern absolute inset-0" aria-hidden />
      <div className="hero-gold-lines absolute inset-0" aria-hidden />
      <div className="hero-mirror-gloss absolute inset-0" aria-hidden />
      <div
        className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(212,201,168,0.35)] to-transparent sm:inset-x-10"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-8 bottom-0 h-px bg-gradient-to-r from-transparent via-[rgba(122,107,70,0.4)] to-transparent sm:inset-x-10"
        aria-hidden
      />
    </>
  );
}

export function Hero() {
  return (
    <section className="hero-panel relative overflow-hidden rounded-3xl px-5 py-10 sm:px-8 sm:py-12 md:py-14">
      <HeroBackground />

      <div className="relative">
        <SafetyBadge size="lg" variant="hero" />

        <div className="hero-brand-block relative mx-auto mt-5 max-w-md text-center sm:mt-6">
          <div className="hero-brand-backdrop" aria-hidden />
          <p className="hero-brand-metal relative font-serif text-[2.5rem] font-black leading-none tracking-[0.2em] sm:text-[3.25rem] md:text-[3.75rem]">
            White Night
          </p>
          <div className="hero-brand-line relative mx-auto mt-4 w-full max-w-[18rem] sm:max-w-[22rem]" aria-hidden />
          <p className="hero-brand-metal relative mt-3 font-serif text-base font-bold uppercase tracking-[0.6em] sm:text-lg md:text-xl">
            Job
          </p>
        </div>

        <div className="hero-title-glass relative mt-6 rounded-2xl px-4 py-4 sm:mt-7 sm:px-5 sm:py-5">
          <h1 className="hero-title font-serif text-[2rem] leading-relaxed text-balance sm:text-[2.25rem] sm:leading-relaxed md:text-[2.9rem] md:leading-relaxed">
            安心して働ける、
            <br />
            優良認定店専門サイト
          </h1>
        </div>

        <p className="hero-desc relative mt-5 max-w-lg text-sm leading-relaxed sm:mt-6 sm:text-base">
          審査済みの優良店のみ厳選。ブラック店は報告フォームからご連絡ください。
        </p>
      </div>
    </section>
  );
}
