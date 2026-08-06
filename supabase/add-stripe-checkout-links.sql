-- Stripe Checkout / Payment Link 管理（運営が店舗へ個別送信用）
-- Supabase SQL Editor で実行してください（このファイルは自動実行しません）

create table if not exists public.stripe_checkout_links (
  billing_key text primary key
    check (
      billing_key in (
        'light',
        'standard',
        'standard_special',
        'premium',
        'premium_special'
      )
    ),
  checkout_url text not null default '',
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

insert into public.stripe_checkout_links (billing_key, checkout_url)
values
  ('light', ''),
  ('standard', ''),
  ('standard_special', ''),
  ('premium', ''),
  ('premium_special', '')
on conflict (billing_key) do nothing;

create or replace function public.touch_stripe_checkout_links_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_stripe_checkout_links_updated_at
  on public.stripe_checkout_links;
create trigger trg_stripe_checkout_links_updated_at
before update on public.stripe_checkout_links
for each row execute function public.touch_stripe_checkout_links_updated_at();

alter table public.stripe_checkout_links enable row level security;

drop policy if exists "stripe_checkout_links_no_public_read"
  on public.stripe_checkout_links;
create policy "stripe_checkout_links_no_public_read"
on public.stripe_checkout_links
for select
to anon, authenticated
using (false);

comment on table public.stripe_checkout_links is
  '運営が店舗へ個別送信する Stripe Checkout / Payment Link（5プラン）';
comment on column public.stripe_checkout_links.billing_key is
  'light / standard / standard_special / premium / premium_special';
comment on column public.stripe_checkout_links.checkout_url is
  'Stripe Checkout または Payment Link の URL';

notify pgrst, 'reload schema';
