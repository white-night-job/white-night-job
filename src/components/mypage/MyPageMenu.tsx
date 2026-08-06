"use client";

import Link from "next/link";
import { MyPageLogoutButton } from "@/components/mypage/MyPageLogoutButton";

const MENU_ITEMS = [
  {
    href: "/mypage/favorites",
    label: "お気に入り",
    description: "保存した店舗を確認・管理できます。",
  },
  {
    href: "/mypage/history",
    label: "閲覧履歴",
    description: "最近見た求人を振り返れます。",
  },
  {
    href: "/notification-settings",
    label: "通知設定",
    description: "LINE通知の受け取り条件を変更できます。",
  },
] as const;

/**
 * マイページを設定・管理のハブとして扱うメニュー。
 */
export function MyPageMenu() {
  return (
    <section className="mt-6 rounded-2xl border border-gold/25 bg-white shadow-gold">
      <div className="border-b border-gold/15 px-5 py-4">
        <h2 className="font-serif text-lg font-semibold text-charcoal">メニュー</h2>
        <p className="mt-1 text-xs text-muted">設定・管理項目へ移動できます。</p>
      </div>

      <nav aria-label="マイページメニュー">
        <ul className="divide-y divide-gold/15">
          {MENU_ITEMS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                prefetch
                className="flex items-center justify-between gap-3 px-5 py-4 transition hover:bg-ivory/70"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-charcoal">
                    {item.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">
                    {item.description}
                  </span>
                </span>
                <span className="shrink-0 text-gold-dark" aria-hidden>
                  ›
                </span>
              </Link>
            </li>
          ))}
          <li className="px-5 py-4">
            <MyPageLogoutButton className="mt-0" />
          </li>
        </ul>
      </nav>
    </section>
  );
}
