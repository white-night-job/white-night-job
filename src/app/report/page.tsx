"use client";

import { useState } from "react";

const inputClass =
  "w-full rounded-xl border border-gold/30 bg-ivory px-4 py-3 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/20";

export default function ReportPage() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const payload = {
      shopName: String(formData.get("shopName") ?? ""),
      area: String(formData.get("area") ?? ""),
      category: String(formData.get("category") ?? ""),
      detail: String(formData.get("detail") ?? ""),
      contact: String(formData.get("contact") ?? ""),
    };

    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(data.message ?? "送信に失敗しました。");
      event.currentTarget.reset();
      setMessage("通報内容を保存しました。ご協力ありがとうございます。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "送信に失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-semibold text-charcoal sm:text-3xl">
          ブラック店報告
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          未払い・パワハラ・違法営業など、問題のある店舗情報をお寄せください。
        </p>
      </div>

      {message && (
        <p className="mb-4 rounded-xl border border-gold/30 bg-white px-4 py-3 text-sm text-charcoal">
          {message}
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-2xl border border-gold/25 bg-white p-5 shadow-gold sm:p-8"
      >
        <div>
          <label className="mb-1.5 block text-sm font-medium text-charcoal">
            店舗名
          </label>
          <input name="shopName" className={inputClass} required />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-charcoal">
            エリア
          </label>
          <input name="area" className={inputClass} placeholder="例：すすきの" />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-charcoal">
            報告種別
          </label>
          <select name="category" className={inputClass} required>
            <option value="">選択してください</option>
            <option value="unpaid">未払い・給与トラブル</option>
            <option value="harassment">パワハラ・嫌がらせ</option>
            <option value="illegal">違法営業・勧誘</option>
            <option value="contract">契約違反</option>
            <option value="other">その他</option>
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-charcoal">
            詳細内容
          </label>
          <textarea name="detail" rows={5} className={inputClass} required />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-charcoal">
            連絡先（任意）
          </label>
          <input name="contact" type="email" className={inputClass} />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-gradient-to-r from-gold to-gold-dark py-3.5 text-base font-semibold text-white disabled:opacity-60"
        >
          {loading ? "送信中..." : "報告を送信する"}
        </button>
      </form>
    </div>
  );
}
