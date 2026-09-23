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
  examplesLabel?: string;
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
  {
    num: "06",
    title: "口コミを活用して店舗の魅力を伝える",
    text: "求職者にとって、実際に働いている方や店舗に関する口コミは、応募を検討する際の参考情報になります。口コミを通じて店舗の雰囲気や働く環境を伝えることで、求人情報だけでは伝わりにくい魅力を補うことができます。また、口コミの内容を確認することで、店舗の良い点や改善が期待できる点を把握し、求人内容や採用活動の見直しにも活用できます。",
    examplesLabel: "ポイント",
    examples: [
      "口コミによる店舗の雰囲気や魅力の発信",
      "求職者の応募前の不安解消",
      "口コミを参考にした店舗・求人内容の改善",
    ],
    tip: "実在する口コミのみを活用し、架空の評価や存在しない口コミは表示しないでください。",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M5.5 17c-1.1-1-1.8-2.4-1.8-4C3.7 8.7 7.4 6 12 6s8.3 2.7 8.3 7-3.7 7-8.3 7c-.8 0-1.6-.1-2.3-.3L5 20.5 5.5 17Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

const METRIC_GUIDES = [
  {
    title: "表示回数",
    text: "求人一覧などで求人がどの程度見られているかを把握できます。露出が少ない場合は、掲載内容の更新や上位表示の活用などを検討するきっかけになります。",
  },
  {
    title: "求人詳細クリック数",
    text: "一覧から詳細ページへ進んだ回数です。求職者が求人に興味を持ったかどうかを確認する指標として活用できます。",
  },
  {
    title: "求人詳細クリック率",
    text: "表示に対して詳細へ進んだ割合です。一覧での写真・紹介文・給与情報などの見せ方を見直す判断材料になります。",
  },
  {
    title: "応募数",
    text: "LINE・電話などの応募導線がクリックされた回数を確認できます。詳細閲覧後に応募へつながっているかを把握する参考になります。",
  },
  {
    title: "口コミ",
    text: "店舗の雰囲気や働く環境が求職者にどう伝わっているかを確認できます。良い点の維持や、求人内容・採用活動の改善に活かせます。",
  },
] as const;

const FUNNEL_STEPS = [
  "表示回数を確認",
  "求人詳細クリック率を確認",
  "応募状況や口コミを確認",
  "求人の良い点・改善点を把握",
  "写真・紹介文・待遇情報などを改善",
  "掲載品質の向上",
] as const;

const DETAIL_CTR_POINTS = [
  "求人一覧での表示状況",
  "求人詳細ページへのクリック状況",
  "求人詳細クリック率",
  "クリック率を参考にした掲載内容の改善",
] as const;

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
              POINTS
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
                      <p className="lsg-point__examples-label">
                        {point.examplesLabel ?? "掲載例"}
                      </p>
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

            <h3 className="lsg-analytics__subhead">掲載効果を確認する指標</h3>
            <ul className="lsg-metrics">
              {METRIC_GUIDES.map((metric) => (
                <li key={metric.title} className="lsg-metrics__item">
                  <p className="lsg-metrics__title">{metric.title}</p>
                  <p className="lsg-metrics__text">{metric.text}</p>
                </li>
              ))}
            </ul>

            <div className="lsg-ctr">
              <h3 className="lsg-ctr__title">求人詳細クリック率を確認する</h3>
              <p className="lsg-ctr__text">
                求人一覧で表示された求人が、どの程度詳細ページの閲覧につながっているかを確認することで、求職者の興味・関心を把握できます。
              </p>
              <p className="lsg-ctr__text">
                求人詳細クリック率を参考に、求人一覧での写真・紹介文・給与情報などの見せ方を見直し、詳細ページへの誘導改善につなげます。
              </p>
              <ul className="lsg-ctr__points">
                {DETAIL_CTR_POINTS.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <div className="lsg-ctr__formula">
                <p className="lsg-ctr__formula-label">計算方法</p>
                <p className="lsg-ctr__formula-body">
                  求人詳細クリック数 ÷ 求人一覧での表示回数 × 100
                </p>
                <p className="lsg-ctr__formula-note">
                  ※店舗ダッシュボードの「詳細クリック率」は、店舗詳細クリック数 ÷ 表示回数で算出しています。
                </p>
                <p className="lsg-ctr__formula-example">
                  例：求人一覧で1,000回表示され、詳細ページが50回クリックされた場合、求人詳細クリック率は5％です。
                </p>
                <p className="lsg-ctr__formula-disclaimer">
                  ※上記の数値は計算方法の説明用であり、実際の掲載実績ではありません。
                </p>
              </div>
            </div>

            <h3 className="lsg-analytics__subhead">改善につなげる流れ</h3>
            <ol className="lsg-funnel" aria-label="分析から改善までの流れ">
              {FUNNEL_STEPS.map((step, index) => (
                <li key={step} className="lsg-funnel__item">
                  <span className="lsg-funnel__step">{step}</span>
                  {index < FUNNEL_STEPS.length - 1 ? (
                    <span className="lsg-funnel__arrow" aria-hidden>
                      ↓
                    </span>
                  ) : null}
                </li>
              ))}
            </ol>
            <p className="lsg-lead lsg-lead--compact">
              求人の表示から応募までの状況を把握し、掲載内容の改善につなげましょう。
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
              ※利用できる分析機能は契約プランによって異なります。詳細クリック数・詳細クリック率・改善レポートなどは、プランにより表示内容が異なります。
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
              店舗ダッシュボードを確認する
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
