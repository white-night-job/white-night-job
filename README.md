# Safe Night Job

安心認証付きの夜職求人サイト（Next.js App Router）

## 機能

- **求人一覧** — トップページにカード形式で表示
- **求人詳細** — `/jobs/[id]` で給与・条件・待遇を表示
- **エリア検索** — URL クエリ `?area=渋谷` でフィルタ
- **LINE応募ボタン** — 求人詳細から各店舗の LINE へ遷移
- **ブラック店報告フォーム** — `/report`
- **安心認証マーク** — 審査済み店舗にバッジ表示

## デザイン

- 白（アイボリー）× ゴールドの高級感ある UI
- スマホファースト（レスポンシブ）
- Noto Sans JP / Noto Serif JP

## セットアップ

```bash
npm install
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開く。

## プロジェクト構成

```
src/
├── app/
│   ├── layout.tsx          # 共通レイアウト
│   ├── page.tsx            # 求人一覧（トップ）
│   ├── report/page.tsx     # ブラック店報告
│   └── jobs/[id]/page.tsx  # 求人詳細
├── components/
│   ├── AreaSearch.tsx      # エリア検索
│   ├── JobCard.tsx
│   ├── LineApplyButton.tsx
│   ├── ReportForm.tsx
│   └── SafetyBadge.tsx     # 安心認証マーク
├── data/
│   ├── jobs.ts             # モック求人データ
│   └── areas.ts
└── types/
    └── job.ts
```

## 次のステップ（例）

- Supabase / Prisma で DB 化
- 管理画面で求人 CRUD
- 報告フォームの API Route + メール通知
- 実際の LINE 公式アカウント URL を `.env` で管理
