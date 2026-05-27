-- 既存のjobsテーブルにSNSリンク用カラムを追加するSQL
-- Supabase SQL Editorで1回だけ実行してください。

alter table public.jobs
add column if not exists x_url text,
add column if not exists instagram_url text,
add column if not exists tiktok_url text,
add column if not exists youtube_url text;
