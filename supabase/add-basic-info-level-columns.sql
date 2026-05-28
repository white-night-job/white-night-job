-- 既存のjobsテーブルにお店の基本情報レベル用カラムを追加するSQL
-- Supabase SQL Editorで1回だけ実行してください。

alter table public.jobs
add column if not exists customer_personality_level integer check (customer_personality_level between 1 and 5),
add column if not exists customer_age_level integer check (customer_age_level between 1 and 5),
add column if not exists customer_regular_level integer check (customer_regular_level between 1 and 5);
