"use client";

import { useEffect, useState } from "react";

/** 店舗側は表示のみ。設定済みの場合だけ表示する。 */
export function ShopLineNotifyStatus() {
  const [linked, setLinked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/shop-dashboard/line-notify", {
          cache: "no-store",
          credentials: "include",
        });
        if (!response.ok) return;
        const data = (await response.json()) as { linked?: boolean };
        if (!cancelled) setLinked(Boolean(data.linked));
      } catch {
        // 表示のみのため失敗時は何も出さない
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!linked) return null;

  return (
    <p className="-mt-5 mb-8 text-sm text-charcoal">
      応募LINE通知：
      <span className="font-semibold text-[#047a3b]">設定済み</span>
    </p>
  );
}
