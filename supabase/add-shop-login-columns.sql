-- 店舗ログイン用カラム（追加のみ）
-- Supabase SQL Editorで1回だけ実行してください。
-- 既存データの削除・初期化は行いません。

alter table public.jobs add column if not exists shop_login_id text;
alter table public.jobs add column if not exists shop_login_password text;

-- 簡易実装: 平文で保存しています。
-- 本番運用前に bcrypt 等でハッシュ化し、ログイン時は compare を使うことを推奨します。
