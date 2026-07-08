-- LINEログイン + お気に入り + 通知設定用テーブルを追加
-- Supabase SQL Editor でこのまま実行してください。

create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  line_user_id text unique not null,
  display_name text,
  picture_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, job_id)
);

create table if not exists public.user_notification_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  notify_new_jobs boolean not null default true,
  notify_pickup_jobs boolean not null default true,
  notify_favorite_updates boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete set null,
  type text not null,
  sent_at timestamptz not null default now(),
  status text not null default 'sent'
);

create index if not exists user_favorites_user_id_idx on public.user_favorites(user_id);
create index if not exists user_favorites_job_id_idx on public.user_favorites(job_id);
create index if not exists notification_logs_user_id_idx on public.notification_logs(user_id);
create index if not exists notification_logs_job_id_idx on public.notification_logs(job_id);
create index if not exists notification_logs_type_idx on public.notification_logs(type);

create or replace function public.set_timestamp_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
before update on public.users
for each row
execute function public.set_timestamp_updated_at();

drop trigger if exists user_notification_settings_set_updated_at on public.user_notification_settings;
create trigger user_notification_settings_set_updated_at
before update on public.user_notification_settings
for each row
execute function public.set_timestamp_updated_at();
