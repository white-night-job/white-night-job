"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { LineLoginButton } from "@/components/LineLoginButton";

type HeaderLoginModalProps = {
  open: boolean;
  onClose: () => void;
  redirectPath: string;
};

export function HeaderLoginModal({
  open,
  onClose,
  redirectPath,
}: HeaderLoginModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const scrollY = window.scrollY;
    const { style } = document.body;
    const previous = {
      position: style.position,
      top: style.top,
      left: style.left,
      right: style.right,
      width: style.width,
      overflow: style.overflow,
    };

    style.position = "fixed";
    style.top = `-${scrollY}px`;
    style.left = "0";
    style.right = "0";
    style.width = "100%";
    style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      style.position = previous.position;
      style.top = previous.top;
      style.left = previous.left;
      style.right = previous.right;
      style.width = previous.width;
      style.overflow = previous.overflow;
      window.scrollTo(0, scrollY);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="header-login-modal-root" role="presentation">
      <button
        type="button"
        aria-label="閉じる"
        className="header-login-modal-backdrop"
        onClick={onClose}
      />

      <div className="header-login-modal-viewport">
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

            <LineLoginButton
              className="header-login-modal-line-btn"
              redirectPath={redirectPath}
              action="general"
              showIcon
            >
              LINEでログイン
            </LineLoginButton>
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
    </div>,
    document.body,
  );
}
