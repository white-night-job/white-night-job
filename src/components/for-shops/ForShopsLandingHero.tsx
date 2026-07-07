export const FOR_SHOPS_HERO_IMAGE = "/images/for-shops-hero.jpg";

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

function SparkIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <path
        d="M5 0 5.8 3.6 9.5 4.2 5.8 4.8 5 8.5 4.2 4.8.5 4.2 4.2 3.6 5 0Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function ForShopsLandingHero() {
  return (
    <section className="fsl-hero-shell" aria-label="掲載をご検討の方はこちら">
      <article
        className="fsl-hero"
        style={{ ["--fsl-hero-photo" as string]: `url(${FOR_SHOPS_HERO_IMAGE})` }}
      >
        <div className="fsl-hero__canvas" aria-hidden="true">
          <div className="fsl-hero__base" />
          <div className="fsl-hero__sheen">
            <span className="fsl-hero__sheen-line fsl-hero__sheen-line--1" />
            <span className="fsl-hero__sheen-line fsl-hero__sheen-line--2" />
            <span className="fsl-hero__sheen-line fsl-hero__sheen-line--3" />
          </div>
          <div className="fsl-hero__glow fsl-hero__glow--a" />
          <div className="fsl-hero__glow fsl-hero__glow--b" />
        </div>

        <div className="fsl-hero__layout">
          <div className="fsl-hero__upper">
            <div className="fsl-hero__content">
              <p className="fsl-hero__label">— 掲載をご検討の方はこちら —</p>

              <h1 className="fsl-hero__title">
                <span className="fsl-hero__title-main">優良店だけが集まる</span>
                <span className="fsl-hero__title-gold">求人サイトへ。</span>
              </h1>

              <span className="fsl-hero__spark" aria-hidden="true">
                <SparkIcon />
              </span>

              <p className="fsl-hero__desc">
                White Night Jobは、安心して働ける環境づくりを大切にする店舗様だけを掲載する、夜職専門の求人サイトです。
              </p>
            </div>

            <div className="fsl-hero__visual" aria-hidden="true" />
          </div>

          <div className="fsl-hero__actions">
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
          </div>
        </div>
      </article>
    </section>
  );
}
