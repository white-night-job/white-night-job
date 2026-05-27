-- 既存のjobsテーブルにWebサイトURL用カラムを追加するSQL
-- Supabase SQL Editorで1回だけ実行してください。

alter table public.jobs
add column if not exists website_url text;
