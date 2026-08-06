-- 運営向け通知センター（Stripe決済イベントなど）
-- Supabase SQL Editor で実行してください（このファイルは自動実行しません）

create table if not exists public.admin_notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  store_id uuid references public.jobs (id) on delete set null,
  title text not null,
  message text not null,
  created_at timestamptz not null default now(),
  is_read boolean not null default false
);

create index if not exists admin_notifications_created_at_idx
  on public.admin_notifications (created_at desc);

create index if not exists admin_notifications_is_read_idx
  on public.admin_notifications (is_read, created_at desc);

create index if not exists admin_notifications_type_idx
  on public.admin_notifications (type);

create index if not exists admin_notifications_store_id_idx
  on public.admin_notifications (store_id);

alter table public.admin_notifications enable row level security;

drop policy if exists "admin_notifications_no_public_read"
  on public.admin_notifications;
create policy "admin_notifications_no_public_read"
on public.admin_notifications
for select
to anon, authenticated
using (false);

comment on table public.admin_notifications is
  '運営向け通知センター（Stripe決済・契約イベントなど）';
comment on column public.admin_notifications.type is
  '例: stripe_new_contract / stripe_invoice_paid / stripe_payment_failed / stripe_canceled';

notify pgrst, 'reload schema';
