import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { ListingSuccessChecklist } from "@/components/ListingSuccessChecklist";
import { buildPageMetadata } from "@/lib/seo";
import "./listing-success-guide.css";

export const metadata: Metadata = buildPageMetadata(
  "掲載効果UPガイド｜契約店舗様向け",
  "契約店舗様向けの掲載効果UPガイド。求人ページの写真・紹介文・待遇情報の充実と、アクセス・応募分析を活用した継続的な改善方法をご紹介します。",
  "/listing-success-guide",
);

const PILLARS: { label: string; icon: ReactNode }[] = [
  {
    label: "求人情報の充実",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="4" y="4" width="16" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M4 15.5 8.5 11l3 3 3.5-4.5L20 15"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "アクセス・応募分析",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M4 19h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path
          d="M7 16V10M12 16V7M17 16v-4"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    label: "継続的な掲載改善",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M4.5 12a7.5 7.5 0 0 1 12.7-5.4M19.5 12a7.5 7.5 0 0 1-12.7 5.4"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          d="M17 4.8v3.2h-3.2M7 19.2v-3.2h3.2"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

const POINTS: {
  num: string;
  title: string;
  text: string;
  examples: string[];
  tip: string;
  icon: ReactNode;
}[] = [
  {
    num: "01",
    title: "写真で店舗の雰囲気を伝える",
    text: "求職者が働く姿をイメージできるように、店舗の雰囲気が伝わる写真を掲載しましょう。",
    examples: ["店内の雰囲気", "キャストの写真", "制服や衣装", "働いている様子"],
    tip: "写真は明るく、清潔感のあるものを使用することをおすすめします。",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="9" cy="10" r="1.4" stroke="currentColor" strokeWidth="1.4" />
        <path
          d="m8 16 3-3.2 2.2 2.2L16.5 11 20 16"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    num: "02",
    title: "給与・待遇を分かりやすく記載する",
    text: "時給だけでなく、バックや各種待遇についても具体的に記載しましょう。",
    examples: [
      "時給",
      "各種バック",
      "日払いの有無",
      "送迎の有無",
      "衣装レンタル",
      "自由出勤",
      "未経験者へのサポート",
    ],
    tip: "実際の勤務条件と異なる内容は記載しないでください。",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="4" y="6" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M4 10h16" stroke="currentColor" strokeWidth="1.6" />
        <path d="M8 14h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    num: "03",
    title: "店舗の魅力を紹介文で伝える",
    text: "給与や待遇だけでは伝わらない、店舗ならではの魅力を紹介しましょう。",
    examples: [
      "どのような雰囲気のお店なのか",
      "どのような方が働いているのか",
      "未経験者へのサポート体制",
      "シフトの柔軟性",
      "店舗が大切にしていること",
    ],
    tip: "求職者が安心して応募を検討できる文章を意識してください。",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M6 5.5h12v13H6z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M9 9h6M9 12.5h6M9 16h4"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    num: "04",
    title: "応募前の不安を解消する",
    text: "求職者が気になりやすい情報を、求人ページ内で分かりやすく案内しましょう。",
    examples: [
      "未経験でも働けるか",
      "お酒が飲めなくても大丈夫か",
      "勤務時間や出勤頻度",
      "面接時の服装や持ち物",
      "体験入店の有無",
    ],
    tip: "実際の店舗の運用に合わせた正確な情報を掲載してください。",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 3 5 6v6c0 4.5 3 7.8 7 9 4-1.2 7-4.5 7-9V6l-7-3Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    num: "05",
    title: "求人情報を定期的に更新する",
    text: "給与・待遇・営業時間・募集状況などに変更があった場合は、求人情報を更新しましょう。",
    examples: [],
    tip: "古い情報を残さず、現在の募集内容を正確に伝えることが重要です。",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M4.5 12a7.5 7.5 0 0 1 12.7-5.4M19.5 12a7.5 7.5 0 0 1-12.7 5.4"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          d="M17 4.8v3.2h-3.2M7 19.2v-3.2h3.2"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

const ANALYTICS_STEPS = [
  {
    num: "01",
    title: "表示回数・応募数を確認する",
    text: "店舗ダッシュボードで求人の表示回数や応募数を確認し、現在の掲載状況を把握しましょう。",
  },
  {
    num: "02",
    title: "求人の良い点を把握する",
    text: "分析結果を確認し、現在の求人で魅力として伝わっている部分を把握しましょう。良い点を維持しながら、さらに魅力が伝わる掲載内容を目指します。",
  },
  {
    num: "03",
    title: "改善点を確認する",
    text: "求人の紹介文、写真、待遇情報など、改善が期待できる項目を確認しましょう。具体的な改善提案を参考に、求人内容を見直してください。",
  },
  {
    num: "04",
    title: "改善後の変化を確認する",
    text: "求人内容を修正した後も、表示回数や応募状況を確認しましょう。分析と改善を継続することで、掲載品質の向上につなげます。",
  },
] as const;

const CYCLE_STEPS = [
  { step: "STEP 01", title: "掲載状況を確認" },
  { step: "STEP 02", title: "良い点・改善点を把握" },
  { step: "STEP 03", title: "求人内容を改善" },
  { step: "STEP 04", title: "改善後の状況を確認" },
] as const;

const FAQS = [
  {
    q: "求人情報はどのくらいの頻度で見直すべきですか？",
    a: "募集条件に変更があった場合は速やかに更新し、定期的に掲載内容を確認することをおすすめします。",
  },
  {
    q: "どのような写真を掲載すればよいですか？",
    a: "店内の雰囲気や衣装、働く様子など、求職者が実際の勤務環境をイメージできる写真がおすすめです。",
  },
  {
    q: "掲載後に求人内容を変更できますか？",
    a: "店舗ダッシュボードから求人情報の編集が可能です。",
  },
  {
    q: "分析機能はすべてのプランで利用できますか？",
    a: "利用できる分析機能は契約プランによって異なります。詳細はご契約中のプランをご確認ください。",
  },
] as const;

export default function ListingSuccessGuidePage() {
  return (
    <div className="wn-lsg-page">
      <div className="lsg-wrap">
        <header className="lsg-hero">
          <p className="lsg-hero__eyebrow">
            <span className="lsg-line" aria-hidden />
            LISTING SUCCESS GUIDE
            <span className="lsg-line" aria-hidden />
          </p>
          <h1 className="lsg-hero__title">掲載効果UPガイド</h1>
          <p className="lsg-hero__catch">
            求人の魅力を最大限に。
            <br />
            掲載後の分析と改善で、応募につながる求人づくりを。
          </p>
          <div className="lsg-hero__lead">
            <p>求人ページは、掲載して終わりではありません。</p>
            <p>
              写真・紹介文・待遇情報を充実させ、掲載状況を分析しながら改善を重ねることで、求職者に店舗の魅力をより分かりやすく伝えることができます。
            </p>
            <p>White Night Jobを効果的に活用するためのポイントをご紹介します。</p>
          </div>
          <ul className="lsg-pillars" aria-label="掲載効果UPの3つの柱">
            {PILLARS.map((item) => (
              <li key={item.label} className="lsg-pillar">
                <span className="lsg-pillar__icon">{item.icon}</span>
                <p className="lsg-pillar__label">{item.label}</p>
              </li>
            ))}
          </ul>
        </header>

        <section className="lsg-section" aria-labelledby="lsg-points-title">
          <div className="lsg-section-head">
            <p className="lsg-section-head__eyebrow">
              <span className="lsg-line" aria-hidden />
              5 POINTS
              <span className="lsg-line" aria-hidden />
            </p>
            <h2 id="lsg-points-title" className="lsg-section-head__title">
              まずは、求人ページの魅力を高めましょう。
            </h2>
          </div>
          <ol className="lsg-points">
            {POINTS.map((point) => (
              <li key={point.num}>
                <article className="lsg-point">
                  <div className="lsg-point__meta">
                    <span className="lsg-point__num" aria-hidden>
                      {point.num}
                    </span>
                    <span className="lsg-point__icon">{point.icon}</span>
                    <h3 className="lsg-point__title">{point.title}</h3>
                  </div>
                  <p className="lsg-point__text">{point.text}</p>
                  {point.examples.length > 0 ? (
                    <>
                      <p className="lsg-point__examples-label">掲載例</p>
                      <ul className="lsg-point__examples">
                        {point.examples.map((example) => (
                          <li key={example}>{example}</li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                  <p className="lsg-point__tip">{point.tip}</p>
                </article>
              </li>
            ))}
          </ol>
        </section>

        <section className="lsg-section" aria-labelledby="lsg-analytics-title">
          <div className="lsg-analytics">
            <div className="lsg-section-head">
              <p className="lsg-section-head__eyebrow">
                <span className="lsg-line" aria-hidden />
                ANALYTICS
                <span className="lsg-line" aria-hidden />
              </p>
              <h2 id="lsg-analytics-title" className="lsg-section-head__title">
                掲載して終わりにしない。
                <br />
                分析と改善で、求人の質を高める。
              </h2>
            </div>
            <p className="lsg-lead">
              White Night Jobでは、アクセス・応募状況を確認するだけでなく、求人の良い点や改善点を分析し、掲載品質の向上につなげるサポートを行っています。
            </p>
            <ol className="lsg-analytics__steps">
              {ANALYTICS_STEPS.map((step) => (
                <li key={step.num} className="lsg-analytics__step">
                  <span className="lsg-analytics__step-num" aria-hidden>
                    {step.num}
                  </span>
                  <div>
                    <h3 className="lsg-analytics__step-title">{step.title}</h3>
                    <p className="lsg-analytics__step-text">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="lsg-note">
              ※利用できる分析機能は契約プランによって異なります。
            </p>
          </div>
        </section>

        <section className="lsg-section" aria-labelledby="lsg-cycle-title">
          <div className="lsg-section-head">
            <p className="lsg-section-head__eyebrow">
              <span className="lsg-line" aria-hidden />
              CYCLE
              <span className="lsg-line" aria-hidden />
            </p>
            <h2 id="lsg-cycle-title" className="lsg-section-head__title">
              掲載効果を高める改善サイクル
            </h2>
          </div>
          <ol className="lsg-cycle" aria-label="改善サイクルの4ステップ">
            {CYCLE_STEPS.map((item, index) => (
              <li key={item.step} className="lsg-cycle__item">
                <div className="lsg-cycle__card">
                  <p className="lsg-cycle__step">{item.step}</p>
                  <p className="lsg-cycle__title">{item.title}</p>
                </div>
                {index < CYCLE_STEPS.length - 1 ? (
                  <span className="lsg-cycle__arrow" aria-hidden>
                    →
                  </span>
                ) : (
                  <span className="lsg-cycle__arrow" aria-hidden>
                    ↻
                  </span>
                )}
              </li>
            ))}
            <li className="lsg-cycle__loop">改善を継続する</li>
          </ol>
          <p className="lsg-lead">
            掲載状況を確認し、改善を重ねることで、求職者に店舗の魅力がより伝わる求人ページを目指しましょう。
          </p>
        </section>

        <section className="lsg-section" aria-labelledby="lsg-check-title">
          <div className="lsg-section-head">
            <p className="lsg-section-head__eyebrow">
              <span className="lsg-line" aria-hidden />
              CHECKLIST
              <span className="lsg-line" aria-hidden />
            </p>
            <h2 id="lsg-check-title" className="lsg-section-head__title">
              あなたの求人ページをチェック！
            </h2>
          </div>
          <ListingSuccessChecklist />
        </section>

        <section className="lsg-cta" aria-labelledby="lsg-cta-title">
          <div className="lsg-section-head">
            <h2 id="lsg-cta-title" className="lsg-section-head__title">
              さっそく、求人ページを見直しましょう。
            </h2>
          </div>
          <p className="lsg-lead">
            店舗ダッシュボードから求人情報の確認・編集や、掲載状況の分析をご利用いただけます。
          </p>
          <div className="lsg-cta__actions">
            <Link href="/shop-dashboard" className="lsg-cta__primary">
              求人情報を編集する
            </Link>
            <Link href="/shop-dashboard" className="lsg-cta__secondary">
              アクセス・応募分析を見る
            </Link>
          </div>
          <p className="lsg-cta__sub">
            未ログインの場合は、店舗ログイン画面へ案内されます。
          </p>
        </section>

        <section className="lsg-section" aria-labelledby="lsg-faq-title">
          <div className="lsg-section-head">
            <p className="lsg-section-head__eyebrow">
              <span className="lsg-line" aria-hidden />
              FAQ
              <span className="lsg-line" aria-hidden />
            </p>
            <h2 id="lsg-faq-title" className="lsg-section-head__title">
              よくあるご質問
            </h2>
          </div>
          <div className="lsg-faq">
            {FAQS.map((item) => (
              <article key={item.q} className="lsg-faq__item">
                <h3 className="lsg-faq__q">Q. {item.q}</h3>
                <p className="lsg-faq__a">A. {item.a}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
