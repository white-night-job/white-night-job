-- 採用担当者情報カラムを追加するSQL
-- Supabase SQL Editor で実行してください

alter table public.jobs
add column if not exists recruiter_name text;

alter table public.jobs
add column if not exists recruiter_title text;

alter table public.jobs
add column if not exists recruiter_image text;

alter table public.jobs
add column if not exists recruiter_message text;

comment on column public.jobs.recruiter_name is '採用担当者名';
comment on column public.jobs.recruiter_title is '採用担当者の役職';
comment on column public.jobs.recruiter_image is '採用担当者の顔写真URL';
comment on column public.jobs.recruiter_message is '採用担当からのメッセージ';

notify pgrst, 'reload schema';
