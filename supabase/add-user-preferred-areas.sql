-- マイページ「希望エリア」設定
-- Supabase SQL Editor で実行してください（このファイルは自動実行しません）。
-- 既存の user_notification_areas（LINE通知の地域）は変更しません。
-- null = 未設定（全エリア対象で表示）

alter table public.users
  add column if not exists preferred_areas text[];

alter table public.users
  drop constraint if exists users_preferred_areas_check;

alter table public.users
  add constraint users_preferred_areas_check
  check (
    preferred_areas is null
    or preferred_areas <@ array['すすきの', '琴似', '24条', '手稲']::text[]
  );

comment on column public.users.preferred_areas is
  'マイページの希望エリア（複数可）。診断のおすすめ求人・新着/PICK UP/新規オープン店舗の表示絞り込みに使用。null は未設定';

notify pgrst, 'reload schema';
