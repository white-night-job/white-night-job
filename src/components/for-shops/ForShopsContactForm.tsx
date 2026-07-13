"use client";

import { useState } from "react";

const CONTACT_EMAIL = "whitenightjob.info@gmail.com";
const CONTACT_PHONE = "090-8371-7443";
const CONTACT_LINE_URL = "https://line.me/ti/p/gI8BFeh2LH";

export function ForShopsContactForm() {
  const [shopName, setShopName] = useState("");
  const [area, setArea] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [plan, setPlan] = useState("ご相談");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = [
      "【掲載のお問い合わせ】",
      `店舗名: ${shopName}`,
      `エリア: ${area}`,
      `ご担当者名: ${name}`,
      `メール: ${email}`,
      `電話: ${phone}`,
      `ご希望プラン: ${plan}`,
      "",
      "【お問い合わせ内容】",
      message,
    ].join("\n");

    const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
      `【掲載相談】${shopName || "店舗名未入力"}`,
    )}&body=${encodeURIComponent(body)}`;

    window.location.href = mailto;
    setSent(true);
  }

  return (
    <div className="for-shops-contact-grid">
      <form className="for-shops-contact-form" onSubmit={handleSubmit}>
        <div className="for-shops-field">
          <label htmlFor="for-shops-shop-name">店舗名</label>
          <input
            id="for-shops-shop-name"
            value={shopName}
            onChange={(event) => setShopName(event.target.value)}
            required
            placeholder="例：Club Example"
          />
        </div>
        <div className="for-shops-field">
          <label htmlFor="for-shops-area">エリア</label>
          <input
            id="for-shops-area"
            value={area}
            onChange={(event) => setArea(event.target.value)}
            required
            placeholder="例：すすきの / 札幌駅前"
          />
        </div>
        <div className="for-shops-field">
          <label htmlFor="for-shops-name">ご担当者名</label>
          <input
            id="for-shops-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            placeholder="例：山田 太郎"
          />
        </div>
        <div className="for-shops-field-row">
          <div className="for-shops-field">
            <label htmlFor="for-shops-email">メールアドレス</label>
            <input
              id="for-shops-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              placeholder="example@email.com"
            />
          </div>
          <div className="for-shops-field">
            <label htmlFor="for-shops-phone">電話番号</label>
            <input
              id="for-shops-phone"
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="090-0000-0000"
            />
          </div>
        </div>
        <div className="for-shops-field">
          <label htmlFor="for-shops-plan">ご希望プラン</label>
          <select
            id="for-shops-plan"
            value={plan}
            onChange={(event) => setPlan(event.target.value)}
          >
            <option value="ご相談">まずはご相談</option>
            <option value="ライトプラン">ライトプラン</option>
            <option value="スタンダードプラン">スタンダードプラン</option>
            <option value="プレミアムプラン">プレミアムプラン</option>
          </select>
        </div>
        <div className="for-shops-field">
          <label htmlFor="for-shops-message">お問い合わせ内容</label>
          <textarea
            id="for-shops-message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={5}
            required
            placeholder="掲載希望の詳細、ご質問などご記入ください"
          />
        </div>
        <button type="submit" className="for-shops-btn for-shops-btn-primary">
          お問い合わせを送信
        </button>
        {sent && (
          <p className="for-shops-contact-note">
            メールアプリが開きます。送信後、担当よりご連絡いたします。
          </p>
        )}
      </form>

      <div className="for-shops-contact-channels">
        <p className="for-shops-contact-channels-title">その他のご連絡方法</p>
        <a href={`tel:${CONTACT_PHONE.replace(/-/g, "")}`} className="for-shops-channel-card">
          <span className="for-shops-channel-label">電話</span>
          <span className="for-shops-channel-value">{CONTACT_PHONE}</span>
        </a>
        <a href={`mailto:${CONTACT_EMAIL}`} className="for-shops-channel-card">
          <span className="for-shops-channel-label">メール</span>
          <span className="for-shops-channel-value">{CONTACT_EMAIL}</span>
        </a>
        <a
          href={CONTACT_LINE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="for-shops-channel-card"
        >
          <span className="for-shops-channel-label">LINE</span>
          <span className="for-shops-channel-value">友だち追加してご相談ください</span>
        </a>
      </div>
    </div>
  );
}
