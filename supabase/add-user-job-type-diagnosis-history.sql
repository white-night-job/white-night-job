-- 職種診断：ユーザーごとに最大5件の履歴を保存できるよう変更
-- Supabase SQL Editor で実行してください。

alter table public.user_job_type_diagnoses
  drop constraint if exists user_job_type_diagnoses_user_id_key;

alter table public.user_job_type_diagnoses
  add column if not exists result_signature text;

create index if not exists user_job_type_diagnoses_user_diagnosed_idx
  on public.user_job_type_diagnoses(user_id, diagnosed_at desc);
