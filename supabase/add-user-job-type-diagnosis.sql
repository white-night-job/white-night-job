-- 職種診断結果保存用テーブル
-- Supabase SQL Editor で実行してください。

create table if not exists public.user_job_type_diagnoses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  diagnosed_at timestamptz not null default now(),
  first_job_type text not null,
  first_percent integer not null,
  second_job_type text not null,
  second_percent integer not null,
  answers jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_job_type_diagnoses_user_id_idx
  on public.user_job_type_diagnoses(user_id);

drop trigger if exists user_job_type_diagnoses_set_updated_at on public.user_job_type_diagnoses;
create trigger user_job_type_diagnoses_set_updated_at
before update on public.user_job_type_diagnoses
for each row
execute function public.set_timestamp_updated_at();
