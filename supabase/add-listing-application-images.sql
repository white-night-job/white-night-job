-- 掲載申込の店舗画像バケット作成（非公開）＋ DBカラム追加
-- Supabase SQL Editor で実行してください
-- 既存データ・既存カラムは壊しません（IF NOT EXISTS）
--
-- コード側の保存値（ListingShopImage オブジェクト配列）に合わせ jsonb を使用:
--   storagePath, fileName, mimeType, size, kind, sortOrder, uploadedAt
-- PostgREST キー名:
--   shop_exterior_images / shop_interior_images

-- listing_applications に店舗画像カラムを追加
alter table public.listing_applications
  add column if not exists shop_exterior_images jsonb not null default '[]'::jsonb,
  add column if not exists shop_interior_images jsonb not null default '[]'::jsonb;

comment on column public.listing_applications.shop_exterior_images is
  '店舗外観画像メタデータ配列（jsonb）。必須・最大5枚。';
comment on column public.listing_applications.shop_interior_images is
  '店舗内観画像メタデータ配列（jsonb）。必須・最大10枚。';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
select
  'listing-application-images',
  'listing-application-images',
  false,
  10485760,
  array[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif'
  ]::text[]
where not exists (
  select 1 from storage.buckets where id = 'listing-application-images'
);

-- 既存バケットがある場合も制限値をそろえる
update storage.buckets
set
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = array[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif'
  ]::text[]
where id = 'listing-application-images';

-- 既存ポリシー重複回避
drop policy if exists "listing application images admin read" on storage.objects;
drop policy if exists "listing application images admin write" on storage.objects;

-- 管理者のみ閲覧可能（一般ユーザーは不可）
create policy "listing application images admin read"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'listing-application-images'
  and coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
);

-- 管理者のみ直接書き込み可能（通常は service role API が実行）
create policy "listing application images admin write"
on storage.objects
for all
to authenticated
using (
  bucket_id = 'listing-application-images'
  and coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
)
with check (
  bucket_id = 'listing-application-images'
  and coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
);

notify pgrst, 'reload schema';
