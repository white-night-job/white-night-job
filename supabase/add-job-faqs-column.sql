-- 求人ごとのよくある質問（FAQ）カラムを追加するSQL
-- Supabase SQL Editorで1回だけ実行してください。

alter table public.jobs
add column if not exists faqs jsonb default '[]'::jsonb;

comment on column public.jobs.faqs is 'よくある質問 [{ question, answer }]（最大8件）';

-- 実行後に保存エラーが続く場合: Supabase Dashboard → Settings → API → Reload schema cache
