import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { buildPageMetadata } from "@/lib/seo";
import { SITE_NAME } from "@/lib/site";
import "./features.css";

export const metadata: Metadata = buildPageMetadata(
  "White Night Jobの特徴｜店舗向け採用サポート",
  "札幌の夜職に特化した優良店専門求人サイト、White Night Jobの特徴をご紹介。AI応募前サポート、LINEおすすめ通知、職種診断、店舗比較など、店舗の採用活動を支援する機能を分かりやすく解説します。",
  "/features",
);

const PILLARS: { label: string; icon: ReactNode }[] = [
  {
    label: "AIサポート",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="4" y="5" width="16" height="12" rx="3" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M9 17.5 8 21l4-3.5h7"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="9" cy="11" r="1" fill="currentColor" />
        <circle cx="12" cy="11" r="1" fill="currentColor" />
        <circle cx="15" cy="11" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    label: "LINE通知",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M5.5 17c-1.1-1-1.8-2.4-1.8-4C3.7 8.7 7.4 6 12 6s8.3 2.7 8.3 7-3.7 7-8.3 7c-.8 0-1.6-.1-2.3-.3L5 20.5 5.5 17Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M8.2 11.5h7.6M8.2 14.2h5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    label: "職種診断",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M12 8v4.2l2.8 1.6"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "店舗比較",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M5 19V9M10 19V5M15 19v-6M20 19V8"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path d="M4 19h17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
];

const COMPARE_ROWS: { label: string; general: boolean; wn: boolean }[] = [
  { label: "求人情報の掲載", general: true, wn: true },
  { label: "AIによる24時間の応募前サポート", general: false, wn: true },
  { label: "LINEおすすめ通知", general: false, wn: true },
  { label: "職種診断", general: false, wn: true },
  { label: "最大5店舗の比較機能", general: false, wn: true },
  { label: "アクセス・応募状況の確認", general: true, wn: true },
  { label: "求人の良い点・改善点の分析", general: false, wn: true },
  { label: "具体的な求人改善提案", general: false, wn: true },
  { label: "掲載品質の継続的な改善サポート", general: false, wn: true },
];

const ANALYTICS_STEPS: { num: string; title: string; text: string }[] = [
  {
    num: "01",
    title: "アクセス・応募状況の可視化",
    text: "求人の表示回数や応募数を確認し、現在の掲載状況を把握できます。",
  },
  {
    num: "02",
    title: "求人の良い点を分析",
    text: "給与・待遇・店舗紹介・写真など、求人の魅力として伝わっている部分を整理します。",
  },
  {
    num: "03",
    title: "改善点を具体的に提示",
    text: "店舗紹介文、待遇情報、写真、求人内容の分かりやすさなど、改善が期待できる項目を明確にします。",
  },
  {
    num: "04",
    title: "掲載品質の継続的な向上",
    text: "分析結果をもとに求人内容を見直し、求職者に店舗の魅力がより伝わる掲載内容を目指します。",
  },
];

const FLOW_STEPS = ["掲載", "分析", "改善", "掲載品質の向上"] as const;

const SUPPORT_FEATURES: { num: string; title: string; text: string }[] = [
  {
    num: "05",
    title: "お気に入り機能",
    text: "気になる店舗をお気に入りに保存。後から求人情報を見返せるため、応募を検討する機会を増やします。",
  },
  {
    num: "06",
    title: "安心を重視した求人掲載",
    text: "掲載審査を通じて、求職者が安心して店舗を比較・検討できる求人情報を提供します。",
  },
  {
    num: "07",
    title: "店舗の魅力を伝える求人ページ",
    text: "給与・待遇・営業時間に加え、店舗の雰囲気や特徴を掲載。求職者が働くイメージを持ちやすい求人ページを提供します。",
  },
];

function Mark({ ok }: { ok: boolean }) {
  return (
    <span className={`wnf-mark${ok ? " is-yes" : " is-no"}`} aria-label={ok ? "あり" : "なし"}>
      {ok ? "◯" : "×"}
    </span>
  );
}

function PhoneChrome({ children }: { children: ReactNode }) {
  return (
    <div className="wnf-phone" aria-hidden>
      <div className="wnf-phone__notch" />
      <div className="wnf-phone__screen">{children}</div>
    </div>
  );
}

function MockChat() {
  return (
    <PhoneChrome>
      <div className="wnf-mock-chat__head">White Night Job AI</div>
      <div className="wnf-mock-chat__body">
        <div className="wnf-mock-bubble is-bot">
          こんにちは。店舗や応募について、気になることを聞いてください。
        </div>
        <div className="wnf-mock-bubble is-user">時給や出勤時間を教えて</div>
        <div className="wnf-mock-bubble is-bot">
          時給は体験時給からスタートできます。営業時間や待遇の詳細もご案内できます。
        </div>
        <div className="wnf-mock-chat__quick">
          <span className="wnf-mock-chat__chip">待遇について</span>
          <span className="wnf-mock-chat__chip">応募の流れ</span>
          <span className="wnf-mock-chat__chip">未経験OK？</span>
        </div>
      </div>
    </PhoneChrome>
  );
}

function MockLine() {
  return (
    <PhoneChrome>
      <div className="wnf-mock-line">
        <div className="wnf-mock-line__banner">
          <p className="wnf-mock-line__banner-title">今日のPickUp求人</p>
          <p className="wnf-mock-line__banner-sub">
            設定した地域から、本日のおすすめ店舗をご紹介します。
          </p>
        </div>
        <div className="wnf-mock-line__card">
          <div className="wnf-mock-line__hero">すすきの / キャバクラ</div>
          <div className="wnf-mock-line__body">
            <p className="wnf-mock-line__shop">CLUB EXAMPLE</p>
            <div className="wnf-mock-line__row">
              <span>時給</span>
              <span>¥5,000〜</span>
            </div>
            <div className="wnf-mock-line__row">
              <span>営業時間</span>
              <span>20:00〜LAST</span>
            </div>
            <div className="wnf-mock-line__row">
              <span>待遇</span>
              <span>送りあり・日払い</span>
            </div>
            <span className="wnf-mock-line__cta">詳しく見る</span>
          </div>
        </div>
      </div>
    </PhoneChrome>
  );
}

function MockDiagnosis() {
  return (
    <PhoneChrome>
      <div className="wnf-mock-diag">
        <p className="wnf-mock-diag__eyebrow">NIGHT JOB DIAGNOSIS</p>
        <p className="wnf-mock-diag__q">どんな働き方が合いそうですか？</p>
        <div className="wnf-mock-diag__bar">
          <span />
        </div>
        <div className="wnf-mock-diag__options">
          <div className="wnf-mock-diag__opt is-on">人と話すのが好き</div>
          <div className="wnf-mock-diag__opt">落ち着いた雰囲気が好み</div>
          <div className="wnf-mock-diag__opt">高収入を重視したい</div>
        </div>
        <div className="wnf-mock-diag__result">
          <p className="wnf-mock-diag__result-title">あなたへのおすすめ</p>
          <p className="wnf-mock-diag__result-job">キャバクラ / ラウンジ</p>
          <div className="wnf-mock-diag__meter">
            <span />
          </div>
        </div>
      </div>
    </PhoneChrome>
  );
}

function MockCompare() {
  return (
    <PhoneChrome>
      <div className="wnf-mock-compare">
        <table className="wnf-mock-compare__table">
          <thead>
            <tr>
              <th>項目</th>
              <th>店舗A</th>
              <th>店舗B</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th>職種</th>
              <td>キャバクラ</td>
              <td>ラウンジ</td>
            </tr>
            <tr>
              <th>時給</th>
              <td>¥5,000〜</td>
              <td>¥4,000〜</td>
            </tr>
            <tr>
              <th>送り</th>
              <td className="wnf-mock-compare__ok">あり</td>
              <td className="wnf-mock-compare__ok">あり</td>
            </tr>
            <tr>
              <th>日払い</th>
              <td className="wnf-mock-compare__ok">対応</td>
              <td>要相談</td>
            </tr>
            <tr>
              <th>エリア</th>
              <td>すすきの</td>
              <td>琴似</td>
            </tr>
          </tbody>
        </table>
        <div className="wnf-mock-compare__bar">最大5店舗まで比較できます</div>
      </div>
    </PhoneChrome>
  );
}

function MockAnalyticsReport() {
  return (
    <div className="wnf-mock-report" aria-hidden>
      <div className="wnf-mock-report__head">
        <p className="wnf-mock-report__title">アクセス・応募分析・レポート</p>
        <p className="wnf-mock-report__sub">店舗ダッシュボード（イメージ）</p>
      </div>
      <div className="wnf-mock-report__metrics">
        <div className="wnf-mock-report__metric">
          <span>表示回数</span>
          <strong>—</strong>
        </div>
        <div className="wnf-mock-report__metric">
          <span>LINE応募数</span>
          <strong>—</strong>
        </div>
        <div className="wnf-mock-report__metric">
          <span>電話応募数</span>
          <strong>—</strong>
        </div>
        <div className="wnf-mock-report__metric">
          <span>応募数</span>
          <strong>—</strong>
        </div>
      </div>
      <div className="wnf-mock-report__block is-good">
        <p className="wnf-mock-report__block-title">良い点</p>
        <ul>
          <li>給与・待遇情報が整理され、求職者が条件を把握しやすい</li>
          <li>店舗紹介文で雰囲気や特徴が伝わる構成になっている</li>
        </ul>
      </div>
      <div className="wnf-mock-report__block is-improve">
        <p className="wnf-mock-report__block-title">改善優先度</p>
        <div className="wnf-mock-report__priority">
          <span className="is-high">高</span>
          <p>店内写真の追加・紹介文の具体化</p>
        </div>
      </div>
      <div className="wnf-mock-report__block">
        <p className="wnf-mock-report__block-title">具体的な改善内容</p>
        <div className="wnf-mock-report__advice">
          <p className="wnf-mock-report__advice-action">
            店内全景・カウンター席が分かる写真を追加し、紹介文に客層・教育体制を追記する
          </p>
          <p className="wnf-mock-report__advice-effect">期待効果：求人詳細の分かりやすさ向上</p>
        </div>
      </div>
    </div>
  );
}

export default function FeaturesPage() {
  return (
    <div className="wn-features-page">
      <div className="wnf-wrap">
        <header className="wnf-hero">
          <p className="wnf-hero__eyebrow">
            <span className="wnf-hero__line" aria-hidden />
            FOR SHOPS
            <span className="wnf-hero__line" aria-hidden />
          </p>
          <h1 className="wnf-hero__title">
            求人を掲載するだけでは、
            <br />
            採用につながらない。
          </h1>
          <p className="wnf-hero__lead">
            White Night Jobは、AI・LINE・職種診断・店舗比較を組み合わせ、求職者との出会いから応募前の不安解消までサポートする、札幌の夜職特化型求人サイトです。
          </p>
          <ul className="wnf-pillars" aria-label="White Night Jobが提供する4つの採用サポート">
            {PILLARS.map((pillar) => (
              <li key={pillar.label} className="wnf-pillar">
                <span className="wnf-pillar__icon">{pillar.icon}</span>
                <p className="wnf-pillar__label">{pillar.label}</p>
              </li>
            ))}
          </ul>
        </header>

        <div className="wnf-section-head">
          <p className="wnf-section-head__eyebrow">
            <span className="wnf-hero__line" aria-hidden />
            4 SUPPORTS
            <span className="wnf-hero__line" aria-hidden />
          </p>
          <h2 className="wnf-section-head__title">White Night Jobの4つの強み</h2>
        </div>

        <ol className="wnf-strengths">
          <li>
            <article className="wnf-strength">
              <div className="wnf-strength__meta">
                <span className="wnf-strength__num" aria-hidden>
                  01
                </span>
                <p className="wnf-strength__label">AIによる応募前サポート</p>
              </div>
              <h3 className="wnf-strength__catch">
                応募前の疑問に、AIが24時間対応。
              </h3>
              <p className="wnf-strength__text">
                求職者が気になる店舗情報や応募前の疑問にAIが対応。営業時間外でも質問できる環境を提供し、応募前の不安解消をサポートします。
              </p>
              <div className="wnf-strength__visual">
                <MockChat />
              </div>
            </article>
          </li>

          <li>
            <article className="wnf-strength">
              <div className="wnf-strength__meta">
                <span className="wnf-strength__num" aria-hidden>
                  02
                </span>
                <p className="wnf-strength__label">LINEおすすめ通知</p>
              </div>
              <h3 className="wnf-strength__catch">
                求人情報を、待つだけの掲載から届ける採用へ。
              </h3>
              <p className="wnf-strength__text">
                求職者の希望エリアに合わせて求人情報をLINEで配信。サイトを閲覧していない時間にも、店舗を知ってもらう機会を広げます。
              </p>
              <div className="wnf-strength__visual">
                <MockLine />
              </div>
            </article>
          </li>

          <li>
            <article className="wnf-strength">
              <div className="wnf-strength__meta">
                <span className="wnf-strength__num" aria-hidden>
                  03
                </span>
                <p className="wnf-strength__label">職種診断</p>
              </div>
              <h3 className="wnf-strength__catch">
                まだ職種を決めていない求職者にも、新しい出会いを。
              </h3>
              <p className="wnf-strength__text">
                求職者が質問に答えることで、自分に合った夜職の職種を診断。仕事選びのきっかけをつくり、これまで検討していなかった職種や店舗を知る機会を提供します。
              </p>
              <div className="wnf-strength__visual">
                <MockDiagnosis />
              </div>
            </article>
          </li>

          <li>
            <article className="wnf-strength">
              <div className="wnf-strength__meta">
                <span className="wnf-strength__num" aria-hidden>
                  04
                </span>
                <p className="wnf-strength__label">店舗比較機能</p>
              </div>
              <h3 className="wnf-strength__catch">
                比較できるから、納得して応募を検討できる。
              </h3>
              <p className="wnf-strength__text">
                気になる店舗を最大5店舗まで比較可能。給与・待遇・特徴などを見比べることで、求職者が自分に合った店舗を検討しやすくなります。
              </p>
              <div className="wnf-strength__visual">
                <MockCompare />
              </div>
            </article>
          </li>
        </ol>

        <section className="wnf-compare" aria-labelledby="wnf-compare-title">
          <div className="wnf-section-head">
            <p className="wnf-section-head__eyebrow">
              <span className="wnf-hero__line" aria-hidden />
              COMPARISON
              <span className="wnf-hero__line" aria-hidden />
            </p>
            <h2 id="wnf-compare-title" className="wnf-section-head__title">
              一般的な求人サイトとの違い
            </h2>
          </div>

          <div className="wnf-compare__scroll">
            <table className="wnf-compare__table">
              <thead>
                <tr>
                  <th scope="col">比較項目</th>
                  <th scope="col" className="is-general">
                    一般的な求人サイト
                  </th>
                  <th scope="col" className="is-wn">
                    White Night Job
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARE_ROWS.map((row) => (
                  <tr key={row.label}>
                    <th scope="row">{row.label}</th>
                    <td className="is-general">
                      <Mark ok={row.general} />
                    </td>
                    <td className="is-wn">
                      <Mark ok={row.wn} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="wnf-compare__note">
            ※本表は一般的な求人サイトの機能構成との比較イメージです。特定の競合サービスの機能を断定するものではありません。
          </p>
        </section>

        <section className="wnf-analytics" aria-labelledby="wnf-analytics-title">
          <div className="wnf-section-head">
            <p className="wnf-section-head__eyebrow">
              <span className="wnf-hero__line" aria-hidden />
              IMPROVE
              <span className="wnf-hero__line" aria-hidden />
            </p>
            <h2 id="wnf-analytics-title" className="wnf-section-head__title wnf-analytics__title">
              掲載して終わりにしない。
              <br />
              分析と改善で、求人の質を高める。
            </h2>
          </div>
          <p className="wnf-analytics__lead">
            求人の表示回数や応募状況を確認するだけでなく、掲載内容の良い点・改善点を詳しく分析。具体的な改善提案を通じて、店舗の魅力がより伝わる求人ページづくりをサポートします。
          </p>

          <ol className="wnf-flow" aria-label="掲載品質向上の流れ">
            {FLOW_STEPS.map((step, index) => (
              <li key={step} className="wnf-flow__item">
                <span className="wnf-flow__step">{step}</span>
                {index < FLOW_STEPS.length - 1 ? (
                  <span className="wnf-flow__arrow" aria-hidden>
                    →
                  </span>
                ) : null}
              </li>
            ))}
          </ol>

          <ol className="wnf-analytics__steps">
            {ANALYTICS_STEPS.map((step) => (
              <li key={step.num} className="wnf-analytics__step">
                <span className="wnf-analytics__step-num" aria-hidden>
                  {step.num}
                </span>
                <div>
                  <h3 className="wnf-analytics__step-title">{step.title}</h3>
                  <p className="wnf-analytics__step-text">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="wnf-analytics__visual">
            <MockAnalyticsReport />
          </div>
        </section>

        <div className="wnf-section-head">
          <p className="wnf-section-head__eyebrow">
            <span className="wnf-hero__line" aria-hidden />
            MORE
            <span className="wnf-hero__line" aria-hidden />
          </p>
          <h2 className="wnf-section-head__title">採用活動を支えるその他の機能</h2>
        </div>

        <ul className="wnf-support-list">
          {SUPPORT_FEATURES.map((feature) => (
            <li key={feature.num}>
              <article className="wnf-support-card">
                <span className="wnf-support-card__num" aria-hidden>
                  {feature.num}
                </span>
                <div>
                  <h3 className="wnf-support-card__title">{feature.title}</h3>
                  <p className="wnf-support-card__text">{feature.text}</p>
                </div>
              </article>
            </li>
          ))}
        </ul>

        <p className="wnf-note">
          ※利用できる機能は契約プランによって異なります。
        </p>

        <div className="wnf-cta">
          <Link href="/for-shops" className="wnf-cta__btn">
            掲載・料金プランを見る
          </Link>
          <p className="wnf-cta__sub">
            {SITE_NAME} 店舗向け掲載案内へ移動します
          </p>
        </div>
      </div>
    </div>
  );
}
