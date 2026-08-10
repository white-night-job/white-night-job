-- subscriptions: プラン変更予約（次回更新日から適用）用カラム
-- Supabase SQL Editor で実行してください（このファイルは自動実行しません）。

alter table public.subscriptions
  add column if not exists pending_stripe_price_id text;

alter table public.subscriptions
  add column if not exists pending_change_at timestamptz;

alter table public.subscriptions
  add column if not exists stripe_schedule_id text;

comment on column public.subscriptions.pending_stripe_price_id is
  '次回更新日に切り替わる予定の Stripe Price ID（Subscription Schedule）';
comment on column public.subscriptions.pending_change_at is
  'プラン変更の適用予定日時（通常は current_period_end）';
comment on column public.subscriptions.stripe_schedule_id is
  '紐づく Stripe Subscription Schedule ID';

notify pgrst, 'reload schema';
