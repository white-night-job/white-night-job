"use client";

import { UserActivityPanel } from "@/components/admin/UserActivityPanel";

export default function AdminUserActivityPage() {
  return (
    <div>
      <header className="admin-page-header">
        <h1>女の子利用状況</h1>
        <p>
          求人閲覧・応募クリック・診断・報告などの匿名利用状況を確認します。
        </p>
      </header>
      <UserActivityPanel />
    </div>
  );
}
