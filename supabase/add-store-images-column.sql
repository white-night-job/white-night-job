-- 店内画像（複数URL・JSON）カラムを追加するSQL
-- Supabase SQL Editorで1回だけ実行してください。

alter table public.jobs
add column if not exists store_images jsonb default '[]'::jsonb;

comment on column public.jobs.store_images is '店内画像URLの配列 ["https://..."]';
