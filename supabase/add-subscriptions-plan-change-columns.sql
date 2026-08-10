-- =============================================================================
-- subscriptions: プラン変更予約 + 未紐付け契約 に必要なカラムを一括追加
-- =============================================================================
-- Supabase SQL Editor でこのファイルだけ実行してください。
--
-- 安全方針:
--   - 既存行の DELETE / TRUNCATE / 初期化は行いません
--   - 既存カラムの削除・型破壊的変更は行いません
--   - ADD COLUMN IF NOT EXISTS / 制約な DROP NOT NULL / インデックス追加のみ
--
-- コードが参照するカラム（src/lib/subscriptions.ts の upsert / map）:
--   【既存想定】
--     id, store_id, stripe_customer_id, stripe_subscription_id, stripe_price_id,
--     plan, status, payment_status, payment_failed_count,
--     current_period_start, current_period_end, cancel_at_period_end, canceled_at,
--     created_at, updated_at
--   【今回追加対象】
--     customer_email              … 顧客メール（管理画面・紐付けフォールバック）
--     pending_stripe_price_id     … 変更予定の Stripe Price ID（変更予定プラン表示に使用）
--     pending_change_at           … 適用予定日時（当初の次回更新日）
--     stripe_schedule_id          … Stripe Subscription Schedule ID
--
-- 補足:
--   pending_billing_key / pending_plan カラムは DB には持ちません。
--   変更予定プラン名は pending_stripe_price_id からアプリ側で解決します。
-- =============================================================================

-- 1) 未紐付け契約: store_id を nullable に（既存 UNIQUE は維持。NULL は複数可）
alter table public.subscriptions
  alter column store_id drop not null;

-- 2) 顧客メール
alter table public.subscriptions
  add column if not exists customer_email text;

-- 3) プラン変更予約: 変更予定 Price ID
alter table public.subscriptions
  add column if not exists pending_stripe_price_id text;

-- 4) プラン変更予約: 適用予定日時
alter table public.subscriptions
  add column if not exists pending_change_at timestamptz;

-- 5) プラン変更予約: Stripe Schedule ID
alter table public.subscriptions
  add column if not exists stripe_schedule_id text;

-- インデックス（存在すればスキップ）
create index if not exists subscriptions_customer_email_idx
  on public.subscriptions (lower(customer_email))
  where customer_email is not null;

create index if not exists subscriptions_pending_change_at_idx
  on public.subscriptions (pending_change_at)
  where pending_change_at is not null;

create index if not exists subscriptions_stripe_schedule_id_idx
  on public.subscriptions (stripe_schedule_id)
  where stripe_schedule_id is not null;

create unique index if not exists subscriptions_stripe_subscription_id_uidx
  on public.subscriptions (stripe_subscription_id)
  where stripe_subscription_id is not null;

-- コメント
comment on column public.subscriptions.store_id is
  '店舗（jobs.id）。Payment Link 等で店舗未特定の場合は null（未紐付け契約）';
comment on column public.subscriptions.customer_email is
  'Stripe 顧客メール。管理画面表示・メール一致フォールバック用';
comment on column public.subscriptions.pending_stripe_price_id is
  '次回更新日に切り替わる予定の Stripe Price ID。変更予定プラン表示に使用';
comment on column public.subscriptions.pending_change_at is
  'プラン変更の適用予定日時（通常は当初の current_period_end）';
comment on column public.subscriptions.stripe_schedule_id is
  '紐づく Stripe Subscription Schedule ID';

-- PostgREST スキーマキャッシュ再読込（PGRST204 解消）
notify pgrst, 'reload schema';
