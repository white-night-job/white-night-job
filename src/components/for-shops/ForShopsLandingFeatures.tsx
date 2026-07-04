function ShieldIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3 5 6v6c0 4.5 3 7.8 7 9 4-1.2 7-4.5 7-9V6l-7-3Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="m9 12 2 2 4-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const FEATURES = [
  { title: "優良店のみ掲載", desc: "審査を通過した優良店だけを掲載し、サイト全体の信頼を守ります。" },
  { title: "安心認証制度", desc: "安心認証バッジで、求職者に信頼感のある求人として訴求できます。" },
  { title: "AIチャットによる店舗紹介", desc: "AIチャットが条件に合う店舗を紹介し、自然な導線で応募につなげます。" },
  { title: "ブラック店舗報告システム", desc: "通報窓口を備え、健全な掲載環境の維持に取り組んでいます。" },
  { title: "スマホ特化デザイン", desc: "求職者の多くがスマホから閲覧。見やすく応募しやすいUIです。" },
  { title: "掲載店舗専用ダッシュボード", desc: "求人編集・分析・設定を店舗様ご自身で管理できます。" },
  { title: "応募・表示回数分析", desc: "表示回数や応募数を把握し、採用活動の改善に活かせます。" },
  { title: "店舗ごとの編集機能", desc: "写真・待遇・紹介文などをいつでも更新できます。" },
] as const;

export function ForShopsLandingFeatures() {
  return (
    <section className="fsl-feat">
      <header className="fsl-feat-header">
        <p className="fsl-feat-eyebrow">FEATURES</p>
        <h2 className="fsl-feat-title">White Night Jobの特徴</h2>
      </header>
      <ul className="fsl-feat-list">
        {FEATURES.map((feature) => (
          <li key={feature.title}>
            <article className="fsl-feat-card">
              <span className="fsl-feat-icon" aria-hidden="true">
                <ShieldIcon />
              </span>
              <div className="fsl-feat-copy">
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </div>
              <span className="fsl-feat-arrow" aria-hidden="true">
                ›
              </span>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
