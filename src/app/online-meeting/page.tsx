import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { OnlineMeetingRequestForm } from "@/components/OnlineMeetingRequestForm";
import { ONLINE_MEETING_LINE_ACCOUNT_ID } from "@/lib/online-meeting";
import { buildPageMetadata } from "@/lib/seo";
import "./online-meeting.css";

export const metadata: Metadata = buildPageMetadata(
  "オンライン面談｜掲載をご検討中の店舗様へ",
  "White Night Jobへの掲載をご検討中の店舗様向け無料オンライン面談のご案内。サービス内容、料金プラン、掲載までの流れについて、契約前に担当者がオンラインでご説明します。面談予約は契約成立ではありません。",
  "/online-meeting",
);

const HIGHLIGHTS: { label: string; icon: ReactNode }[] = [
  {
    label: "相談無料",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M8.5 12.2 11 14.7 15.5 9.5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "契約前のご相談OK",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M5.5 17c-1.1-1-1.8-2.4-1.8-4C3.7 8.7 7.4 6 12 6s8.3 2.7 8.3 7-3.7 7-8.3 7c-.8 0-1.6-.1-2.3-.3L5 20.5 5.5 17Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "スマートフォンから参加可能",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="8" y="3.5" width="8" height="17" rx="2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M11 18.5h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
];

const PAIN_POINTS: { num: string; title: string; icon: ReactNode }[] = [
  {
    num: "01",
    title: "求人サイトへの掲載を検討している",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M5 7.5h14M5 12h14M5 16.5h9"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    num: "02",
    title: "White Night Jobの特徴を詳しく知りたい",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
        <path d="M12 11v5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="12" cy="8.2" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    num: "03",
    title: "自店舗に合う料金プランを相談したい",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="4" y="6" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M4 10h16" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    ),
  },
  {
    num: "04",
    title: "求人掲載までの流れを確認したい",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M7 7h10v3H7V7Zm0 7h7v3H7v-3Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    num: "05",
    title: "AIやLINE通知などの機能について知りたい",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="4" y="5" width="16" height="11" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M9 16.5 8 20l3.5-2.5H16"
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
    title: "掲載前に疑問や不安を解消したい",
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
];

const TOPICS: { num: string; title: string; texts: string[] }[] = [
  {
    num: "01",
    title: "White Night Jobのサービス紹介",
    texts: [
      "札幌の夜職に特化した求人サイトとしての特徴や、掲載サービスの仕組みをご説明します。",
    ],
  },
  {
    num: "02",
    title: "求職者向け機能のご紹介",
    texts: [
      "AIによる応募前サポート、LINEおすすめ通知、職種診断、店舗比較機能など、White Night Jobの主要機能をご紹介します。",
    ],
  },
  {
    num: "03",
    title: "掲載・料金プランのご案内",
    texts: [
      "各プランの内容や利用できる機能、料金についてご説明します。",
      "店舗のご希望に合わせて、プラン選びについてもご相談いただけます。",
    ],
  },
  {
    num: "04",
    title: "掲載までの流れ",
    texts: [
      "お申し込み、掲載審査、求人情報の準備、公開までの流れをご案内します。",
    ],
  },
  {
    num: "05",
    title: "採用活動に関するご相談",
    texts: [
      "現在の求人掲載状況や採用に関するお悩みを伺い、White Night Jobでどのようなサポートができるかをご案内します。",
    ],
  },
];

const STEPS: { step: string; title: string; text: string; note?: string }[] = [
  {
    step: "STEP 01",
    title: "ご予約",
    text: "フォームにご希望の日時を入力し、LINEで面談を申し込んでください。",
  },
  {
    step: "STEP 02",
    title: "面談のご案内",
    text: "希望日時の送信後、担当者より日程をご案内いたします。",
  },
  {
    step: "STEP 03",
    title: "オンライン面談",
    text: "ご予約の日時にオンラインでサービス内容や掲載プランについてご説明します。",
  },
  {
    step: "STEP 04",
    title: "ご検討",
    text: "面談内容をご確認いただき、掲載についてご検討ください。",
    note: "面談後、その場で契約を決めていただく必要はありません。",
  },
];

const FAQS: { q: string; a: string }[] = [
  {
    q: "オンライン面談は無料ですか？",
    a: "はい。サービス説明や掲載に関するご相談は無料です。",
  },
  {
    q: "まだ掲載を決めていませんが、相談できますか？",
    a: "はい。掲載をご検討中の段階でもご利用いただけます。",
  },
  {
    q: "面談を受けたら契約しなければなりませんか？",
    a: "いいえ。面談後にサービス内容をご確認いただき、掲載するかどうかをご判断いただけます。",
  },
  {
    q: "スマートフォンから参加できますか？",
    a: "はい。スマートフォンやパソコンからご参加いただけます。",
  },
  {
    q: "料金プランについて詳しく聞けますか？",
    a: "はい。各プランの内容や利用できる機能についてご案内いたします。",
  },
];

function ScrollToFormCta({ id }: { id?: string }) {
  return (
    <div className="wnm-book" id={id}>
      <a href="#online-meeting-form" className="wnm-book__btn">
        無料オンライン面談を予約する
      </a>
      <p className="wnm-book__hint">
        入力フォームへ移動します。面談のお申し込みは掲載契約の成立を意味するものではありません。
      </p>
    </div>
  );
}

export default function OnlineMeetingPage() {
  return (
    <div className="wn-meeting-page">
      <div className="wnm-wrap">
        <header className="wnm-hero">
          <p className="wnm-hero__eyebrow">
            <span className="wnm-line" aria-hidden />
            ONLINE MEETING
            <span className="wnm-line" aria-hidden />
          </p>
          <h1 className="wnm-hero__title">
            掲載をご検討中の店舗様へ
            <br />
            オンライン面談のご案内
          </h1>
          <p className="wnm-hero__catch">
            White Night Jobのサービス内容や掲載プランについて、担当者がオンラインでご案内いたします。
          </p>
          <div className="wnm-hero__lead">
            <p className="wnm-hero__quote">「どのような求人サイトなのか知りたい」</p>
            <p className="wnm-hero__quote">「自分の店舗に合ったプランを相談したい」</p>
            <p className="wnm-hero__quote">「掲載までの流れを確認したい」</p>
            <p>
              そんな店舗様に向けて、無料のオンライン面談をご用意しています。
            </p>
            <p>掲載を決めていない段階でも、お気軽にご相談ください。</p>
          </div>

          <p className="wnm-notice">
            <strong>対象：</strong>
            White Night Jobへの掲載を検討中の店舗経営者・採用担当者様向けです。契約済み店舗のサポート窓口ではありません。
            <br />
            <strong>ご注意：</strong>
            オンライン面談を予約・受講いただいても、掲載契約が成立するわけではありません。
          </p>

          <ul className="wnm-pillars" aria-label="オンライン面談のポイント">
            {HIGHLIGHTS.map((item) => (
              <li key={item.label} className="wnm-pillar">
                <span className="wnm-pillar__icon">{item.icon}</span>
                <p className="wnm-pillar__label">{item.label}</p>
              </li>
            ))}
          </ul>

          <ScrollToFormCta id="online-meeting-book-hero" />
        </header>

        <section className="wnm-section" aria-labelledby="wnm-pain-title">
          <div className="wnm-section-head">
            <p className="wnm-section-head__eyebrow">
              <span className="wnm-line" aria-hidden />
              FOR YOU
              <span className="wnm-line" aria-hidden />
            </p>
            <h2 id="wnm-pain-title" className="wnm-section-head__title">
              こんなお悩みはありませんか？
            </h2>
          </div>
          <ul className="wnm-cards">
            {PAIN_POINTS.map((item) => (
              <li key={item.num}>
                <article className="wnm-card">
                  <span className="wnm-card__icon" aria-hidden>
                    {item.icon}
                  </span>
                  <div>
                    <p className="wnm-card__title">
                      <span aria-hidden>{item.num} </span>
                      {item.title}
                    </p>
                  </div>
                </article>
              </li>
            ))}
          </ul>
          <p className="wnm-footer-note">
            「掲載するかどうかは、サービス内容をご確認いただいたうえでご判断いただけます。」
          </p>
        </section>

        <section className="wnm-section" aria-labelledby="wnm-topics-title">
          <div className="wnm-section-head">
            <p className="wnm-section-head__eyebrow">
              <span className="wnm-line" aria-hidden />
              AGENDA
              <span className="wnm-line" aria-hidden />
            </p>
            <h2 id="wnm-topics-title" className="wnm-section-head__title">
              面談では、こんなことをご案内します。
            </h2>
          </div>
          <ol className="wnm-topics">
            {TOPICS.map((topic) => (
              <li key={topic.num}>
                <article className="wnm-topic">
                  <div className="wnm-topic__meta">
                    <span className="wnm-topic__num" aria-hidden>
                      {topic.num}
                    </span>
                    <h3 className="wnm-topic__title">{topic.title}</h3>
                  </div>
                  {topic.texts.map((text) => (
                    <p key={text} className="wnm-topic__text">
                      {text}
                    </p>
                  ))}
                </article>
              </li>
            ))}
          </ol>
        </section>

        <section
          className="wnm-section"
          aria-labelledby="wnm-booking-title"
          id="online-meeting-form"
        >
          <div className="wnm-booking-panel">
            <div className="wnm-section-head">
              <p className="wnm-section-head__eyebrow">
                <span className="wnm-line" aria-hidden />
                RESERVE
                <span className="wnm-line" aria-hidden />
              </p>
              <h2 id="wnm-booking-title" className="wnm-section-head__title">
                無料オンライン面談を予約する
              </h2>
            </div>
            <p className="wnm-lead">
              ご希望の日時を入力し、LINE公式アカウントへ面談希望をお送りください。
            </p>
            <OnlineMeetingRequestForm
              lineOfficialAccountId={ONLINE_MEETING_LINE_ACCOUNT_ID}
            />
          </div>
        </section>

        <section className="wnm-section" aria-labelledby="wnm-flow-title">
          <div className="wnm-section-head">
            <p className="wnm-section-head__eyebrow">
              <span className="wnm-line" aria-hidden />
              FLOW
              <span className="wnm-line" aria-hidden />
            </p>
            <h2 id="wnm-flow-title" className="wnm-section-head__title">
              オンライン面談の流れ
            </h2>
          </div>
          <ol className="wnm-steps">
            {STEPS.map((step) => (
              <li key={step.step}>
                <article className="wnm-step">
                  <p className="wnm-step__label">{step.step}</p>
                  <h3 className="wnm-step__title">{step.title}</h3>
                  <p className="wnm-step__text">{step.text}</p>
                  {step.note ? (
                    <p className="wnm-step__note">{step.note}</p>
                  ) : null}
                </article>
              </li>
            ))}
          </ol>
        </section>

        <section className="wnm-section" aria-labelledby="wnm-faq-title">
          <div className="wnm-section-head">
            <p className="wnm-section-head__eyebrow">
              <span className="wnm-line" aria-hidden />
              FAQ
              <span className="wnm-line" aria-hidden />
            </p>
            <h2 id="wnm-faq-title" className="wnm-section-head__title">
              よくあるご質問
            </h2>
          </div>
          <div className="wnm-faq">
            {FAQS.map((item) => (
              <article key={item.q} className="wnm-faq__item">
                <h3 className="wnm-faq__q">Q. {item.q}</h3>
                <p className="wnm-faq__a">A. {item.a}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="wnm-bottom" aria-labelledby="wnm-bottom-title">
          <div className="wnm-section-head">
            <h2 id="wnm-bottom-title" className="wnm-section-head__title">
              まずは、White Night Jobについて知ることから。
            </h2>
          </div>
          <p className="wnm-lead">
            サービス内容や掲載に関する疑問を、オンライン面談でお気軽にご相談ください。
          </p>
          <div className="wnm-bottom__actions">
            <ScrollToFormCta />
            <Link href="/features" className="wnm-book__sub">
              White Night Jobの特徴を見る
            </Link>
            <Link href="/for-shops" className="wnm-book__sub">
              掲載・料金プランを見る
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
