-- job_diagnosis_events の RLS ポリシー
-- Supabase SQL Editor で実行してください（このファイルは自動実行しません）。
--
-- 方針:
-- ・anon / authenticated は SELECT・UPDATE・DELETE 不可
-- ・anon / authenticated は job_diagnosis_completed の INSERT のみ可
-- ・管理画面・Next.js API の集計/記録は service_role（RLS バイパス）
-- ・氏名・電話・メール等の個人情報カラムは持たない（既存テーブル定義を維持）

alter table public.job_diagnosis_events enable row level security;

-- event_type は completed のみ（テーブル定義の再確認）
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'job_diagnosis_events_event_type_check'
  ) then
    alter table public.job_diagnosis_events
      add constraint job_diagnosis_events_event_type_check
      check (event_type = 'job_diagnosis_completed');
  end if;
end $$;

-- 既存ポリシーを作り直す（名前衝突回避）
drop policy if exists "job_diagnosis_events anon insert completed"
  on public.job_diagnosis_events;
drop policy if exists "job_diagnosis_events authenticated insert completed"
  on public.job_diagnosis_events;
drop policy if exists "job_diagnosis_events select none"
  on public.job_diagnosis_events;

-- 一般ユーザー（未ログイン含む）: 診断完了イベントのみ INSERT 可
create policy "job_diagnosis_events anon insert completed"
  on public.job_diagnosis_events
  for insert
  to anon
  with check (
    event_type = 'job_diagnosis_completed'
    and session_id is not null
    and length(trim(session_id)) > 0
    and completion_key is not null
    and length(trim(completion_key)) > 0
  );

create policy "job_diagnosis_events authenticated insert completed"
  on public.job_diagnosis_events
  for insert
  to authenticated
  with check (
    event_type = 'job_diagnosis_completed'
    and session_id is not null
    and length(trim(session_id)) > 0
    and completion_key is not null
    and length(trim(completion_key)) > 0
  );

-- SELECT / UPDATE / DELETE ポリシーは作らない
-- → anon / authenticated は読み取り・更新・削除不可

revoke all on table public.job_diagnosis_events from public;
revoke all on table public.job_diagnosis_events from anon;
revoke all on table public.job_diagnosis_events from authenticated;

grant usage on schema public to anon, authenticated, service_role;

-- クライアント直INSERT用（未ログイン含む）
grant insert on table public.job_diagnosis_events to anon, authenticated;

-- 管理画面・API（service_role は RLS をバイパス）
grant select, insert, update, delete on table public.job_diagnosis_events to service_role;

comment on table public.job_diagnosis_events is
  '職種診断の結果画面到達イベント。RLS: SELECT不可 / INSERTは job_diagnosis_completed のみ。PII非保存。集計は service_role。';

notify pgrst, 'reload schema';
