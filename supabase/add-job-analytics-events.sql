-- 求人アクセス・応募イベント計測
-- 既存の job_views / job_applications は維持（運営画面互換）
-- このテーブルは表示（impression）と詳細クリックを分離して集計する

create table if not exists public.job_analytics_events (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  shop_id uuid references public.jobs(id) on delete set null,
  event_type text not null check (
    event_type in (
      'job_impression',
      'job_detail_click',
      'line_click',
      'phone_click'
    )
  ),
  session_id text,
  created_at timestamptz not null default now(),
  referrer text,
  user_agent text,
  is_internal boolean not null default false
);

create index if not exists job_analytics_events_job_created_idx
  on public.job_analytics_events (job_id, created_at desc);

create index if not exists job_analytics_events_type_created_idx
  on public.job_analytics_events (event_type, created_at desc);

create index if not exists job_analytics_events_job_type_created_idx
  on public.job_analytics_events (job_id, event_type, created_at desc);

comment on table public.job_analytics_events is '求人の表示・詳細クリック・応募クリック計測（店舗分析用）';
comment on column public.job_analytics_events.event_type is 'job_impression=一覧表示 / job_detail_click=詳細開封 / line_click・phone_click=応募クリック';
comment on column public.job_analytics_events.is_internal is '運営・店舗自身のアクセス。集計から除外';

notify pgrst, 'reload schema';
