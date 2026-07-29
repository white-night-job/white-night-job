-- 掲載審査の提出書類（非公開Storage）
-- Supabase SQL Editor で実行してください

insert into storage.buckets (id, name, public)
select 'listing-application-documents', 'listing-application-documents', false
where not exists (
  select 1 from storage.buckets where id = 'listing-application-documents'
);

alter table public.listing_applications
  add column if not exists business_license_document jsonb,
  add column if not exists entertainment_license_document jsonb,
  add column if not exists late_night_alcohol_notification_document jsonb;

comment on column public.listing_applications.business_license_document is '営業許可証（必須）';
comment on column public.listing_applications.entertainment_license_document is '風俗営業許可証（任意）';
comment on column public.listing_applications.late_night_alcohol_notification_document is '深夜酒類提供飲食店営業・開始届出（任意）';

notify pgrst, 'reload schema';
