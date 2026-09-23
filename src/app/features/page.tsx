import type { Metadata } from "next";
import Link from "next/link";
import { buildPageMetadata } from "@/lib/seo";
import { SITE_NAME } from "@/lib/site";
import "./features.css";

export const metadata: Metadata = buildPageMetadata(
  "White Night Jobの特徴｜店舗向け採用サポート",
  "札幌の夜職に特化した優良店専門求人サイト、White Night Jobの特徴をご紹介。掲載審査、AI応募前サポート、魅力が伝わる求人ページ、アクセス・応募の可視化など、店舗の採用活動を支援します。",
  "/features",
);

const FEATURES = [
  {
    num: "01",
    title: "安心を重視した求人掲載",
    text: "掲載審査を通じて、求職者が安心して店舗を比較・検討できる求人情報を提供します。",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 3 5 6v6c0 4.5 3 7.8 7 9 4-1.2 7-4.5 7-9V6l-7-3Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="m9.2 12.1 2 2 3.8-3.9"
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
    title: "AIによる応募前サポート",
    text: "求職者の質問にAIが24時間対応。店舗情報の案内や応募前の不安解消をサポートします。",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect
          x="4"
          y="5"
          width="16"
          height="12"
          rx="3"
          stroke="currentColor"
          strokeWidth="1.6"
        />
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
    num: "03",
    title: "店舗の魅力を伝える求人ページ",
    text: "給与・待遇・営業時間に加え、店舗の雰囲気や特徴を掲載。求職者が働くイメージを持ちやすい求人ページを提供します。",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect
          x="4"
          y="4"
          width="16"
          height="16"
          rx="2.5"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <path
          d="M4 15.5 8.5 11l3 3 3.5-4.5L20 15"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="9" cy="8.5" r="1.4" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    ),
  },
  {
    num: "04",
    title: "アクセス・応募状況の可視化",
    text: "店舗ダッシュボードで表示回数や応募数を確認でき、求人内容の改善に活用できます。",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M4 19h16"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
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
    num: "05",
    title: "求職者との接点を広げる機能",
    text: "お気に入り、店舗比較、職種診断、LINE通知などを通じて、求職者と店舗の接点を広げます。",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M8.5 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM15.5 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <path
          d="M4.5 18.5c.6-2.4 2.5-3.8 4-3.8h.8c1.2 0 2.2.5 3 1.3.8-.8 1.8-1.3 3-1.3h.7c1.5 0 3.4 1.4 4 3.8"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
] as const;

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
          <h1 className="wnf-hero__title">White Night Jobの特徴</h1>
          <p className="wnf-hero__lead">
            札幌の夜職に特化した、優良店専門求人サイト。
            <br />
            求人掲載だけで終わらない、店舗の採用活動をサポートします。
          </p>
        </header>

        <ol className="wnf-list">
          {FEATURES.map((feature) => (
            <li key={feature.num}>
              <article className="wnf-card">
                <div className="wnf-card__head">
                  <span className="wnf-card__num" aria-hidden>
                    {feature.num}
                  </span>
                  <span className="wnf-card__icon">{feature.icon}</span>
                  <h2 className="wnf-card__title">{feature.title}</h2>
                </div>
                <p className="wnf-card__text">{feature.text}</p>
              </article>
            </li>
          ))}
        </ol>

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
