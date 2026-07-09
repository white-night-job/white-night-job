import { luxuryPremiumCard } from "@/lib/luxury-styles";
import { SITE_FORMAL_NAME } from "@/lib/site";

export function SupportConsultationSection() {
  return (
    <section
      id="support-section"
      className={`relative scroll-mt-24 overflow-hidden px-5 py-8 sm:scroll-mt-28 sm:px-8 sm:py-10 ${luxuryPremiumCard}`}
    >
      <div className="luxury-shimmer pointer-events-none absolute inset-0 opacity-40" aria-hidden />
      <div className="relative">
        <div className="mb-4 flex items-center gap-3 text-gold-dark">
          <span className="h-px flex-1 bg-gold/40" />
          <span className="text-xs tracking-[0.25em]">安心のサポート体制</span>
          <span className="h-px flex-1 bg-gold/40" />
        </div>

        <div className="rounded-2xl border border-gold/50 bg-gradient-to-br from-white via-ivory to-champagne p-5 shadow-luxury-sm sm:p-6">
          <p className="font-serif text-xl font-semibold text-gradient-gold sm:text-2xl">
            業界唯一
            <br />
            全掲載店舗相談受付実施
          </p>

          <div className="mt-5 space-y-4 text-sm leading-8 text-charcoal sm:text-base sm:leading-9">
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
              {SITE_FORMAL_NAME}では、
              <br />
              全ての掲載店舗様に相談窓口を設けて頂いております！
            </p>
            <p>「まだ面接に行くのは少し怖いな…」</p>
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
            <p className="font-semibold text-gold-dark">
              少しでも気になる店舗があった際は、
              <br />
              お気軽に相談・ご連絡してみてください！
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
