import type { Metadata } from "next";
import Link from "next/link";
import { ForShopsContactForm } from "@/components/for-shops/ForShopsContactForm";
import { ForShopsFaq } from "@/components/for-shops/ForShopsFaq";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "掲載をご検討の方はこちら",
  description: `${SITE_NAME}への求人掲載をご検討の店舗様向けご案内。優良店のみ掲載、安心認証、AIチャット紹介など。`,
};

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

const COMPARISON_ROWS = [
  { label: "優良店のみ掲載", ours: true, others: false },
  { label: "ブラック店通報", ours: true, others: false },
  { label: "AIチャット紹介", ours: true, others: false },
  { label: "応募分析", ours: true, others: false },
  { label: "店舗編集", ours: true, others: true },
  { label: "初心者向けサポート", ours: true, others: false },
  { label: "安心認証", ours: true, others: false },
] as const;

const MERITS = [
  "安心して応募するユーザーが集まりやすい",
  "ミスマッチが減る",
  "求人情報をいつでも編集可能",
  "応募・表示回数を分析可能",
  "AIチャットから店舗紹介",
  "ピックアップ掲載可能",
  "ブランドイメージ向上",
] as const;

const PLANS = [
  {
    name: "ライトプラン",
    price: "¥15,000",
    recommended: false,
    features: {
      掲載内容: "基本求人掲載",
      ピックアップ掲載: "—",
      AIおすすめ表示: "標準",
      表示順位: "通常",
      応募分析: "基本レポート",
    },
  },
  {
    name: "スタンダードプラン",
    price: "¥30,000",
    recommended: true,
    features: {
      掲載内容: "求人掲載＋写真強化",
      ピックアップ掲載: "月1回",
      AIおすすめ表示: "優先",
      表示順位: "上位寄り",
      応募分析: "詳細レポート",
    },
  },
  {
    name: "プレミアムプラン",
    price: "¥50,000",
    recommended: false,
    features: {
      掲載内容: "フル掲載＋優先サポート",
      ピックアップ掲載: "優先枠",
      AIおすすめ表示: "最優先",
      表示順位: "最上位寄り",
      応募分析: "詳細＋改善提案",
    },
  },
] as const;

const STEPS = [
  { step: "01", title: "お問い合わせ", desc: "フォーム・電話・メールからご連絡ください。" },
  { step: "02", title: "審査", desc: "優良店としての掲載可否を確認します。" },
  { step: "03", title: "掲載準備", desc: "求人情報・写真・プラン内容を整えます。" },
  { step: "04", title: "公開", desc: "サイト上に公開し、採用活動をスタート。" },
] as const;

function CheckIcon({ positive }: { positive: boolean }) {
  if (positive) {
    return (
      <span className="for-shops-check is-yes" aria-label="対応">
        ✓
      </span>
    );
  }
  return (
    <span className="for-shops-check is-no" aria-label="非対応">
      —
    </span>
  );
}

function SectionHeading({
  eyebrow,
  title,
  light = false,
}: {
  eyebrow: string;
  title: string;
  light?: boolean;
}) {
  return (
    <div className={`for-shops-section-heading ${light ? "is-light" : ""}`}>
      <p className="for-shops-eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      <span className="for-shops-heading-line" aria-hidden />
    </div>
  );
}

