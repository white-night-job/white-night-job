-- jobs テーブルに店長から一言を追加
alter table public.jobs
  add column if not exists manager_comment text;
