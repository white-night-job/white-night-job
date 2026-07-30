"use client";

import { useRouter } from "next/navigation";

export function BackToApplyButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        const returnPath =
          window.sessionStorage.getItem("listingApplicationReturnPath") ||
          "/for-shops/apply";
        if (window.history.length > 1) {
          router.back();
          return;
        }
        router.push(returnPath);
      }}
      className="mb-4 inline-flex items-center text-sm font-medium text-gold-dark underline"
    >
      ← 戻る
    </button>
  );
}
