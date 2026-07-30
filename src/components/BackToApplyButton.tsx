"use client";

import { useRouter } from "next/navigation";

export function BackToApplyButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        if (window.history.length > 1) {
          router.back();
          return;
        }
        router.push("/for-shops/apply");
      }}
      className="mb-4 inline-flex items-center text-sm font-medium text-gold-dark underline"
    >
      ← 戻る
    </button>
  );
}
