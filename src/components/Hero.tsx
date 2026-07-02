import { SafetyBadge } from "./SafetyBadge";

function HeroBackground() {
  return (
    <>
      <div className="hero-gold-bg absolute inset-0" aria-hidden />
      <div className="hero-gold-layer absolute inset-0" aria-hidden />
      <div className="hero-gold-lighting absolute inset-0" aria-hidden />
      <div className="hero-gold-corner-vignette absolute inset-0" aria-hidden />
      <div className="hero-metal-brush absolute inset-0" aria-hidden />
      <div className="hero-fine-lame absolute inset-0" aria-hidden />
      <div className="hero-geo-pattern absolute inset-0" aria-hidden />
      <div className="hero-mirror-gloss absolute inset-0" aria-hidden />
      <div className="hero-metal-frame absolute inset-3 rounded-[20px] sm:inset-4" aria-hidden />
      <div className="hero-gold-lines absolute inset-0" aria-hidden />
    </>
  );
}

export function Hero() {
  return (
    <section className="hero-panel relative overflow-hidden rounded-3xl px-6 py-12 sm:px-10 sm:py-14 md:px-12 md:py-16">
      <HeroBackground />

      <div className="relative flex flex-col items-center text-center">
        <SafetyBadge size="lg" variant="hero" />

        <div className="hero-title-plate relative mt-8 w-full max-w-2xl sm:mt-10">
          <h1 className="hero-title relative font-serif text-[2.5rem] leading-relaxed text-balance sm:text-[2.8rem] md:text-[3.65rem] md:leading-relaxed">
            安心して働ける、
            <br />
            優良認定店専門サイト
          </h1>
        </div>

        <div className="hero-brand-block relative mt-10 w-full max-w-lg sm:mt-12">
          <p className="hero-brand-metal font-serif text-[2.75rem] font-black leading-none tracking-[0.18em] sm:text-[3.5rem] md:text-[4.25rem]">
            White Night
          </p>
          <div className="hero-brand-line mx-auto mt-5 w-full max-w-[20rem] sm:max-w-[24rem]" aria-hidden />
          <p className="hero-brand-metal mt-4 font-serif text-base font-bold uppercase tracking-[0.65em] sm:text-lg md:text-xl">
            Job
          </p>
        </div>

        <p className="hero-desc relative mt-10 max-w-md text-sm leading-relaxed sm:mt-12 sm:text-base">
          審査済みの優良店のみ厳選。ブラック店は報告フォームからご連絡ください。
        </p>
      </div>
    </section>
  );
}
