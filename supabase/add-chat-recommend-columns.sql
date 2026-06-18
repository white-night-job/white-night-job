-- チャットボットおすすめ店舗用カラム（jobs テーブルに追加）
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS chat_recommend_enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS chat_recommend_priority integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS chat_recommend_comment text,
  ADD COLUMN IF NOT EXISTS chat_recommend_beginner boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS chat_recommend_no_alcohol_ok boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS chat_recommend_shuttle boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS chat_recommend_privacy boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS chat_recommend_high_salary boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS chat_recommend_relaxed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS chat_recommend_high_earning boolean DEFAULT false;
