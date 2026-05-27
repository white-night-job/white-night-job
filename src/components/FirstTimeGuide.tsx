const concerns = [
  "お店の実態が分からない",
  "ノルマや罰金が怖い",
  "人間関係が不安",
  "無理な営業をさせられそう",
  "求人内容と実際が違う",
];

const supports = [
  "当サイト独自の審査",
  "ブラック報告機能",
  "店舗情報の見やすさ",
  "エリア・職種検索",
  "実態確認",
];

export function FirstTimeGuide() {
  return (
    <section
      id="first-time-guide"
      className="scroll-mt-20 relative overflow-hidden rounded-3xl border border-gold/30 bg-gradient-to-br from-charcoal via-[#18130b] to-[#2b2112] px-5 py-8 text-white shadow-gold sm:px-8 sm:py-10 md:px-10"
    >
      <div
        className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-gold/20 blur-3xl"
        aria-hidden
      />
      <div
        className="absolute -bottom-20 -left-16 h-52 w-52 rounded-full bg-gold-light/10 blur-3xl"
        aria-hidden
      />

      <div className="relative">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.35em] text-gold-light/80">
          Guide
        </p>
        <h2 className="font-serif text-2xl font-semibold text-gold-light sm:text-3xl">
          初めての方へ
        </h2>

        <div className="mt-6 space-y-6 text-sm leading-8 text-white/85 sm:text-base sm:leading-9">
          <p>
            White Night Jobは、
            <br />
            「安心して働ける夜職求人を探したい」人のための求人サイトです。
          </p>

          <div>
            <p>夜職を探していると、</p>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {concerns.map((item) => (
                <li
                  key={item}
                  className="rounded-2xl border border-gold/20 bg-white/5 px-4 py-3 text-white/90"
                >
                  <span className="mr-2 text-gold-light">・</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <p>そんな不安を感じることがあります。</p>

          <div>
            <p>
              このサイトでは、
              <br />
              “安心して働けるお店”を見つけやすくするために、
            </p>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {supports.map((item) => (
                <li
                  key={item}
                  className="rounded-2xl border border-gold/30 bg-gold/10 px-4 py-3 font-medium text-gold-light"
                >
                  <span className="mr-2">・</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-gold/30 bg-black/20 p-5 sm:p-6">
            <p>
              「夜職＝怖い」ではなく、
              <br />
              自分に合った環境で楽しく働ける人を増やしたい。
            </p>
            <p className="mt-4">
              その思いで運営させていただいております。
            </p>
            <p className="mt-4 text-gold-light">
              まずは気になるお店を、
              <br />
              ゆっくり探してみてください。
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
