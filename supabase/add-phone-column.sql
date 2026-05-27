-- 既存のjobsテーブルに電話番号カラムを追加するSQL
-- Supabase SQL Editorで1回だけ実行してください。

alter table public.jobs
add column if not exists phone text;
