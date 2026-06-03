-- 入店・在籍キャストの声カラムを追加するSQL
-- Supabase SQL Editorで1回だけ実行してください。

alter table public.jobs
add column if not exists cast_voice text;

comment on column public.jobs.cast_voice is '入店・在籍キャストの声（求人詳細ページに表示）';
