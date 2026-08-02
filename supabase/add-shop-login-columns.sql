-- 店舗ログイン用カラム（追加のみ）
-- Supabase SQL Editorで1回だけ実行してください。
-- 既存データの削除・初期化は行いません。

alter table public.jobs add column if not exists shop_login_id text;
alter table public.jobs add column if not exists shop_login_password text;

-- パスワードはアプリ側で AES-256-GCM 暗号文として保存します（平文保存しない）。
-- レガシー平文が残っている場合は、管理画面の「パスワード再発行」で移行できます。

notify pgrst, 'reload schema';
