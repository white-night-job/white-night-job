-- 店舗ログイン: 失敗回数ロック用カラム（追加のみ）
-- Supabase SQL Editorで1回だけ実行してください。
-- パスワード列は既存の shop_login_password を継続利用し、アプリ側で AES-256-GCM 暗号文を保存します。

alter table public.jobs
  add column if not exists shop_login_failed_attempts integer not null default 0;

alter table public.jobs
  add column if not exists shop_login_locked_until timestamptz;

comment on column public.jobs.shop_login_password is
  '店舗ログインPW（AES-256-GCM暗号文。平文は保存しない）';
comment on column public.jobs.shop_login_failed_attempts is
  '店舗ログイン連続失敗回数';
comment on column public.jobs.shop_login_locked_until is
  '店舗ログインロック解除時刻（UTC）';

notify pgrst, 'reload schema';
