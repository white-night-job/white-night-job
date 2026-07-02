-- jobs テーブル: コードで使用している chat_recommend_* / pickup_enabled カラムを追加
-- Supabase SQL Editor でこのまま実行してください。
--
-- コード参照:
--   src/lib/chat-recommend-db.ts
--   src/lib/job-db.ts
--   src/app/admin/page.tsx
--   src/lib/shop-job-db.ts
--
-- chat_recommend_* カラム一覧（コードとDBで統一）:
--   chat_recommend_enabled        boolean  おすすめON/OFF（default true）
--   chat_recommend_priority       integer  おすすめ優先順位（default 0）
--   chat_recommend_comment        text     おすすめコメント
--   chat_recommend_beginner       boolean  未経験向けタグ
--   chat_recommend_no_alcohol_ok  boolean  お酒NG可タグ
--   chat_recommend_shuttle        boolean  送迎ありタグ
--   chat_recommend_privacy        boolean  身バレ配慮ありタグ
--   chat_recommend_high_salary    boolean  高時給推しタグ
--   chat_recommend_relaxed        boolean  ゆるく働けるタグ
--   chat_recommend_high_earning   boolean  しっかり稼げるタグ
--
-- その他:
--   pickup_enabled                boolean  ピックアップ掲載（default false）

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS chat_recommend_enabled boolean NOT NULL DEFAULT true;

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS chat_recommend_priority integer NOT NULL DEFAULT 0;

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS chat_recommend_comment text;

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS chat_recommend_beginner boolean NOT NULL DEFAULT false;

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS chat_recommend_no_alcohol_ok boolean NOT NULL DEFAULT false;

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS chat_recommend_shuttle boolean NOT NULL DEFAULT false;

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS chat_recommend_privacy boolean NOT NULL DEFAULT false;

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS chat_recommend_high_salary boolean NOT NULL DEFAULT false;

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS chat_recommend_relaxed boolean NOT NULL DEFAULT false;

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS chat_recommend_high_earning boolean NOT NULL DEFAULT false;

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS pickup_enabled boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS jobs_pickup_enabled_idx
  ON public.jobs (pickup_enabled)
  WHERE pickup_enabled = true;
