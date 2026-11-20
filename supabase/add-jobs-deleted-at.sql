-- 求人（店舗）の論理削除・復元用カラム
-- Supabase SQL Editor で実行してください（このファイルは自動実行しません）。
--
-- 目的:
--   管理者画面「求人管理」からの店舗削除を、物理削除ではなく論理削除で行う。
--   削除済み一覧表示と復元のため、削除前の公開状態も保持する。
--   関連データ（応募・閲覧・口コミ・請求・Stripe 等）は保持する。
--
-- 適用後の挙動:
--   deleted_at が NULL でない求人は、公開サイト・管理画面の通常一覧から除外される。
--   復元時は deleted_at を NULL に戻し、原則として掲載停止状態で戻す。

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS deleted_from_listing_status text
  CHECK (
    deleted_from_listing_status IS NULL
    OR deleted_from_listing_status IN ('draft', 'published', 'paused')
  );

CREATE INDEX IF NOT EXISTS jobs_deleted_at_idx
  ON public.jobs (deleted_at)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS jobs_deleted_at_desc_idx
  ON public.jobs (deleted_at DESC)
  WHERE deleted_at IS NOT NULL;

COMMENT ON COLUMN public.jobs.deleted_at IS
  '論理削除日時。NULL=有効、値あり=削除済み（公開・通常管理一覧の対象外）';

COMMENT ON COLUMN public.jobs.deleted_from_listing_status IS
  '論理削除直前の listing_status（復元時の参考表示用。復元後も自動公開はしない）';

NOTIFY pgrst, 'reload schema';
