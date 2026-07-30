-- 掲載審査: 本人確認・法人確認
-- Supabase SQL Editor で実行してください。既存データは削除しません。

-- 1) 非公開 Storage bucket（身分証明書専用）
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
select
  'listing-application-identity',
  'listing-application-identity',
  false,
  10485760,
  array[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/pdf'
  ]::text[]
where not exists (
  select 1 from storage.buckets where id = 'listing-application-identity'
);

-- 公開ポリシーは付けない（service_role のみアクセス想定）
-- 既存ポリシーがあれば削除して一般公開を防ぐ
do $$
begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'listing_identity_public_read'
  ) then
    drop policy listing_identity_public_read on storage.objects;
  end if;
end $$;

-- 2) listing_applications カラム追加
alter table public.listing_applications
  add column if not exists applicant_type text,
  add column if not exists corporate_name text,
  add column if not exists corporate_name_kana text,
  add column if not exists corporate_number text,
  add column if not exists representative_name text,
  add column if not exists identity_document_front jsonb,
  add column if not exists identity_document_back jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'listing_applications_applicant_type_check'
  ) then
    alter table public.listing_applications
      add constraint listing_applications_applicant_type_check
      check (
        applicant_type is null
        or applicant_type in ('individual', 'corporation')
      );
  end if;
end $$;

comment on column public.listing_applications.applicant_type is
  '申請者区分: individual=個人事業主 / corporation=法人';
comment on column public.listing_applications.corporate_name is
  '法人名（法人の場合）';
comment on column public.listing_applications.corporate_name_kana is
  '法人名フリガナ（法人の場合）';
comment on column public.listing_applications.corporate_number is
  '法人番号13桁（法人の場合）';
comment on column public.listing_applications.representative_name is
  '代表者名（法人の場合）';
comment on column public.listing_applications.identity_document_front is
  '顔写真付き身分証明書（表面）非公開Storageパス';
comment on column public.listing_applications.identity_document_back is
  '顔写真付き身分証明書（裏面・任意）非公開Storageパス';

notify pgrst, 'reload schema';
