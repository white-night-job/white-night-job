-- ログインユーザーの閲覧履歴（最近見た店舗）
create table if not exists public.user_job_views (
  user_id uuid not null references public.users(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key (user_id, job_id)
);

create index if not exists user_job_views_user_viewed_idx
  on public.user_job_views (user_id, viewed_at desc);
