import Link from "next/link";

const CARDS = [
  {
    href: "/admin/listing-reviews",
    title: "掲載審査管理",
    description: "店舗掲載申請の一覧確認、承認・保留・却下、管理メモ。",
  },
  {
    href: "/admin/jobs",
    title: "求人管理",
    description: "掲載店舗の検索、求人の追加・編集、公開状態の管理。",
  },
  {
    href: "/admin/subscriptions",
    title: "Stripe契約管理",
    description: "契約一覧、プラン変更、停止・再開・解約の管理。",
  },
  {
    href: "/admin/user-activity",
    title: "女の子利用状況",
    description: "求人閲覧・応募クリック・診断・報告などの匿名利用状況。",
  },
  {
    href: "/admin/line-broadcast",
    title: "LINE配信管理",
    description: "エリア配信やおすすめ通知などのLINE配信操作。",
  },
  {
    href: "/admin/line-history",
    title: "LINE通知履歴",
    description: "送信済みLINE通知の履歴確認。",
  },
] as const;

export default function AdminDashboardPage() {
  return (
    <div>
      <header className="admin-page-header">
        <h1>管理ダッシュボード</h1>
        <p>管理者専用画面です。左の「管理項目」から各機能へ移動できます。</p>
      </header>

      <div className="admin-card-grid">
        {CARDS.map((card) => (
          <Link key={card.href} href={card.href} className="admin-dash-card">
            <h2>{card.title}</h2>
            <p>{card.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
