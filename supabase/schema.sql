-- White Night Job MVP schema
-- Supabase SQL Editor でこのまま実行してください。

create extension if not exists "pgcrypto";

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  shop_name text not null,
  area text not null default '札幌',
  district text not null check (district in ('すすきの', '琴似', '24条', '手稲')),
  job_type text not null check (job_type in ('ガールズバー', 'コンカフェ', 'ラウンジ', 'ニュークラ', 'クラブ', 'スナック')),
  title text not null,
  salary text not null,
  work_hours text not null default '20:00〜LAST',
  business_hours text,
  age_group text,
  customer_personality_level integer check (customer_personality_level between 1 and 5),
  customer_age_level integer check (customer_age_level between 1 and 5),
  customer_regular_level integer check (customer_regular_level between 1 and 5),
  introduction_text text,
  description_text text,
  description text,
  requirements text[] not null default array['20歳以上'],
  benefits text[] not null default array[]::text[],
  other_benefits text[] not null default array[]::text[],
  is_verified boolean not null default false,
  image_url text,
  phone text,
  address text,
  access text,
  x_url text,
  instagram_url text,
  tiktok_url text,
  youtube_url text,
  website_url text,
  line_url text not null,
  published boolean not null default true,
  posted_at date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.job_applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  type text not null check (type in ('line', 'phone')),
  created_at timestamptz not null default now()
);

create index if not exists job_applications_job_id_idx
  on public.job_applications (job_id);

create index if not exists job_applications_job_id_type_idx
  on public.job_applications (job_id, type);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  shop_name text not null,
  area text,
  category text not null,
  detail text not null,
  contact text,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists jobs_set_updated_at on public.jobs;
create trigger jobs_set_updated_at
before update on public.jobs
for each row execute function public.set_updated_at();

alter table public.jobs enable row level security;
alter table public.job_applications enable row level security;
alter table public.reports enable row level security;

-- このアプリはNext.js API Routeから service_role key で操作します。
-- service_role はRLSをバイパスするため、公開ポリシーは不要です。

insert into public.jobs (
  shop_name,
  area,
  district,
  job_type,
  title,
  salary,
  work_hours,
  business_hours,
  age_group,
  introduction_text,
  description_text,
  requirements,
  benefits,
  other_benefits,
  is_verified,
  image_url,
  phone,
  address,
  access,
  line_url,
  posted_at
) values
(
  'ニュークラブ ロゼッタ',
  '札幌',
  'すすきの',
  'ニュークラ',
  '未経験歓迎｜すすきのニュークラキャスト',
  '時給 4,000円〜',
  '20:00〜LAST',
  '20:00〜LAST',
  '20代前半〜30代前半',
  'すすきのエリアの人気ニュークラブ。北海道初出勤の方も歓迎。',
  'すすきのエリアの人気ニュークラブ。北海道初出勤の方も歓迎。ヘアメイク・ドレスは店内完備。',
  array['20歳以上', '週2日〜OK'],
  array['送迎あり', '衣装・美容サポート', 'ノルマなし'],
  array[]::text[],
  true,
  null,
  null,
  null,
  'すすきの駅から徒歩3分',
  'https://line.me/R/ti/p/@example-sapporo-rosetta',
  '2026-05-19'
),
(
  'ニュークラブ オーロラ',
  '札幌',
  'すすきの',
  'ニュークラ',
  '高時給｜ニュークラホールスタッフ兼キャスト',
  '時給 4,500円〜',
  '19:30〜LAST',
  '19:30〜LAST',
  '20代〜30代',
  '落ち着いた雰囲気の高級ニュークラブ。接客・ホールからスタート可能。',
  '落ち着いた雰囲気の高級ニュークラブ。接客・ホールからスタートしキャストデビューも可能。',
  array['20歳以上', '土金勤務できる方'],
  array['まかないあり', '交通費支給', '昇給あり'],
  array[]::text[],
  true,
  null,
  null,
  null,
  'すすきの駅から徒歩5分',
  'https://line.me/R/ti/p/@example-sapporo-aurora',
  '2026-05-18'
),
(
  'Club BLANC 札幌',
  '札幌',
  'すすきの',
  'ニュークラ',
  '週1〜OK｜札幌ニュークラ体験入店歓迎',
  '日給 12,000円〜',
  '21:00〜01:00',
  '21:00〜01:00',
  '20代中心',
  '学生・Wワーク歓迎。体験入店1日から可能。',
  '学生・Wワーク歓迎。体験入店1日から可能。シフトは自由に相談できます。',
  array['20歳以上', '週1日〜OK'],
  array['体験入店OK', '週払い可', '私服出勤相談可'],
  array[]::text[],
  false,
  null,
  null,
  null,
  'すすきの駅から徒歩4分',
  'https://line.me/R/ti/p/@example-sapporo-blanc',
  '2026-05-17'
)
on conflict do nothing;
