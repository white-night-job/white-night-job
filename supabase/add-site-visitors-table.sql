-- サイト全体のユニーク訪問者（visitor_id 単位）
-- Supabase SQL Editor で1回だけ実行してください（このファイルは自動実行しません）。
--
-- 方針:
-- ・ページビューではなく「人」を数える（visitor_id 1件 = 1ユーザー）
-- ・anon / authenticated は直接アクセス不可（service_role / Next.js API のみ）
-- ・PII（氏名・メール・IP）は保存しない

create table if not exists public.site_visitors (
  id uuid primary key default gen_random_uuid(),
  visitor_id text not null,
  user_id uuid null,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint site_visitors_visitor_id_unique unique (visitor_id)
);

create index if not exists site_visitors_last_seen_at_idx
  on public.site_visitors (last_seen_at desc);

create index if not exists site_visitors_first_seen_at_idx
  on public.site_visitors (first_seen_at desc);

comment on table public.site_visitors is
  'サイト全体のユニーク訪問者。visitor_id 単位。管理画面のユニークユーザー数集計用。';
comment on column public.site_visitors.visitor_id is
  'ブラウザ発行の匿名ID（localStorage/cookie）。個人特定情報ではない';
comment on column public.site_visitors.user_id is
  'ログイン済みの場合のみ任意で紐付け（nullable）';

alter table public.site_visitors enable row level security;

revoke all on table public.site_visitors from public;
revoke all on table public.site_visitors from anon;
revoke all on table public.site_visitors from authenticated;

grant usage on schema public to service_role;
grant select, insert, update, delete on table public.site_visitors to service_role;

notify pgrst, 'reload schema';
