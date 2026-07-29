-- 掲載審査申請（listing_applications）
-- Supabase SQL Editor で実行してください。既存データは変更しません。

create extension if not exists "pgcrypto";

create table if not exists public.listing_applications (
  id uuid primary key default gen_random_uuid(),
  application_number text not null unique,
  status text not null default 'pending'
    check (status in (
      'pending',
      'reviewing',
      'needs_info',
      'approved',
      'rejected',
      'withdrawn'
    )),

  shop_name text not null,
  shop_address text not null,
  area text,
  business_type text not null,
  business_hours text not null,
  shop_phone text not null,

  contact_name text not null,
  contact_phone text not null,
  contact_email text not null,

  website_url text not null,
  instagram_url text not null,
  x_url text not null,
  tiktok_url text not null,
  line_official_url text not null,
  youtube_url text,
  other_sns text,

  business_license_info text not null,
  open_date date not null,

  requested_plan text not null
    check (requested_plan in ('light', 'standard', 'premium')),
  confirmed_plan text
    check (confirmed_plan is null or confirmed_plan in ('light', 'standard', 'premium')),

  listing_reason text not null,
  shop_features text not null,
  notes text,

  consent_accuracy boolean not null default false,
  consent_terms boolean not null default false,

  attachments jsonb not null default '[]'::jsonb,

  admin_memo text,
  assigned_admin text,
  rejection_reason text,
  needs_info_message text,
  needs_info_deadline date,
  needs_info_upload_token text,

  approved_at timestamptz,
  approved_by text,
  invite_code text unique,
  invite_expires_at timestamptz,
  linked_job_id uuid references public.jobs(id) on delete set null,
  onboarding_completed_at timestamptz,

  client_ip text,
  user_agent text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists listing_applications_status_idx
  on public.listing_applications (status);

create index if not exists listing_applications_created_at_idx
  on public.listing_applications (created_at desc);

create index if not exists listing_applications_contact_email_idx
  on public.listing_applications (lower(contact_email));

create index if not exists listing_applications_shop_name_idx
  on public.listing_applications (shop_name);

create index if not exists listing_applications_invite_code_idx
  on public.listing_applications (invite_code);

create table if not exists public.listing_application_events (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null
    references public.listing_applications(id) on delete cascade,
  event_type text not null,
  from_status text,
  to_status text,
  message text,
  actor text,
  created_at timestamptz not null default now()
);

create index if not exists listing_application_events_app_idx
  on public.listing_application_events (application_id, created_at desc);

drop trigger if exists listing_applications_set_updated_at on public.listing_applications;
create trigger listing_applications_set_updated_at
before update on public.listing_applications
for each row execute function public.set_updated_at();

alter table public.listing_applications enable row level security;
alter table public.listing_application_events enable row level security;

comment on table public.listing_applications is '店舗向け掲載審査申請（一般公開しない）';
comment on column public.listing_applications.status is 'pending/reviewing/needs_info/approved/rejected/withdrawn';
comment on column public.listing_applications.invite_code is '承認後の店舗登録用招待コード';

notify pgrst, 'reload schema';
