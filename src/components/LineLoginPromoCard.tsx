"use client";

import { useEffect, useState } from "react";
import { LineIcon } from "@/components/LineIcon";
import { useUserSession } from "@/components/UserSessionProvider";

const DISMISS_STORAGE_KEY = "wn-line-promo-dismissed";

const BENEFITS = [
  "お気に入り店舗を保存",
  "最近見た店舗を確認",
  "希望エリアの新着求人をLINEで受け取る",
] as const;

export function LineLoginPromoCard() {
  const { isLoggedIn, ready } = useUserSession();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(sessionStorage.getItem(DISMISS_STORAGE_KEY) === "1");
  }, []);

  function handleDismiss() {
    sessionStorage.setItem(DISMISS_STORAGE_KEY, "1");
    setDismissed(true);
  }

  if (!ready || isLoggedIn || dismissed) {
    return null;
  }

  return (
    <section
      aria-labelledby="line-login-promo-heading"
      className="line-login-promo-card"
    >
      <button
        type="button"
        onClick={handleDismiss}
        className="line-login-promo-close"
        aria-label="LINEログイン案内を閉じる"
      >
        ×
      </button>

      <h2 id="line-login-promo-heading" className="line-login-promo-heading">
        LINE連携でもっと便利に
      </h2>

      <ul className="line-login-promo-list">
        {BENEFITS.map((benefit) => (
          <li key={benefit}>{benefit}</li>
        ))}
      </ul>

      <a
        href="/api/line/login?redirect=%2Fmypage"
        className="line-login-promo-btn"
      >
        <LineIcon className="h-[1.125rem] w-[1.125rem] shrink-0" />
        LINEでかんたんログイン
      </a>

      <p className="line-login-promo-note">登録不要・30日間ログイン状態を保持</p>
    </section>
  );
}
