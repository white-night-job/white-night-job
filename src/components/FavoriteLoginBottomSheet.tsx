"use client";

import { useEffect } from "react";
import { LineIcon } from "@/components/LineIcon";

type FavoriteLoginBottomSheetProps = {
  open: boolean;
  onClose: () => void;
  lineLoginHref: string;
};

export function FavoriteLoginBottomSheet({
  open,
  onClose,
  lineLoginHref,
}: FavoriteLoginBottomSheetProps) {
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
    <div className="favorite-login-sheet-root" role="presentation">
      <button
        type="button"
        aria-label="閉じる"
        className="favorite-login-sheet-backdrop"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="favorite-login-sheet-title"
        className="favorite-login-sheet-panel"
      >
        <div className="favorite-login-sheet-handle" aria-hidden />
        <h2
          id="favorite-login-sheet-title"
          className="favorite-login-sheet-title font-serif"
        >
          このお店を保存しますか？
        </h2>
        <p className="favorite-login-sheet-desc">
          LINEログインすると、お気に入り店舗を保存して、次回もすぐ確認できます。
        </p>
        <div className="favorite-login-sheet-actions">
          <a href={lineLoginHref} className="favorite-login-sheet-primary">
            <LineIcon className="h-[1.125rem] w-[1.125rem] shrink-0" />
            LINEでログインして保存
          </a>
          <button
            type="button"
            onClick={onClose}
            className="favorite-login-sheet-secondary"
          >
            今はしない
          </button>
        </div>
      </div>
    </div>
  );
}
