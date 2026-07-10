"use client";

import { useEffect } from "react";
import { LineIcon } from "@/components/LineIcon";

type HeaderLoginModalProps = {
  open: boolean;
  onClose: () => void;
  lineLoginHref: string;
};

export function HeaderLoginModal({
  open,
  onClose,
  lineLoginHref,
}: HeaderLoginModalProps) {
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="header-login-modal-root" role="presentation">
      <button
        type="button"
        aria-label="閉じる"
        className="header-login-modal-backdrop"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="header-login-modal-title"
        className="header-login-modal-panel"
      >
        <section className="header-login-modal-line-card">
          <span className="header-login-modal-badge">おすすめ</span>

          <div className="header-login-modal-line-title">
            <span className="header-login-modal-line-dot" aria-hidden />
            <h2 id="header-login-modal-title" className="header-login-modal-heading">
              LINEでかんたんログイン
            </h2>
          </div>

          <p className="header-login-modal-line-desc">
            お気に入り・新着/PickUp通知・閲覧履歴・ナイトワーク診断・AI相談が利用できます。
          </p>

          <p className="header-login-modal-line-note">
            登録無料・30日間自動ログイン
          </p>

          <a href={lineLoginHref} className="header-login-modal-line-btn">
            <LineIcon className="h-[1.125rem] w-[1.125rem] shrink-0" />
            LINEでログイン
          </a>
        </section>

        <div className="header-login-modal-divider" aria-hidden />

        <section className="header-login-modal-guest-card">
          <h3 className="header-login-modal-guest-title">まずはゲストで利用</h3>
          <p className="header-login-modal-guest-desc">
            求人検索・店舗閲覧をご利用いただけます。
          </p>
          <button
            type="button"
            onClick={onClose}
            className="header-login-modal-guest-btn"
          >
            ゲストで利用
          </button>
        </section>
      </div>
    </div>
  );
}
