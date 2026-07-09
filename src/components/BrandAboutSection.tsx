import { luxuryPremiumCard } from "@/lib/luxury-styles";
import { SITE_BRAND_JA, SITE_NAME } from "@/lib/site";

export function BrandAboutSection() {
  return (
    <section
      id="about-brand"
      className={`relative scroll-mt-24 overflow-hidden px-5 py-8 sm:px-8 sm:py-10 ${luxuryPremiumCard}`}
    >
      <div className="relative space-y-8 text-sm leading-8 text-charcoal sm:text-base sm:leading-9">
        <div>
          <h2 className="font-serif text-xl font-semibold text-gradient-gold sm:text-2xl">
            {SITE_BRAND_JA}とは
          </h2>
          <p className="mt-4">
            {SITE_BRAND_JA}（{SITE_NAME}）は、体験入店を含め、安心して働ける夜職求人だけを掲載する札幌エリアの求人サイトです。
            審査済みの優良店舗のみを厳選し、初めての方でも比較しやすい情報設計を心がけています。
          </p>
        </div>

        <div>
          <h2 className="font-serif text-xl font-semibold text-gradient-gold sm:text-2xl">
            {SITE_BRAND_JA}の特徴
          </h2>
          <ul className="mt-4 space-y-2">
            <li>・通常審査に加え、当サイト独自の審査基準で掲載店舗を選定</li>
            <li>・ガールズバー・コンカフェ・ラウンジ・ニュークラブなど職種別に検索可能</li>
            <li>・待遇や勤務条件をわかりやすく掲載し、体験入店の相談もしやすい設計</li>
            <li>・ブラック店舗の報告機能で、利用者の不安に寄り添う運営体制</li>
          </ul>
        </div>

        <div>
          <h2 className="font-serif text-xl font-semibold text-gradient-gold sm:text-2xl">
            {SITE_BRAND_JA}が選ばれる理由
          </h2>
          <p className="mt-4">
            {SITE_NAME}は「とにかく数を集める」のではなく、働く側が安心できるお店選びを支援することを大切にしています。
            未経験歓迎の店舗表示や、相談窓口の整備など、{SITE_BRAND_JA}ならではのサポート体制が選ばれる理由につながっています。
          </p>
        </div>
      </div>
    </section>
  );
}
