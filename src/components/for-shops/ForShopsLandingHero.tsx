import { IMAGE_ALT_BRAND, SITE_FORMAL_NAME } from "@/lib/site";

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
          alt={IMAGE_ALT_BRAND}
          className="fsl-hero-image-card__img"
          width={1024}
          height={682}
          decoding="async"
        />

        <div className="fsl-hero-image-card__shade" aria-hidden="true" />

        <div className="fsl-hero-image-card__label-wrap">
          <p className="fsl-hero-image-card__label">掲載をご検討の方はこちら</p>
        </div>

        <div className="fsl-hero-image-card__copy">
          <h1 className="fsl-hero-image-card__title">
            <span className="fsl-hero-image-card__title-main">優良店だけが集まる</span>
            <span className="fsl-hero-image-card__title-gold">求人サイトへ。</span>
          </h1>

          <p className="fsl-hero-image-card__desc">
            {SITE_FORMAL_NAME}は、安心して働ける環境づくりを大切にする店舗様だけを掲載する、夜職専門の求人サイトです。
          </p>
        </div>
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
