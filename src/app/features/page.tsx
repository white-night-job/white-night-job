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

type FeatureItem = {
  num: string;
  title: string;
  text: string;
  featured?: boolean;
  icon: ReactNode;
};

const FEATURES: FeatureItem[] = [
  {
    num: "01",
    title: "AIによる応募前サポート",
    text: "求職者の質問にAIが24時間対応。店舗情報の案内や応募前の疑問・不安の解消をサポートし、応募を検討しやすい環境を提供します。",
    featured: true,
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
    num: "02",
    title: "LINEおすすめ通知",
    text: "求職者の希望エリアに合わせて求人情報をLINEでお届け。店舗の求人情報を求職者へ届ける機会を増やし、応募につながる接点を広げます。",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
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
    num: "03",
    title: "職種診断",
    text: "求職者が質問に答えることで、自分に合った夜職の職種を診断。仕事選びのきっかけを提供し、店舗との新たな出会いを生み出します。",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M12 8v4l2.5 1.5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="m16.5 7.5 1.2-1.2M7.5 7.5 6.3 6.3"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    num: "04",
    title: "店舗比較機能",
    text: "気になる店舗を最大5店舗まで比較可能。給与・待遇・特徴などを比較し、求職者が自分に合う店舗を検討できます。",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M5 19V9M10 19V5M15 19v-6M20 19V8"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          d="M4 19h17"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    num: "05",
    title: "お気に入り機能",
    text: "気になる店舗をお気に入りに保存。後から求人情報を見返せるため、応募を検討する機会を増やします。",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 20s-6.5-4.1-8.4-7.2C2.2 10.5 3 7.8 5.4 6.7c1.6-.7 3.4-.2 4.5 1.1L12 10l2.1-2.2c1.1-1.3 2.9-1.8 4.5-1.1 2.4 1.1 3.2 3.8 1.8 6.1C18.5 15.9 12 20 12 20Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    num: "06",
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
    num: "07",
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
    num: "08",
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
];

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
              <article
                className={`wnf-card${feature.featured ? " is-featured" : ""}`}
              >
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