export default function ForShopsPage() {
  return (
    <div className="for-shops-page">
      <section className="for-shops-hero">
        <div className="for-shops-hero-inner">
          <p className="for-shops-kicker">掲載をご検討の方はこちら</p>
          <h1 className="for-shops-hero-title">
            優良店だけが集まる
            <br />
            求人サイトへ。
          </h1>
          <p className="for-shops-hero-sub">
            White Night Jobは、安心して働ける環境づくりを大切にする店舗様だけを掲載する、夜職専門の求人サイトです。
          </p>
          <div className="for-shops-hero-actions">
            <a href="#for-shops-contact" className="for-shops-btn for-shops-btn-primary">
              掲載のお問い合わせ
            </a>
            <a href="#for-shops-plans" className="for-shops-btn for-shops-btn-secondary">
              料金プランを見る
            </a>
          </div>
        </div>
      </section>

      <section className="for-shops-section">
        <div className="for-shops-container">
          <SectionHeading eyebrow="FEATURES" title="White Night Jobの特徴" />
          <div className="for-shops-feature-grid">
            {FEATURES.map((feature) => (
              <article key={feature.title} className="for-shops-card">
                <span className="for-shops-card-mark" aria-hidden />
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="for-shops-section for-shops-section-alt">
        <div className="for-shops-container">
          <SectionHeading eyebrow="COMPARISON" title="他サイトとの違い" light />
          <div className="for-shops-table-wrap">
            <table className="for-shops-table">
              <thead>
                <tr>
                  <th scope="col">項目</th>
                  <th scope="col">White Night Job</th>
                  <th scope="col">他社求人サイト</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.label}>
                    <th scope="row">{row.label}</th>
                    <td>
                      <CheckIcon positive={row.ours} />
                    </td>
                    <td>
                      <CheckIcon positive={row.others} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="for-shops-section">
        <div className="for-shops-container">
          <SectionHeading eyebrow="MERITS" title="掲載メリット" />
          <div className="for-shops-merit-grid">
            {MERITS.map((merit) => (
              <article key={merit} className="for-shops-card for-shops-merit-card">
                <span className="for-shops-merit-icon" aria-hidden>
                  ✓
                </span>
                <p>{merit}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="for-shops-plans" className="for-shops-section for-shops-section-alt scroll-mt-24">
        <div className="for-shops-container">
          <SectionHeading eyebrow="PRICING" title="料金プラン" light />
          <div className="for-shops-plan-grid">
            {PLANS.map((plan) => (
              <article
                key={plan.name}
                className={`for-shops-plan-card ${plan.recommended ? "is-recommended" : ""}`}
              >
                {plan.recommended && <span className="for-shops-plan-badge">おすすめ</span>}
                <h3>{plan.name}</h3>
                <p className="for-shops-plan-price">
                  <span>{plan.price}</span>
                  <small>/ 月</small>
                </p>
                <ul className="for-shops-plan-list">
                  {Object.entries(plan.features).map(([label, value]) => (
                    <li key={label}>
                      <span>{label}</span>
                      <strong>{value}</strong>
                    </li>
                  ))}
                </ul>
                <a href="#for-shops-contact" className="for-shops-btn for-shops-btn-primary">
                  このプランで相談する
                </a>
              </article>
            ))}
          </div>
          <p className="for-shops-plan-note">
            ※表示価格は税別の目安です。詳細・キャンペーンはお問い合わせ時にご案内します。
          </p>
        </div>
      </section>

      <section className="for-shops-section">
        <div className="for-shops-container">
          <SectionHeading eyebrow="FAQ" title="よくある質問" />
          <ForShopsFaq />
        </div>
      </section>

      <section className="for-shops-section for-shops-section-alt">
        <div className="for-shops-container">
          <SectionHeading eyebrow="FLOW" title="掲載までの流れ" light />
          <ol className="for-shops-steps">
            {STEPS.map((item, index) => (
              <li key={item.step} className="for-shops-step">
                <div className="for-shops-step-card">
                  <span className="for-shops-step-num">{item.step}</span>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </div>
                {index < STEPS.length - 1 && (
                  <span className="for-shops-step-arrow" aria-hidden>
                    ↓
                  </span>
                )}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="for-shops-contact" className="for-shops-cta scroll-mt-24">
        <div className="for-shops-container">
          <p className="for-shops-eyebrow is-on-dark">CONTACT</p>
          <h2 className="for-shops-cta-title">掲載をご希望の店舗様はこちら</h2>
          <p className="for-shops-cta-sub">
            お問い合わせフォーム、電話、メールからお気軽にご相談ください。
          </p>
          <span className="for-shops-heading-line is-on-dark" aria-hidden />
          <ForShopsContactForm />
          <div className="for-shops-cta-links">
            <Link href="/terms-shop" className="for-shops-text-link">
              掲載店舗向け利用規約
            </Link>
            <Link href="/shop-login" className="for-shops-text-link">
              店舗様ログイン
            </Link>
            <Link href="/" className="for-shops-text-link">
              トップページへ
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
