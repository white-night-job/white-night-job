-- 既存のjobsテーブルに営業時間・年齢層カラムを追加するSQL
-- Supabase SQL Editorで1回だけ実行してください。

alter table public.jobs
add column if not exists business_hours text,
add column if not exists age_group text;
