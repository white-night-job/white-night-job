-- Stripe subscription management for White Night Job
-- Supabase SQL Editor で実行してください（このファイルは自動実行しません）

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null unique references public.jobs (id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  stripe_price_id text,
  plan text not null default 'light'
    check (plan in ('light', 'standard', 'premium')),
  status text not null default 'incomplete'
    check (
      status in (
        'incomplete',
        'incomplete_expired',
        'trialing',
        'active',
        'past_due',
        'canceled',
        'unpaid',
        'paused'
      )
    ),
  payment_status text,
  payment_failed_count integer not null default 0,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_status_idx
  on public.subscriptions (status);

create index if not exists subscriptions_updated_at_idx
  on public.subscriptions (updated_at desc);

create index if not exists subscriptions_stripe_customer_id_idx
  on public.subscriptions (stripe_customer_id);

create or replace function public.touch_subscriptions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_subscriptions_updated_at on public.subscriptions;
create trigger trg_subscriptions_updated_at
before update on public.subscriptions
for each row execute function public.touch_subscriptions_updated_at();

alter table public.subscriptions enable row level security;

drop policy if exists "subscriptions_no_public_read" on public.subscriptions;
create policy "subscriptions_no_public_read"
on public.subscriptions
for select
to anon, authenticated
using (false);

comment on table public.subscriptions is
  'Stripeサブスクリプション契約情報（掲載店舗ごと）';
comment on column public.subscriptions.store_id is
  '店舗（jobs.id）';
comment on column public.subscriptions.payment_failed_count is
  '連続支払い失敗回数（invoice.payment_failedで加算）';

