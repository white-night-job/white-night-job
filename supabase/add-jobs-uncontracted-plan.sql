-- Allow uncontracted (store-info-only) plan on jobs.plan
-- Does NOT change subscriptions.plan (Stripe paid plans only).
-- Existing light/standard/premium rows are unchanged.

alter table public.jobs drop constraint if exists jobs_plan_check;

alter table public.jobs
  add constraint jobs_plan_check
  check (plan in ('uncontracted', 'light', 'standard', 'premium'));

comment on column public.jobs.plan is
  '掲載プラン: uncontracted(店舗情報のみ) / light / standard / premium';

notify pgrst, 'reload schema';
