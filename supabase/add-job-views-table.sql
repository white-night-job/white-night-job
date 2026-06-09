-- 求人詳細ページの表示回数テーブル
-- Supabase SQL Editorで1回だけ実行してください。

create table if not exists public.job_views (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  created_at timestamptz not null default now(),
  user_agent text,
  referrer text
);

create index if not exists job_views_job_id_idx
  on public.job_views (job_id);

create index if not exists job_views_job_id_created_at_idx
  on public.job_views (job_id, created_at desc);

alter table public.job_views enable row level security;
