export const FOR_SHOPS_HERO_IMAGE = "/images/for-shops-hero.png";

function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 6h16v12H4V6Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function DocIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 4h8l4 4v12H8V4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M16 4v4h4M10 12h8M10 16h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function ForShopsLandingHero() {
  return (
    <section className="fsl-hero-shell" aria-label="掲載をご検討の方はこちら">
      <article className="fsl-hero-image-card">
        <img
          src={FOR_SHOPS_HERO_IMAGE}
          alt=""
          className="fsl-hero-image-card__img"
          width={1024}
          height={682}
          decoding="async"
        />
      </article>

      <article className="fsl-hero-cta-card">
        <a href="#for-shops-contact" className="fsl-btn fsl-btn--gold">
          <span className="fsl-btn__icon">
            <MailIcon />
          </span>
          <span className="fsl-btn__label">掲載のお問い合わせ</span>
          <span className="fsl-btn__chev" aria-hidden="true">
            ›
          </span>
        </a>
        <a href="#for-shops-plans" className="fsl-btn fsl-btn--dark">
          <span className="fsl-btn__icon">
            <DocIcon />
          </span>
          <span className="fsl-btn__label">料金プランを見る</span>
          <span className="fsl-btn__chev" aria-hidden="true">
            ›
          </span>
        </a>
      </article>
    </section>
  );
}
