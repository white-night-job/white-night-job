"use client";

import { useState, type FormEvent } from "react";

export function ReportForm() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-gold/30 bg-white p-8 text-center shadow-gold">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-gold to-gold-dark text-2xl text-white">
          ✓
        </div>
        <h3 className="text-lg font-semibold text-charcoal">ご報告ありがとうございます</h3>
        <p className="mt-2 text-sm text-muted">
          内容を確認のうえ、必要に応じて調査・対応いたします。
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-gold/25 bg-white p-5 shadow-gold sm:p-8"
    >
      <div>
        <label htmlFor="shopName" className="mb-1.5 block text-sm font-medium text-charcoal">
          店舗名 <span className="text-gold-dark">*</span>
        </label>
        <input
          id="shopName"
          name="shopName"
          type="text"
          required
          placeholder="例：Club ○○"
          className="w-full rounded-xl border border-gold/30 bg-ivory px-4 py-3 text-base outline-none transition-colors focus:border-gold focus:ring-2 focus:ring-gold/20"
        />
      </div>

      <div>
        <label htmlFor="area" className="mb-1.5 block text-sm font-medium text-charcoal">
          エリア
        </label>
        <input
          id="area"
          name="area"
          type="text"
          placeholder="例：六本木"
          className="w-full rounded-xl border border-gold/30 bg-ivory px-4 py-3 text-base outline-none transition-colors focus:border-gold focus:ring-2 focus:ring-gold/20"
        />
      </div>

      <div>
        <label htmlFor="category" className="mb-1.5 block text-sm font-medium text-charcoal">
          報告種別 <span className="text-gold-dark">*</span>
        </label>
        <select
          id="category"
          name="category"
          required
          className="w-full rounded-xl border border-gold/30 bg-ivory px-4 py-3 text-base outline-none transition-colors focus:border-gold focus:ring-2 focus:ring-gold/20"
        >
          <option value="">選択してください</option>
          <option value="unpaid">未払い・給与トラブル</option>
          <option value="harassment">パワハラ・嫌がらせ</option>
          <option value="illegal">違法営業・勧誘</option>
          <option value="contract">契約違反</option>
          <option value="other">その他</option>
        </select>
      </div>

      <div>
        <label htmlFor="detail" className="mb-1.5 block text-sm font-medium text-charcoal">
          詳細内容 <span className="text-gold-dark">*</span>
        </label>
        <textarea
          id="detail"
          name="detail"
          required
          rows={5}
          placeholder="具体的な状況をご記入ください（個人情報は伏せても構いません）"
          className="w-full resize-y rounded-xl border border-gold/30 bg-ivory px-4 py-3 text-base outline-none transition-colors focus:border-gold focus:ring-2 focus:ring-gold/20"
        />
      </div>

      <div>
        <label htmlFor="contact" className="mb-1.5 block text-sm font-medium text-charcoal">
          連絡先（任意）
        </label>
        <input
          id="contact"
          name="contact"
          type="email"
          placeholder="返信が必要な場合のみ"
          className="w-full rounded-xl border border-gold/30 bg-ivory px-4 py-3 text-base outline-none transition-colors focus:border-gold focus:ring-2 focus:ring-gold/20"
        />
      </div>

      <p className="text-xs text-muted">
        ※ ご報告内容は厳重に管理し、掲載店舗の審査・削除判断に活用します。
      </p>

      <button
        type="submit"
        className="w-full rounded-full bg-gradient-to-r from-gold to-gold-dark py-3.5 text-base font-semibold text-white shadow-md transition-all hover:shadow-lg active:scale-[0.98]"
      >
        報告を送信する
      </button>
    </form>
  );
}
