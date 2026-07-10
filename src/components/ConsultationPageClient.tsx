"use client";

import { useEffect } from "react";
import Link from "next/link";

function openChatBot() {
  window.dispatchEvent(new CustomEvent("wn:open-chat"));
}

export function ConsultationPageClient() {
  useEffect(() => {
    openChatBot();
  }, []);

  return (
    <div className="member-feature-page">
      <div className="member-feature-page-card">
        <p className="member-gate-page-eyebrow font-serif">AI Consultation</p>
        <h1 className="member-gate-page-title font-serif">AI相談</h1>
        <p className="member-gate-page-desc">
          画面右下のチャットから、夜職の疑問を気軽にご相談ください。
          相談内容はこの端末に保存されます。
        </p>
        <button type="button" onClick={openChatBot} className="member-gate-modal-primary">
          AI相談を開く
        </button>
        <Link href="/" className="member-gate-modal-secondary member-gate-page-home-link">
          ホームへ戻る
        </Link>
      </div>
    </div>
  );
}
