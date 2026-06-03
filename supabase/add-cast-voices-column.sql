-- 入店・在籍キャストの声（複数人・JSON）カラムを追加するSQL
-- Supabase SQL Editorで1回だけ実行してください。
-- 既存の cast_voice カラムは削除しません（旧データの fallback 用）。

alter table public.jobs
add column if not exists cast_voices jsonb default '[]'::jsonb;

comment on column public.jobs.cast_voices is '入店・在籍キャストの声 [{ name, age, comment }]';
