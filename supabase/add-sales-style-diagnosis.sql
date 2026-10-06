-- 営業スタイル診断（職種診断とは別テーブル）
-- Supabase SQL Editor で実行してください（このファイルは自動実行しません）。
-- 既存の user_job_type_diagnoses / job_diagnosis_events は変更・削除しません。

-- 1) マイページ保存用（ユーザーごとに最大5件。古いものはアプリ側で削除）
create table if not exists public.user_sales_style_diagnoses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  diagnosed_at timestamptz not null default now(),
  main_type text not null
    check (main_type in ('entertainer', 'healer', 'romance', 'elegant', 'natural')),
  sub_type text
    check (sub_type is null or sub_type in ('entertainer', 'healer', 'romance', 'elegant', 'natural')),
  answers jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_sales_style_diagnoses_user_diagnosed_idx
  on public.user_sales_style_diagnoses(user_id, diagnosed_at desc);

drop trigger if exists user_sales_style_diagnoses_set_updated_at on public.user_sales_style_diagnoses;
create trigger user_sales_style_diagnoses_set_updated_at
before update on public.user_sales_style_diagnoses
for each row
execute function public.set_timestamp_updated_at();

alter table public.user_sales_style_diagnoses enable row level security;
revoke all on public.user_sales_style_diagnoses from anon, authenticated;

comment on table public.user_sales_style_diagnoses is
  '営業スタイル診断の保存結果（マイページ表示用）。職種診断とは別管理';

-- 2) 結果画面到達イベント（女の子利用状況の集計用）
create table if not exists public.sales_style_diagnosis_events (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  session_id text not null,
  -- 同一完了の二重計測防止（クライアント発行の完了キー）
  completion_key text not null,
  device_type text,
  main_type text,
  sub_type text,
  user_agent text,
  created_at timestamptz not null default now(),
  unique (completion_key)
);

create index if not exists sales_style_diagnosis_events_occurred_at_idx
  on public.sales_style_diagnosis_events (occurred_at desc);

alter table public.sales_style_diagnosis_events enable row level security;
revoke all on public.sales_style_diagnosis_events from anon, authenticated;

comment on table public.sales_style_diagnosis_events is
  '営業スタイル診断の結果画面到達イベント（匿名集計用。氏名・電話・メールは保存しない）';
comment on column public.sales_style_diagnosis_events.completion_key is
  '1回の診断完了ごとの一意キー。再読込・二重送信を防ぐ';

notify pgrst, 'reload schema';
