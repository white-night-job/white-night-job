-- PickUp店舗 毎日20時自動配信
-- Supabase SQL Editor で実行してください。

-- 毎日配信の個別ON（初期OFF）
alter table public.user_notification_settings
  add column if not exists notify_daily_pickup boolean not null default false;

-- LINEブロック／配信不可
alter table public.users
  add column if not exists line_push_blocked boolean not null default false;

alter table public.users
  add column if not exists line_push_blocked_at timestamptz;

alter table public.users
  add column if not exists line_push_blocked_reason text;

-- 日次配信ログ（1ユーザー・1日・1種別で一意）
create table if not exists public.line_notification_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  line_user_id text not null,
  job_id uuid references public.jobs(id) on delete set null,
  notification_type text not null,
  scheduled_date date not null,
  sent_at timestamptz,
  status text not null default 'pending',
  error_message text,
  created_at timestamptz not null default now(),
  unique (user_id, scheduled_date, notification_type)
);

create index if not exists line_notification_logs_scheduled_date_idx
  on public.line_notification_logs(scheduled_date desc);

create index if not exists line_notification_logs_type_idx
  on public.line_notification_logs(notification_type);

create index if not exists line_notification_logs_job_id_idx
  on public.line_notification_logs(job_id);

create index if not exists line_notification_logs_status_idx
  on public.line_notification_logs(status);
