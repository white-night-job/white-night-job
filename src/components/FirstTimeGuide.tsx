import { luxuryPremiumCard } from "@/lib/luxury-styles";
import { SITE_BRAND_JA, SITE_NAME } from "@/lib/site";

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
      className={`relative scroll-mt-20 overflow-hidden px-5 py-8 sm:px-8 sm:py-10 md:px-10 ${luxuryPremiumCard}`}
    >
      <div className="luxury-shimmer pointer-events-none absolute inset-0 opacity-45" aria-hidden />
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-champagne/50 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-20 -left-16 h-52 w-52 rounded-full bg-gold-mid/20 blur-3xl"
        aria-hidden
      />

      <div className="relative">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.35em] text-gold-dark">
          Guide
        </p>
        <h2 className="font-serif text-2xl font-semibold text-gradient-gold sm:text-3xl">
          初めての方へ
        </h2>

        <div className="mt-6 space-y-6 text-sm leading-8 text-charcoal sm:text-base sm:leading-9">
          <p>
            {SITE_BRAND_JA}（{SITE_NAME}）は、
            <br />
            「安心して働ける夜職求人だけを探したい」人のための求人サイトです。
          </p>

          <div>
            <p>夜職を探していると、</p>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {concerns.map((item) => (
                <li
                  key={item}
                  className="rounded-2xl border border-gold/30 bg-white/80 px-4 py-3 text-charcoal shadow-luxury-sm"
                >
                  <span className="mr-2 text-gold-dark">・</span>
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
                  className="rounded-2xl border border-gold/45 bg-gradient-to-r from-champagne/60 to-gold-light/40 px-4 py-3 font-medium text-gold-dark shadow-luxury-sm"
                >
                  <span className="mr-2">・</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-gold/45 bg-gradient-to-br from-white to-champagne p-5 shadow-luxury-sm sm:p-6">
            <p>
              「夜職＝怖い」ではなく、
              <br />
              自分に合った環境で働ける人を増やしたい。
            </p>
            <p className="mt-4">
              そんな思いで運営しています。
            </p>
            <p className="mt-4 font-semibold text-gold-dark">
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
