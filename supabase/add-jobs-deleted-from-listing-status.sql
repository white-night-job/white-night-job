-- 論理削除直前の公開状態を保存するカラム（add-jobs-deleted-at.sql 適用済み環境向け）
-- Supabase SQL Editor で実行してください。

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS deleted_from_listing_status text
  CHECK (
    deleted_from_listing_status IS NULL
    OR deleted_from_listing_status IN ('draft', 'published', 'paused')
  );

CREATE INDEX IF NOT EXISTS jobs_deleted_at_desc_idx
  ON public.jobs (deleted_at DESC)
  WHERE deleted_at IS NOT NULL;

COMMENT ON COLUMN public.jobs.deleted_from_listing_status IS
  '論理削除直前の listing_status（復元時の参考表示用。復元後も自動公開はしない）';

NOTIFY pgrst, 'reload schema';
