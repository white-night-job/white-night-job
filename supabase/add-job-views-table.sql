-- 求人詳細ページの表示回数テーブル
-- Supabase SQL Editorで1回だけ実行してください。
-- 既存データの削除・初期化は行いません。

create table if not exists public.job_views (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  created_at timestamptz not null default now(),
  user_agent text,
  referrer text
);

create index if not exists job_views_job_id_idx
  on public.job_views (job_id);

create index if not exists job_views_job_id_created_at_idx
  on public.job_views (job_id, created_at desc);

alter table public.job_views enable row level security;

-- このアプリは Next.js API Route から service_role key で insert/select します。
-- service_role は RLS をバイパスするため、追加ポリシーは不要です。

grant usage on schema public to postgres, anon, authenticated, service_role;
grant select, insert on table public.job_views to service_role;

-- テーブル作成直後に PostgREST のスキーマキャッシュを更新
notify pgrst, 'reload schema';
