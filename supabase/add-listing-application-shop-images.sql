-- 掲載申込の店舗画像（非公開Storage）とJSONBカラム
-- Supabase SQL Editor で実行してください
-- 既存の listing_reason / shop_features / notes / attachments は削除しません

insert into storage.buckets (id, name, public)
select 'listing-application-images', 'listing-application-images', false
where not exists (
  select 1 from storage.buckets where id = 'listing-application-images'
);

alter table public.listing_applications
  add column if not exists shop_exterior_images jsonb not null default '[]'::jsonb,
  add column if not exists shop_interior_images jsonb not null default '[]'::jsonb;

comment on column public.listing_applications.shop_exterior_images is '店舗外観画像（必須・最大5枚）';
comment on column public.listing_applications.shop_interior_images is '店舗内観画像（必須・最大10枚）';

-- listing_reason / shop_features は NOT NULL のまま。フォームからは空文字を保存する。
-- 将来任意にする場合のみ、以下を実行（既存データは壊さない）:
-- alter table public.listing_applications
--   alter column listing_reason set default '',
--   alter column shop_features set default '';

notify pgrst, 'reload schema';
