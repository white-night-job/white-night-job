-- 職種診断の完了イベント（結果画面到達回数）
-- Supabase SQL Editor で実行してください（このファイルは自動実行しません）。
-- 既存の user_job_type_diagnoses（マイページ保存）は変更・削除しません。

create table if not exists public.job_diagnosis_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null default 'job_diagnosis_completed'
    check (event_type = 'job_diagnosis_completed'),
  occurred_at timestamptz not null default now(),
  session_id text not null,
  -- 同一完了の二重計測防止（クライアント発行の完了キー）
  completion_key text not null,
  device_type text,
  result_job_type text,
  area text,
  user_agent text,
  created_at timestamptz not null default now(),
  unique (completion_key)
);

create index if not exists job_diagnosis_events_occurred_at_idx
  on public.job_diagnosis_events (occurred_at desc);

create index if not exists job_diagnosis_events_type_occurred_idx
  on public.job_diagnosis_events (event_type, occurred_at desc);

comment on table public.job_diagnosis_events is
  '職種診断の結果画面到達イベント（匿名集計用。氏名・電話・メールは保存しない）';
comment on column public.job_diagnosis_events.completion_key is
  '1回の診断完了ごとの一意キー。再読込・二重送信を防ぐ';

notify pgrst, 'reload schema';
