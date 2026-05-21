# Supabase セットアップ

## 1. Supabaseプロジェクトを作成

Supabaseで新規プロジェクトを作成します。

## 2. テーブルを作成

Supabaseの **SQL Editor** を開き、`supabase/schema.sql` の内容を貼り付けて実行してください。

作成されるテーブル:

- `jobs` - 求人情報
- `reports` - ブラック店報告

## 3. 店舗写真用Storageを作成

Supabaseの **Storage** で以下のバケットを作成してください。

- Bucket name: `shop-images`
- Public bucket: ON

## 4. 環境変数を設定

`.env.example` をコピーして `.env.local` を作成します。

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_SHOP_IMAGE_BUCKET=shop-images
ADMIN_PASSWORD=管理画面のパスワード
ADMIN_SESSION_SECRET=長いランダム文字列
```

値の場所:

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase Dashboard > Project Settings > API > Project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Project Settings > API > Publishable key
- `SUPABASE_SERVICE_ROLE_KEY`: Project Settings > API > service_role key

注意:

- `SUPABASE_SERVICE_ROLE_KEY` は絶対にブラウザ側で使わないでください。このアプリではAPI Route内だけで使います。
- Publishable key だけでは管理画面の追加・編集・削除・画像アップロードを安全に実行できません。サーバー専用の `SUPABASE_SERVICE_ROLE_KEY` も必要です。
- `.env.local` はGitにコミットしないでください。

## 5. 起動

```bash
npm install
npm run dev
```

管理画面:

- `/admin`

公開ページ:

- `/`
- `/jobs`
- `/report`
