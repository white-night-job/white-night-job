-- 女の子の口コミ（job_girl_reviews）
-- Supabase SQL Editor で実行してください（このファイルは自動実行しません）。
-- 既存の jobs.cast_voices / cast_voice は削除しません。

create table if not exists public.job_girl_reviews (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete cascade,
  category text not null
    check (category in ('interview', 'cast')),
  rating smallint not null
    check (rating between 1 and 5),
  nickname text not null,
  age integer not null
    check (age >= 18),
  comment text not null
    check (char_length(comment) >= 20 and char_length(comment) <= 500),
  migrated_from_cast_voice boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists job_girl_reviews_job_id_created_at_idx
  on public.job_girl_reviews (job_id, created_at desc);

create index if not exists job_girl_reviews_job_id_category_created_at_idx
  on public.job_girl_reviews (job_id, category, created_at desc);

comment on table public.job_girl_reviews is
  '女の子の口コミ（面接・体験入店 / 在籍キャスト）。店舗ダッシュボードから登録・編集・削除。';
comment on column public.job_girl_reviews.category is
  'interview=面接・体験入店 / cast=在籍キャスト';
comment on column public.job_girl_reviews.migrated_from_cast_voice is
  'jobs.cast_voices から移行したデータかどうか';

-- 公開読み取り（匿名閲覧可）
alter table public.job_girl_reviews enable row level security;

drop policy if exists "job_girl_reviews_public_read" on public.job_girl_reviews;
create policy "job_girl_reviews_public_read"
  on public.job_girl_reviews
  for select
  to anon, authenticated
  using (true);

-- 書き込みはサービスロール（API / supabaseAdmin）経由のみ想定

-- 既存 cast_voices → job_girl_reviews へ移行（未移行分のみ）
-- 重複防止: 同じ job_id + nickname + age + comment が既にあればスキップ
insert into public.job_girl_reviews (
  job_id,
  category,
  rating,
  nickname,
  age,
  comment,
  migrated_from_cast_voice,
  created_at,
  updated_at
)
select
  j.id as job_id,
  'cast'::text as category,
  5::smallint as rating,
  coalesce(nullif(trim(voice->>'name'), ''), '匿名') as nickname,
  case
    when (voice->>'age') ~ '^[0-9]{2}$'
      and (voice->>'age')::int >= 18
      then (voice->>'age')::int
    when (voice->>'age') ~ '^[0-9]{2}'
      and substring(voice->>'age' from '^[0-9]{2}')::int >= 18
      then substring(voice->>'age' from '^[0-9]{2}')::int
    else 20
  end as age,
  left(
    case
      when char_length(trim(coalesce(voice->>'comment', ''))) >= 20
        then trim(voice->>'comment')
      when char_length(trim(coalesce(voice->>'comment', ''))) > 0
        then trim(voice->>'comment') || '（移行データ）店舗の雰囲気や働きやすさについての口コミです。'
      else '（移行データ）店舗の雰囲気や働きやすさについての口コミです。詳細は店舗へご確認ください。'
    end,
    500
  ) as comment,
  true as migrated_from_cast_voice,
  coalesce(j.posted_at, now()) as created_at,
  now() as updated_at
from public.jobs j
cross join lateral jsonb_array_elements(
  case
    when jsonb_typeof(j.cast_voices) = 'array' then j.cast_voices
    else '[]'::jsonb
  end
) as voice
where coalesce(nullif(trim(voice->>'comment'), ''), nullif(trim(voice->>'name'), '')) is not null
  and not exists (
    select 1
    from public.job_girl_reviews r
    where r.job_id = j.id
      and r.migrated_from_cast_voice = true
      and r.nickname = coalesce(nullif(trim(voice->>'name'), ''), '匿名')
      and r.comment like left(trim(coalesce(voice->>'comment', '')), 40) || '%'
  );

notify pgrst, 'reload schema';
