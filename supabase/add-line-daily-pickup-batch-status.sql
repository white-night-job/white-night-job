-- 毎日PickUp配信バッチの状態管理
-- Supabase SQL Editor で実行してください（このファイルは自動実行しません）。

alter table public.line_notification_batches
  add column if not exists status text;

alter table public.line_notification_batches
  add column if not exists scheduled_date date;

alter table public.line_notification_batches
  add column if not exists error_message text;

alter table public.line_notification_batches
  add column if not exists skipped_count integer not null default 0;

-- 既存行: detail が scheduled で成功0なら processing 扱いを避けるため completed に寄せる
update public.line_notification_batches
set status = case
  when coalesce(success_count, 0) > 0 and coalesce(fail_count, 0) = 0 then 'completed'
  when coalesce(success_count, 0) = 0 and coalesce(fail_count, 0) > 0 then 'failed'
  when coalesce(target_count, 0) = 0 then 'skipped'
  when coalesce(success_count, 0) = 0 and coalesce(fail_count, 0) = 0 then 'failed'
  else 'completed'
end
where status is null;

alter table public.line_notification_batches
  alter column status set default 'completed';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'line_notification_batches_status_check'
  ) then
    alter table public.line_notification_batches
      add constraint line_notification_batches_status_check
      check (status in ('processing', 'completed', 'failed', 'skipped'));
  end if;
end $$;

create index if not exists line_notification_batches_scheduled_date_idx
  on public.line_notification_batches (notify_type, scheduled_date desc);
