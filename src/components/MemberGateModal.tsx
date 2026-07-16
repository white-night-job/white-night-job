"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { LineLoginButton } from "@/components/LineLoginButton";

type MemberGateModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  redirectPath: string;
  action?: "consultation" | "diagnosis" | "general";
};

export function MemberGateModal({
  open,
  onClose,
  title,
  description,
  redirectPath,
  action = "general",
}: MemberGateModalProps) {
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
    <div className="member-gate-modal-root" role="presentation">
      <button
        type="button"
        aria-label="閉じる"
        className="member-gate-modal-backdrop"
        onClick={onClose}
      />

      <div className="member-gate-modal-viewport">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="member-gate-modal-title"
          className="member-gate-modal-panel"
        >
          <h2 id="member-gate-modal-title" className="member-gate-modal-title font-serif">
            {title}
          </h2>
          <p className="member-gate-modal-desc">{description}</p>

          <LineLoginButton
            className="member-gate-modal-primary"
            redirectPath={redirectPath}
            action={action}
            showIcon
          >
            LINEでかんたんログイン
          </LineLoginButton>

          <button type="button" onClick={onClose} className="member-gate-modal-secondary">
            今はしない
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
