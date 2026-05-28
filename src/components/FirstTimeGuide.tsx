const concerns = [
  "本当に安全なお店なのか分からない",
  "求人内容と実際が違いそう",
  "怖いお客さんが来ないか不安",
  "ノルマや罰金があるのか分からない",
  "無理にお酒を飲まされそう",
  "人間関係がギスギスしてそう",
  "未経験でも浮かないか不安",
  "辞めたい時に辞められるか心配",
  "送迎や身バレ対策がちゃんとしてるか気になる",
];

const supports = [
  "通常審査+当サイト独自の審査",
  "ブラック店の報告機能",
  "店舗情報の見やすさ改善",
  "エリア / 職種検索",
  "実態確認済み店舗の掲載",
  "未経験歓迎店の表示",
  "女の子目線での安全性確認",
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
            「安心して働ける夜職求人だけを探したい」人のための求人サイトです。
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
              できる限り“安心して働けるお店”を見つけやすくするために、
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
              自分に合った環境で働ける人を増やしたい。
            </p>
            <p className="mt-4">
              そんな思いで運営しています。
            </p>
            <p className="mt-4 text-gold-light">
              まずは気になるお店を、
              <br />
              ゆっくり探してみてください。
            </p>
          </div>

          <div
            id="support-system"
            className="scroll-mt-24 flex items-center gap-3 py-2 text-gold-light/70 sm:scroll-mt-28"
          >
            <span className="h-px flex-1 bg-gold/30" />
            <span className="text-xs tracking-[0.25em]">安心のサポート体制</span>
            <span className="h-px flex-1 bg-gold/30" />
          </div>

          <div className="rounded-2xl border border-gold/40 bg-gradient-to-br from-black/40 to-gold/10 p-5 sm:p-6">
            <p className="font-serif text-xl font-semibold text-gold-light sm:text-2xl">
              業界唯一
              <br />
              全店舗相談受付実施
            </p>

            <div className="mt-5 space-y-4 text-white/85">
              <p>
                「話だけ聞きたいだけだったのに、
                <br />
                面接に行ったらそのまま入店扱いになってしまった…」
              </p>
              <p>
                「面接後に考える予定だったのに、
                <br />
                気づいたら話が進んでいた…」
              </p>
              <p>実際に、こういったケースは少なくありません。</p>
              <p>
                White Night Jobでは、
                <br />
                全店舗相談受付を実施しています。
              </p>
              <p>
                「まだ面接に行くのは少し怖いな…」
              </p>
              <p>
                そんな時でも、
                <br />
                小さな不安や疑問を相談できる環境をご用意しています✨
              </p>
              <p>
                対応の良さにも、
                <br />
                きっと驚いていただけると思います。
              </p>
              <p className="text-gold-light">
                少しでも気になる店舗があった際は、
                <br />
                お気軽に相談・ご連絡してみてください！
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
