-- LINE自動配信: 希望条件・表示順位・重複防止・バッチ履歴
-- Supabase SQL Editor で実行してください。

-- 求人の表示順位（通常 / 優先 / 最優先）
alter table public.jobs
  add column if not exists listing_priority text not null default 'normal';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'jobs_listing_priority_check'
  ) then
    alter table public.jobs
      add constraint jobs_listing_priority_check
      check (listing_priority in ('normal', 'priority', 'top'));
  end if;
end $$;

-- 希望時給（ユーザー通知条件）
alter table public.user_notification_settings
  add column if not exists min_hourly_wage integer not null default 0;

-- 希望職種（複数）
create table if not exists public.user_notification_job_types (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  job_type text not null,
  created_at timestamptz not null default now(),
  unique (user_id, job_type)
);

create index if not exists user_notification_job_types_user_id_idx
  on public.user_notification_job_types(user_id);

-- 同一通知の重複送信防止
create table if not exists public.line_notification_dedupe (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete cascade,
  notify_type text not null,
  fingerprint text not null,
  created_at timestamptz not null default now(),
  unique (user_id, job_id, notify_type, fingerprint)
);

create index if not exists line_notification_dedupe_job_type_idx
  on public.line_notification_dedupe(job_id, notify_type);

-- 管理画面向けバッチ送信履歴
create table if not exists public.line_notification_batches (
  id uuid primary key default gen_random_uuid(),
  sent_at timestamptz not null default now(),
  shop_name text,
  job_id uuid references public.jobs(id) on delete set null,
  notify_type text not null,
  target_count integer not null default 0,
  success_count integer not null default 0,
  fail_count integer not null default 0,
  detail text
);

create index if not exists line_notification_batches_sent_at_idx
  on public.line_notification_batches(sent_at desc);
