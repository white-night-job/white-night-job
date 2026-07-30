-- 掲載審査承認後の店舗マスター（shops）
-- Supabase SQL Editor で実行してください。既存データは変更しません。

create table if not exists public.shops (
  id uuid primary key default gen_random_uuid(),
  listing_application_id uuid unique
    references public.listing_applications(id) on delete set null,
  shop_name text not null,
  shop_address text,
  area text,
  business_type text,
  business_hours text,
  phone text,
  contact_name text,
  contact_phone text,
  contact_email text,
  website_url text,
  instagram_url text,
  x_url text,
  tiktok_url text,
  line_official_url text,
  youtube_url text,
  other_sns text,
  open_date date,
  plan text
    check (plan is null or plan in ('light', 'standard', 'premium')),
  -- active = 掲載開始状態
  listing_status text not null default 'active'
    check (listing_status in ('active', 'paused', 'ended')),
  listing_started_at timestamptz,
  linked_job_id uuid references public.jobs(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists shops_listing_status_idx
  on public.shops (listing_status);

create index if not exists shops_shop_name_idx
  on public.shops (shop_name);

create index if not exists shops_listing_application_id_idx
  on public.shops (listing_application_id);

drop trigger if exists shops_set_updated_at on public.shops;
create trigger shops_set_updated_at
before update on public.shops
for each row execute function public.set_updated_at();

alter table public.shops enable row level security;

comment on table public.shops is '掲載審査承認後の店舗マスター（求人 jobs とは別。オンボーディング完了後に linked_job_id を紐付け可能）';
comment on column public.shops.listing_status is 'active=掲載開始 / paused=一時停止 / ended=終了';

alter table public.listing_applications
  add column if not exists linked_shop_id uuid references public.shops(id) on delete set null;

comment on column public.listing_applications.linked_shop_id is '承認時に作成した shops レコード';

notify pgrst, 'reload schema';
