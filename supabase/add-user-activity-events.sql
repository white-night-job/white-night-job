-- 女の子側の行動ログ（サイト訪問・求人閲覧・応募クリック・診断完了など）
-- Supabase SQL Editor で1回だけ実行してください（このファイルは自動実行しません）。
--
-- 方針:
-- ・anon / authenticated は SELECT・UPDATE・DELETE 不可
-- ・INSERT は Next.js API（service_role）経由のみ想定
-- ・個人を特定する情報は保存しない（anonymous_id はブラウザ発行のランダムID）

create table if not exists public.user_activity_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (
    event_type in (
      'site_visit',
      'job_detail_view',
      'line_apply_click',
      'phone_apply_click',
      'job_diagnosis_complete',
      'black_shop_report'
    )
  ),
  shop_id uuid references public.jobs(id) on delete set null,
  job_id uuid references public.jobs(id) on delete set null,
  anonymous_id text,
  user_id uuid,
  page_path text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists user_activity_events_type_created_idx
  on public.user_activity_events (event_type, created_at desc);

create index if not exists user_activity_events_anon_type_created_idx
  on public.user_activity_events (anonymous_id, event_type, created_at desc);

create index if not exists user_activity_events_job_type_created_idx
  on public.user_activity_events (job_id, event_type, created_at desc);

create index if not exists user_activity_events_created_idx
  on public.user_activity_events (created_at desc);

comment on table public.user_activity_events is
  '女の子向けサイトの行動ログ。管理画面「女の子利用状況」集計用。PII非保存。';
comment on column public.user_activity_events.event_type is
  'site_visit / job_detail_view / line_apply_click / phone_apply_click / job_diagnosis_complete / black_shop_report';
comment on column public.user_activity_events.metadata is
  'utm_source/medium/campaign/content・referrer 等（存在時のみ）';
comment on column public.user_activity_events.anonymous_id is
  'ブラウザ発行の匿名ID。個人特定情報ではない';

alter table public.user_activity_events enable row level security;

drop policy if exists "user_activity_events select none"
  on public.user_activity_events;

-- SELECT / UPDATE / DELETE / INSERT ポリシーは作らない
-- → anon / authenticated は直接アクセス不可（API の service_role のみ）

revoke all on table public.user_activity_events from public;
revoke all on table public.user_activity_events from anon;
revoke all on table public.user_activity_events from authenticated;

grant usage on schema public to service_role;
grant select, insert, update, delete on table public.user_activity_events to service_role;

notify pgrst, 'reload schema';
