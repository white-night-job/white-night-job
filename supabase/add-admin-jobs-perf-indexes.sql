-- Admin job management performance indexes
-- Safe to re-run (IF NOT EXISTS). Do not duplicate existing indexes.

-- Shop search by name
create index if not exists jobs_shop_name_idx
  on public.jobs (shop_name);

-- Area / district filter (jobs_published_district_idx already covers published+district)
create index if not exists jobs_district_idx
  on public.jobs (district);

-- Published filter (also covered partly by jobs_published_district_idx)
create index if not exists jobs_published_idx
  on public.jobs (published);

-- Monthly view / application range counts
create index if not exists job_views_created_at_idx
  on public.job_views (created_at desc);

create index if not exists job_applications_created_at_idx
  on public.job_applications (created_at desc);

-- Analytics / access events
-- event_type: already indexed via job_analytics_events_type_created_idx
create index if not exists job_analytics_events_created_at_idx
  on public.job_analytics_events (created_at desc);

create index if not exists job_analytics_events_shop_id_idx
  on public.job_analytics_events (shop_id)
  where shop_id is not null;

-- LINE notification history (tables use sent_at; batches already have sent_at idx)
create index if not exists line_notification_logs_sent_at_idx
  on public.line_notification_logs (sent_at desc);
