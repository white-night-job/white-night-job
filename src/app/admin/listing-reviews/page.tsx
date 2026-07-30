"use client";

import { Suspense } from "react";
import { ListingReviewsPanel } from "@/components/admin/ListingReviewsPanel";

export default function AdminListingReviewsPage() {
  return (
    <div>
      <header className="admin-page-header">
        <h1>掲載審査管理</h1>
        <p>
          店舗掲載申請の確認、承認・保留・却下、管理メモを行います。承認前に求人は公開されません。
        </p>
      </header>
      <Suspense
        fallback={<p className="admin-muted">申請一覧を読み込み中...</p>}
      >
        <ListingReviewsPanel />
      </Suspense>
    </div>
  );
}
