"use client";

import { AdminGirlReviewsPanel } from "@/components/admin/AdminGirlReviewsPanel";

export default function AdminGirlReviewsPage() {
  return (
    <div>
      <header className="admin-page-header">
        <h1>女の子の口コミ管理</h1>
        <p>
          AI自動評価の確認と、公開星評価の手動修正を行います。店舗・投稿者は星評価を変更できません。
        </p>
      </header>
      <AdminGirlReviewsPanel />
    </div>
  );
}
