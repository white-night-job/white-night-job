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
  description text not null,
  requirements text[] not null default array['20歳以上'],
  benefits text[] not null default array[]::text[],
  is_verified boolean not null default false,
  image_url text,
  line_url text not null,
  published boolean not null default true,
  posted_at date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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
  description,
  requirements,
  benefits,
  is_verified,
  image_url,
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
  'すすきのエリアの人気ニュークラブ。北海道初出勤の方も歓迎。ヘアメイク・ドレスは店内完備。',
  array['20歳以上', '週2日〜OK'],
  array['送迎あり', '衣装・美容サポート', 'ノルマなし'],
  true,
  null,
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
  '落ち着いた雰囲気の高級ニュークラブ。接客・ホールからスタートしキャストデビューも可能。',
  array['20歳以上', '土金勤務できる方'],
  array['まかないあり', '交通費支給', '昇給あり'],
  true,
  null,
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
  '学生・Wワーク歓迎。体験入店1日から可能。シフトは自由に相談できます。',
  array['20歳以上', '週1日〜OK'],
  array['体験入店OK', '週払い可', '私服出勤相談可'],
  false,
  null,
  'https://line.me/R/ti/p/@example-sapporo-blanc',
  '2026-05-17'
)
on conflict do nothing;
