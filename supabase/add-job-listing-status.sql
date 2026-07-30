-- 求人公開状態（draft / published / paused）
-- Supabase SQL Editor で実行してください。既存データは削除しません。

alter table public.jobs
  add column if not exists listing_status text;

-- 既存データ移行: published=true → published / false → draft
update public.jobs
set listing_status = case
  when published is true then 'published'
  else 'draft'
end
where listing_status is null
   or listing_status not in ('draft', 'published', 'paused');

alter table public.jobs
  alter column listing_status set default 'draft';

alter table public.jobs
  alter column listing_status set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'jobs_listing_status_check'
  ) then
    alter table public.jobs
      add constraint jobs_listing_status_check
      check (listing_status in ('draft', 'published', 'paused'));
  end if;
end $$;

-- 互換: published を listing_status と同期
update public.jobs
set published = (listing_status = 'published');

alter table public.jobs
  alter column published set default false;

create index if not exists jobs_listing_status_idx
  on public.jobs (listing_status);

comment on column public.jobs.listing_status is
  '求人公開状態: draft=下書き / published=公開中 / paused=掲載停止';
comment on column public.jobs.published is
  '互換フラグ。listing_status=published のとき true（一般公開フィルタ用）';

notify pgrst, 'reload schema';
