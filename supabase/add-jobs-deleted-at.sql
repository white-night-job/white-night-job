-- 求人（店舗）の論理削除用カラム
-- Supabase SQL Editor で実行してください（このファイルは自動実行しません）。
--
-- 目的:
--   管理者画面「求人管理」からの店舗削除を、物理削除ではなく論理削除で行う。
--   関連データ（応募・閲覧・口コミ・請求・Stripe 等）は保持する。
--
-- 適用後の挙動:
--   deleted_at が NULL でない求人は、公開サイト・管理画面の通常一覧から除外される。

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS jobs_deleted_at_idx
  ON public.jobs (deleted_at)
  WHERE deleted_at IS NULL;

COMMENT ON COLUMN public.jobs.deleted_at IS
  '論理削除日時。NULL=有効、値あり=削除済み（公開・通常管理一覧の対象外）';

NOTIFY pgrst, 'reload schema';
