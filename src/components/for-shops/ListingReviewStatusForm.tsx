"use client";

import { useState } from "react";
import type { ListingApplicationPublicStatus } from "@/lib/listing-application";
import { planLabel } from "@/lib/listing-application";

const inputClass =
  "w-full rounded-xl border border-gold/30 bg-ivory px-4 py-3 text-base outline-none focus:border-gold focus:ring-2 focus:ring-gold/20";

export function ListingReviewStatusForm() {
  const [applicationNumber, setApplicationNumber] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<ListingApplicationPublicStatus | null>(
    null,
  );

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setStatus(null);
    try {
      const response = await fetch("/api/listing-applications/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationNumber, contactEmail }),
      });
      const data = (await response.json()) as {
        message?: string;
        status?: ListingApplicationPublicStatus;
      };
      if (!response.ok) throw new Error(data.message ?? "確認に失敗しました。");
      setStatus(data.status ?? null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "確認に失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border border-gold/25 bg-white p-5 shadow-sm sm:p-6"
      >
        <div>
          <label className="mb-1.5 block text-sm font-medium text-charcoal">
            申請番号
          </label>
          <input
            className={inputClass}
            value={applicationNumber}
            onChange={(e) => setApplicationNumber(e.target.value)}
            placeholder="WNJ-20260729-XXXXXX"
            required
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-charcoal">
            申請時のメールアドレス
          </label>
          <input
            className={inputClass}
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-gradient-to-r from-gold to-gold-dark px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? "確認中..." : "審査状況を確認する"}
        </button>
      </form>

      {message && (
        <p className="rounded-xl border border-gold/30 bg-white px-4 py-3 text-sm">
          {message}
        </p>
      )}

      {status && (
        <div className="space-y-3 rounded-2xl border border-gold/25 bg-white p-5 text-sm text-charcoal shadow-sm">
          <p className="font-serif text-lg">審査状況</p>
          <p>
            <span className="text-muted">申請番号：</span>
            {status.applicationNumber}
          </p>
          <p>
            <span className="text-muted">店舗名：</span>
            {status.shopName}
          </p>
          <p>
            <span className="text-muted">ステータス：</span>
            <strong>{status.statusLabel}</strong>
          </p>
          <p>
            <span className="text-muted">希望プラン：</span>
            {planLabel(status.requestedPlan)}
          </p>
          {status.needsInfoMessage && (
            <div className="rounded-xl bg-ivory px-3 py-2">
              <p className="font-medium">追加確認の内容</p>
              <p className="mt-1 whitespace-pre-wrap">{status.needsInfoMessage}</p>
              {status.needsInfoDeadline && (
                <p className="mt-1 text-muted">提出期限：{status.needsInfoDeadline}</p>
              )}
            </div>
          )}
          {status.rejectionReason && (
            <div className="rounded-xl bg-ivory px-3 py-2">
              <p className="font-medium">結果について</p>
              <p className="mt-1 whitespace-pre-wrap">{status.rejectionReason}</p>
            </div>
          )}
          {status.status === "approved" && (
            <p className="text-muted">
              承認済みです。登録用URLはメールでご案内しています。
              {status.onboardingCompleted
                ? " 登録手続きは完了しています。"
                : ""}
            </p>
          )}
          <p className="text-xs text-muted">
            ※内部審査メモは表示されません。
          </p>
        </div>
      )}
    </div>
  );
}
