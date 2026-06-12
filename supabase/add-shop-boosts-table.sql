-- 店舗の上位表示ブースト履歴テーブル
-- Supabase SQL Editor で実行してください

create table if not exists public.shop_boosts (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  boosted_at timestamptz not null default now()
);

create index if not exists shop_boosts_job_id_boosted_at_idx
  on public.shop_boosts (job_id, boosted_at desc);

create index if not exists shop_boosts_boosted_at_idx
  on public.shop_boosts (boosted_at desc);

comment on table public.shop_boosts is '店舗の上位表示ブースト履歴（1日5回まで）';

notify pgrst, 'reload schema';
