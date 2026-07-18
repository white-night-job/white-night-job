import type { Metadata } from "next";
import Link from "next/link";
import { ForShopsContactForm } from "@/components/for-shops/ForShopsContactForm";
import { ForShopsFaq } from "@/components/for-shops/ForShopsFaq";
import { ForShopsLandingFeatures } from "@/components/for-shops/ForShopsLandingFeatures";
import { ForShopsLandingHero } from "@/components/for-shops/ForShopsLandingHero";
import { buildPageMetadata } from "@/lib/seo";
import { SITE_BRAND_JA, SITE_FORMAL_NAME } from "@/lib/site";
import "./landing.css";

export const metadata: Metadata = buildPageMetadata(
  "店舗向け掲載案内",
  `${SITE_FORMAL_NAME}への求人掲載をご検討の店舗様向けご案内。優良店のみ掲載、安心認証、AIチャット紹介など。`,
  "/for-shops",
);

const COMPARISON_ROWS = [
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

const PLAN_FEATURE_ROWS = [
  { label: "掲載内容", light: "フル掲載", standard: "フル掲載", premium: "フル掲載" },
  { label: "表示順位", light: "通常", standard: "優先", premium: "最優先" },
  { label: "新着店舗掲載", light: "1ヶ月", standard: "2ヶ月", premium: "2ヶ月" },
  { label: "ピックアップ掲載", light: "－", standard: "－", premium: "○" },
  { label: "AIおすすめ表示", light: "－", standard: "優先", premium: "最優先" },
  { label: "上位表示ボタン", light: "1日5回", standard: "1日5回", premium: "1日5回" },
  { label: "応募分析", light: "○", standard: "○", premium: "○" },
  { label: "LINEおすすめ通知", light: "－", standard: "－", premium: "○" },
] as const;

type PlanKey = "light" | "standard" | "premium";

const PLANS: {
  key: PlanKey;
  name: string;
  price: string;
  recommended: boolean;
}[] = [
  { key: "light", name: "ライトプラン", price: "12,000", recommended: false },
  { key: "standard", name: "スタンダードプラン", price: "25,000", recommended: false },
  { key: "premium", name: "プレミアムプラン", price: "38,000", recommended: true },
];

function planFeatureTone(value: string): "yes" | "no" | "normal" | "priority" | "top" | "text" {
  if (value === "○") return "yes";
  if (value === "－") return "no";
  if (value === "最優先") return "top";
  if (value === "優先") return "priority";
  if (value === "通常") return "normal";
  return "text";
}

function PlanFeatureValue({ value }: { value: string }) {
  const tone = planFeatureTone(value);
  return <span className={`for-shops-plan-value is-${tone}`}>{value}</span>;
}

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
    <header className={`fsl-section-head ${light ? "is-light" : ""}`}>
      <div className="fsl-section-head__eyebrow">
        <span className="fsl-section-head__line" aria-hidden="true" />
        <span>{eyebrow}</span>
        <span className="fsl-section-head__line" aria-hidden="true" />
      </div>
      <h2 className="fsl-section-head__title">{title}</h2>
    </header>
  );
}

export default function ForShopsPage() {
  return (
    <div className="for-shops-page">
      <ForShopsLandingHero />

      <div className="for-shops-container">
        <ForShopsLandingFeatures />
      </div>

      <section className="for-shops-section for-shops-section-alt">
        <div className="for-shops-container">
          <SectionHeading eyebrow="COMPARISON" title="他サイトとの違い" light />
          <div className="for-shops-table-wrap">
            <table className="for-shops-table">
              <thead>
                <tr>
                  <th scope="col">項目</th>
                  <th scope="col">{SITE_BRAND_JA}</th>
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
                  <span className="for-shops-plan-price-currency">¥</span>
                  <span className="for-shops-plan-price-amount">{plan.price}</span>
                  <small>/ 月（税別）</small>
                </p>
                <ul className="for-shops-plan-list">
                  {PLAN_FEATURE_ROWS.map((row) => (
                    <li key={row.label}>
                      <span>{row.label}</span>
                      <PlanFeatureValue value={row[plan.key]} />
                    </li>
                  ))}
                </ul>
                <a
                  href="#for-shops-contact"
                  className={`for-shops-btn ${plan.recommended ? "for-shops-btn-primary" : "for-shops-btn-secondary"}`}
                >
                  このプランで相談する
                </a>
              </article>
            ))}
          </div>

          <div className="for-shops-plan-compare">
            <h3 className="for-shops-plan-compare-title">プラン比較表</h3>
            <div className="for-shops-table-wrap for-shops-plan-table-wrap">
              <table className="for-shops-table for-shops-plan-table">
                <thead>
                  <tr>
                    <th scope="col">項目</th>
                    <th scope="col">ライト</th>
                    <th scope="col">スタンダード</th>
                    <th scope="col" className="is-premium-col">
                      プレミアム
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="for-shops-plan-table-price-row">
                    <th scope="row">月額料金</th>
                    <td>
                      <span className="for-shops-plan-table-price">¥12,000</span>
                    </td>
                    <td>
                      <span className="for-shops-plan-table-price">¥25,000</span>
                    </td>
                    <td className="is-premium-col">
                      <span className="for-shops-plan-table-price is-premium">¥38,000</span>
                    </td>
                  </tr>
                  {PLAN_FEATURE_ROWS.map((row) => (
                    <tr key={row.label}>
                      <th scope="row">{row.label}</th>
                      <td>
                        <PlanFeatureValue value={row.light} />
                      </td>
                      <td>
                        <PlanFeatureValue value={row.standard} />
                      </td>
                      <td className="is-premium-col">
                        <PlanFeatureValue value={row.premium} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
          <header className="fsl-section-head is-light is-on-dark">
            <div className="fsl-section-head__eyebrow">
              <span className="fsl-section-head__line" aria-hidden="true" />
              <span>CONTACT</span>
              <span className="fsl-section-head__line" aria-hidden="true" />
            </div>
            <h2 className="fsl-section-head__title">掲載をご希望の店舗様はこちら</h2>
          </header>
          <p className="for-shops-cta-sub">
            お問い合わせフォーム、電話、メールからお気軽にご相談ください。
          </p>
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
