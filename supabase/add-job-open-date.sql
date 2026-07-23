-- Shop open date for "新規オープン店舗" listing (6 months from open_date)
alter table public.jobs
  add column if not exists open_date date;

comment on column public.jobs.open_date is
  '店舗オープン日。未設定の店舗は新規オープン一覧に出さない。表示終了は open_date + 6か月で自動判定。';

create index if not exists jobs_open_date_idx
  on public.jobs (open_date desc)
  where open_date is not null and published = true;
