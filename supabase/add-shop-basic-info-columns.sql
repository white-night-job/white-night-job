-- 既存のjobsテーブルにお店の基本情報カラムを追加するSQL
-- Supabase SQL Editorで1回だけ実行してください。

alter table public.jobs
add column if not exists shop_atmosphere text,
add column if not exists customer_age_group text,
add column if not exists customer_trend text;
