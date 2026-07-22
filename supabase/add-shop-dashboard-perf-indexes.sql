-- Performance indexes for shop dashboard / analytics / login
-- Run in Supabase SQL Editor.

-- Shop login lookup
create index if not exists jobs_shop_login_id_idx
  on public.jobs (shop_login_id)
  where shop_login_id is not null and length(trim(shop_login_id)) > 0;

-- District ranking for published shops
create index if not exists jobs_published_district_idx
  on public.jobs (published, district);

-- Application counts / monthly charts scoped by shop
create index if not exists job_applications_job_id_created_at_idx
  on public.job_applications (job_id, created_at desc);

-- View counts scoped by shop
create index if not exists job_views_job_id_created_at_idx
  on public.job_views (job_id, created_at desc);

-- Analytics events: filter internal + range by shop
create index if not exists job_analytics_events_job_internal_created_idx
  on public.job_analytics_events (job_id, is_internal, created_at desc);
