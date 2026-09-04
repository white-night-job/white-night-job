-- jobs: 求人詳細の条件・給与系カラム追加（既存データ非破壊・nullable）
-- Supabase SQL Editor で実行してください。
--
-- 既存の待遇（benefits）で表現できる項目はカラム追加しません:
--   日払いOK / 週1出勤OK / 終電上がりOK / 送迎あり / 未経験者大歓迎 /
--   Wワーク歓迎 / お酒飲めなくてもOK / ノルマなし / 衣装レンタルあり / 学生歓迎
-- 応募資格は既存 requirements、勤務時間は既存 work_hours を利用します。

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS regular_hourly_pay text;

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS trial_hourly_pay text;

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS back_pay_details text;

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS salary_payment_method text;

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS min_work_days text;

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS costume_uniform text;

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS trial_visit_available boolean;

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS trial_visit_notes text;

COMMENT ON COLUMN public.jobs.regular_hourly_pay IS '本入時給（表示用テキスト）';
COMMENT ON COLUMN public.jobs.trial_hourly_pay IS '体入時給（表示用テキスト）';
COMMENT ON COLUMN public.jobs.back_pay_details IS '各種バックの詳細';
COMMENT ON COLUMN public.jobs.salary_payment_method IS '給与支払方法';
COMMENT ON COLUMN public.jobs.min_work_days IS '最低勤務日数';
COMMENT ON COLUMN public.jobs.costume_uniform IS '衣装／制服の説明';
COMMENT ON COLUMN public.jobs.trial_visit_available IS '体験入店可否（null=未設定）';
COMMENT ON COLUMN public.jobs.trial_visit_notes IS '体験入店時の条件・注意事項';
