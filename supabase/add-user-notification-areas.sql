-- ユーザー通知エリア設定
create table if not exists public.user_notification_areas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  area text not null,
  created_at timestamptz not null default now(),
  unique (user_id, area)
);

create index if not exists user_notification_areas_user_id_idx
  on public.user_notification_areas(user_id);

create index if not exists user_notification_areas_area_idx
  on public.user_notification_areas(area);
