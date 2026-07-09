"use client";

import { useState } from "react";

const FAQ_ITEMS = [
  {
    question: "掲載までどのくらいですか？",
    answer:
      "お問い合わせ後、審査・掲載準備を経て公開となります。内容や審査状況により異なりますが、通常は数日〜2週間程度を目安としてください。",
  },
  {
    question: "途中でプラン変更できますか？",
    answer:
      "はい、ご契約期間中でもプラン変更のご相談が可能です。変更希望の旨をお問い合わせください。適用タイミングはプラン内容に応じてご案内します。",
  },
  {
    question: "掲載をやめたい場合は？",
    answer:
      "契約更新前までに解約申請をいただければ、次回更新以降の掲載を停止できます。詳細は掲載店舗向け利用規約およびご契約内容をご確認ください。",
  },
  {
    question: "審査はありますか？",
    answer:
      "はい、体入ホワイトナイト（White Night Job）は優良店のみを掲載する方針のため、掲載前に審査を行います。審査基準や結果の詳細開示義務は負いません。",
  },
  {
    question: "写真は変更できますか？",
    answer:
      "はい、店舗様専用ダッシュボードから店舗トップ画像などの写真をいつでも変更できます。",
  },
  {
    question: "求人情報はいつでも編集できますか？",
    answer:
      "はい、掲載店舗専用ダッシュボードから求人情報・待遇・紹介文などをいつでも編集・更新できます。",
  },
] as const;

export function ForShopsFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="for-shops-faq">
      {FAQ_ITEMS.map((item, index) => {
        const open = openIndex === index;
        return (
          <div key={item.question} className="for-shops-faq-item">
            <button
              type="button"
              className="for-shops-faq-trigger"
              aria-expanded={open}
              onClick={() => setOpenIndex(open ? null : index)}
            >
              <span className="for-shops-faq-q">Q.</span>
              <span className="for-shops-faq-question">{item.question}</span>
              <span className={`for-shops-faq-chevron ${open ? "is-open" : ""}`} aria-hidden>
                ▾
              </span>
            </button>
            {open && (
              <div className="for-shops-faq-answer">
                <span className="for-shops-faq-a">A.</span>
                <p>{item.answer}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
