import Image from "next/image";

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
    <section className="fsl-hero-wrap">
      <article className="fsl-hero-card">
        <div className="fsl-hero-bg" aria-hidden="true" />
        <div className="fsl-hero-rays" aria-hidden="true" />

        <div className="fsl-hero-body">
          <h1 className="fsl-hero-title">
            <span className="fsl-hero-title-line">優良店だけが集まる</span>
            <span className="fsl-hero-title-line fsl-hero-title-gold">求人サイトへ。</span>
          </h1>

          <p className="fsl-hero-desc">
            White Night Jobは、安心して働ける環境づくりを大切にする店舗様だけを掲載する、夜職専門の求人サイトです。
          </p>

          <div className="fsl-hero-cta">
            <a href="#for-shops-contact" className="fsl-btn fsl-btn-gold">
              <span className="fsl-btn-icon">
                <MailIcon />
              </span>
              <span className="fsl-btn-text">掲載のお問い合わせ</span>
              <span className="fsl-btn-arrow" aria-hidden="true">
                ›
              </span>
            </a>
            <a href="#for-shops-plans" className="fsl-btn fsl-btn-dark">
              <span className="fsl-btn-icon">
                <DocIcon />
              </span>
              <span className="fsl-btn-text">料金プランを見る</span>
              <span className="fsl-btn-arrow" aria-hidden="true">
                ›
              </span>
            </a>
          </div>

          <figure className="fsl-hero-figure" aria-hidden="true">
            <div className="fsl-hero-figure-fill" />
            <Image
              src="/for-shops/hero-consultant.png"
              alt=""
              width={560}
              height={700}
              priority
              className="fsl-hero-photo"
            />
          </figure>
        </div>
      </article>
    </section>
  );
}
