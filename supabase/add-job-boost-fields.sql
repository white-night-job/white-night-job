-- Optional denormalized boost fields on jobs (shop boost never changes listing_priority)
-- Source of truth for daily limits remains public.shop_boosts

alter table public.jobs
  add column if not exists boost_count integer not null default 0;

alter table public.jobs
  add column if not exists last_boost_at timestamptz;

comment on column public.jobs.boost_count is '本日の上位表示回数（shop_boosts と同期。表示順位 listing_priority とは別）';
comment on column public.jobs.last_boost_at is '最後に上位表示した日時';

notify pgrst, 'reload schema';
