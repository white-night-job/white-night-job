-- 紹介文・説明文カラムを追加し、既存の description を説明文へ移行するSQL
-- Supabase SQL Editorで1回だけ実行してください。

alter table public.jobs
add column if not exists introduction_text text;

alter table public.jobs
add column if not exists description_text text;

update public.jobs
set description_text = description
where coalesce(description_text, '') = ''
  and coalesce(description, '') <> '';

-- 既存カラムは後方互換のため残します（新規データは introduction_text / description_text を使用）
alter table public.jobs
alter column description drop not null;
