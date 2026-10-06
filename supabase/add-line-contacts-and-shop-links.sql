-- White Night Job 公式LINE（Messaging API）の連絡先と、店舗への紐付け
-- Supabase SQL Editor で1回だけ実行してください（このファイルは自動実行しません）。
--
-- 方針:
-- ・line_official_contacts: 公式LINEの Webhook（署名検証済み）で受け取った userId と
--   プロフィール（表示名・画像）、直近イベント日時を保存する。メッセージ本文は保存しない
-- ・shop_line_links: 運営が管理画面で設定した「店舗（jobs.id）= LINE userId」の紐付け
-- ・内部の識別は必ず LINE userId。表示名は候補一覧の表示用のみ
-- ・求職者用の public.users とは分離する（店舗担当者が求職者向け配信の対象にならないように）
-- ・anon / authenticated は直接アクセス不可（service_role / Next.js API のみ）

create table if not exists public.line_official_contacts (
  line_user_id text primary key,
  display_name text null,
  picture_url text null,
  is_following boolean not null default true,
  last_event_type text null,
  last_event_at timestamptz null,
  profile_fetched_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists line_official_contacts_last_event_at_idx
  on public.line_official_contacts (last_event_at desc nulls last);

comment on table public.line_official_contacts is
  '公式LINEの Webhook で取得した LINE userId とプロフィール。店舗紐付けの候補一覧用';
comment on column public.line_official_contacts.is_following is
  'follow で true、unfollow（ブロック・友だち削除）で false';

create table if not exists public.shop_line_links (
  job_id uuid primary key references public.jobs(id) on delete cascade,
  line_user_id text not null
    references public.line_official_contacts(line_user_id) on delete restrict,
  linked_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists shop_line_links_line_user_id_idx
  on public.shop_line_links (line_user_id);

comment on table public.shop_line_links is
  '店舗の応募LINE通知先。運営が管理画面で設定する（1店舗につき1件）';

create or replace function public.set_timestamp_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists line_official_contacts_set_updated_at on public.line_official_contacts;
create trigger line_official_contacts_set_updated_at
before update on public.line_official_contacts
for each row
execute function public.set_timestamp_updated_at();

drop trigger if exists shop_line_links_set_updated_at on public.shop_line_links;
create trigger shop_line_links_set_updated_at
before update on public.shop_line_links
for each row
execute function public.set_timestamp_updated_at();

alter table public.line_official_contacts enable row level security;
alter table public.shop_line_links enable row level security;

revoke all on table public.line_official_contacts from public;
revoke all on table public.line_official_contacts from anon;
revoke all on table public.line_official_contacts from authenticated;
revoke all on table public.shop_line_links from public;
revoke all on table public.shop_line_links from anon;
revoke all on table public.shop_line_links from authenticated;

grant usage on schema public to service_role;
grant select, insert, update, delete on table public.line_official_contacts to service_role;
grant select, insert, update, delete on table public.shop_line_links to service_role;

notify pgrst, 'reload schema';
