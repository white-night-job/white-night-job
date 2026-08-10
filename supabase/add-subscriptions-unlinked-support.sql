-- subscriptions: Payment Link 未紐付け契約の保存を許可
-- Supabase SQL Editor で実行してください（このファイルは自動実行しません）。
-- 既存カラムは削除しません。

-- store_id を nullable に（未紐付け契約用）。UNIQUE は維持（PostgreSQL では NULL は複数可）
alter table public.subscriptions
  alter column store_id drop not null;

alter table public.subscriptions
  add column if not exists customer_email text;

create index if not exists subscriptions_customer_email_idx
  on public.subscriptions (lower(customer_email))
  where customer_email is not null;

-- stripe_subscription_id は作成時から UNIQUE。念のため一意インデックスを確保
create unique index if not exists subscriptions_stripe_subscription_id_uidx
  on public.subscriptions (stripe_subscription_id)
  where stripe_subscription_id is not null;

comment on column public.subscriptions.store_id is
  '店舗（jobs.id）。Payment Link 等で店舗未特定の場合は null（未紐付け契約）';
comment on column public.subscriptions.customer_email is
  'Stripe 顧客メール。管理画面表示・メール一致フォールバック用';

notify pgrst, 'reload schema';
