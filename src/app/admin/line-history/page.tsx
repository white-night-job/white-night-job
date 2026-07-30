"use client";

import { LineNotificationHistoryPanel } from "@/components/admin/LineNotificationHistoryPanel";

export default function AdminLineHistoryPage() {
  return (
    <div>
      <header className="admin-page-header">
        <h1>LINE通知履歴</h1>
        <p>送信済みのLINE通知履歴を確認します。</p>
      </header>
      <div className="rounded-xl border border-black/10 bg-white p-4 sm:p-5">
        <LineNotificationHistoryPanel embedded active />
      </div>
    </div>
  );
}
