-- 掲載プラン（light / standard / premium）
-- 既存データは削除せず、カラム追加のみ。既存行は light 扱い（DEFAULT）。

alter table public.jobs
  add column if not exists plan text not null default 'light'
  check (plan in ('light', 'standard', 'premium'));

alter table public.jobs
  add column if not exists line_recommend_notify boolean not null default false;

alter table public.jobs
  add column if not exists new_listing_enabled boolean not null default true;

comment on column public.jobs.plan is '掲載プラン: light / standard / premium（表示順位等の基準）';
comment on column public.jobs.line_recommend_notify is 'LINEおすすめ通知（プラン連動、運営は手動変更可）';
comment on column public.jobs.new_listing_enabled is '新着掲載対象（プラン連動）';

notify pgrst, 'reload schema';
