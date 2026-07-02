-- ピックアップ掲載フラグ
alter table public.jobs
  add column if not exists pickup_enabled boolean not null default false;

create index if not exists jobs_pickup_enabled_idx
  on public.jobs (pickup_enabled)
  where pickup_enabled = true;
