-- 新規ユーザー向け: 毎日PickUp通知のデフォルトを ON に変更
-- 既存ユーザーの notify_daily_pickup 値は変更しません（DEFAULT のみ変更）。

alter table public.user_notification_settings
  alter column notify_daily_pickup set default true;

comment on column public.user_notification_settings.notify_daily_pickup is
  '毎日20時のPickUpおすすめ配信。新規行の初期値は true。既存OFFは維持。';

notify pgrst, 'reload schema';
