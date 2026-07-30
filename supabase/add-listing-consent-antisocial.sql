-- 掲載審査: 反社会的勢力排除への同意記録
-- Supabase SQL Editor で実行してください。既存データは削除しません。

alter table public.listing_applications
  add column if not exists consent_antisocial boolean not null default false,
  add column if not exists consent_antisocial_at timestamptz,
  add column if not exists shop_terms_version text;

comment on column public.listing_applications.consent_antisocial is
  '反社会的勢力に該当しないことの表明・保証への同意';
comment on column public.listing_applications.consent_antisocial_at is
  '反社会的勢力排除同意の日時';
comment on column public.listing_applications.shop_terms_version is
  '同意時の掲載店舗向け利用規約バージョン';

notify pgrst, 'reload schema';
