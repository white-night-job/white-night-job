-- 女の子の口コミ：AI自動評価（rating は公開表示、ai_* は運営確認用）
-- Supabase SQL Editor で実行してください（このファイルは自動実行しません）。

alter table public.job_girl_reviews
  add column if not exists ai_rating smallint
    check (ai_rating is null or (ai_rating between 1 and 5));

alter table public.job_girl_reviews
  add column if not exists ai_rating_reason text;

comment on column public.job_girl_reviews.rating is
  '公開表示用の星評価（1〜5）。投稿時はAI判定、運営のみ手動修正可。';
comment on column public.job_girl_reviews.ai_rating is
  'AIが判定した星評価（運営が手動修正しても保持）。';
comment on column public.job_girl_reviews.ai_rating_reason is
  'AI判定理由（運営管理画面のみ表示。店舗・公開ページには出さない）。';

notify pgrst, 'reload schema';
