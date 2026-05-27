-- 既存のjobsテーブルにその他待遇カラムを追加するSQL
-- Supabase SQL Editorで1回だけ実行してください。

alter table public.jobs
add column if not exists other_benefits text[] not null default array[]::text[];
