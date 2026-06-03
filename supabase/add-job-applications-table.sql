-- 求人詳細ページのLINE/電話応募クリックを記録するテーブル
-- Supabase SQL Editorで1回だけ実行してください。

create table if not exists public.job_applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  type text not null check (type in ('line', 'phone')),
  created_at timestamptz not null default now()
);

create index if not exists job_applications_job_id_idx
  on public.job_applications (job_id);

create index if not exists job_applications_job_id_type_idx
  on public.job_applications (job_id, type);

alter table public.job_applications enable row level security;
