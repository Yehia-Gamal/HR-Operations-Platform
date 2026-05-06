-- =========================================================
-- HR Ahla Shabab Production SQL Editor FINAL V28
-- Ù…Ù„Ù ÙˆØ§Ø­Ø¯ ÙÙ‚Ø· Ù„Ù„ØªØ´ØºÙŠÙ„ Ù…Ù† Supabase SQL Editor.
-- ÙŠØ¯Ù…Ø¬ 001..079 Ù„ØªÙ‚Ù„ÙŠÙ„ Ø§Ù„ØªØ´ØªØª ÙˆØ¥Ù„ØºØ§Ø¡ ØªØ´ØºÙŠÙ„ Hotfix ÙÙˆÙ‚ Hotfix.
-- Safe/idempotent where possible: create if not exists / add column if not exists / create or replace.
-- Ø¨Ø¹Ø¯ Ø§Ù„ØªØ´ØºÙŠÙ„ Ø´ØºÙ‘Ù„ VERIFY_AFTER_SUPABASE_DEPLOY.sql Ù„Ù„ØªØ£ÙƒØ¯.
-- =========================================================



-- =========================================================
-- BEGIN SECTION: 001-043 Base schema + patches
-- SOURCE: supabase/sql/PRODUCTION_SQL_EDITOR_ALL_PATCHES_001_TO_043.sql
-- =========================================================

-- HR Supabase Web Management HR Reports - Production SQL Editor bundle
-- Includes base schema 001 and patches 002 through 043 in order.
-- Generated locally; contains no service role key, VAPID private key, or Supabase access token.
-- Run the whole file once in Supabase Dashboard > SQL Editor, then run VERIFY_AFTER_SUPABASE_DEPLOY.sql.


-- =========================================================
-- BEGIN PATCH: 001_schema_rls_seed.sql
-- =========================================================

-- =========================================================
-- HR Attendance Supabase Backend
-- Ø¬Ù…Ø¹ÙŠØ© Ø®ÙˆØ§Ø·Ø± Ø£Ø­Ù„Ù‰ Ø´Ø¨Ø§Ø¨ Ø§Ù„Ø®ÙŠØ±ÙŠØ©
-- Vanilla Web + Supabase Auth + Postgres + Storage + Realtime
-- Ø´ØºÙ‘Ù„ Ù‡Ø°Ø§ Ø§Ù„Ù…Ù„Ù Ù…Ø±Ø© ÙˆØ§Ø­Ø¯Ø© Ø¯Ø§Ø®Ù„ Supabase SQL Editor.
-- =========================================================

create extension if not exists pgcrypto;

-- =========================
-- 1) Core lookup tables
-- =========================
create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),
  scope text unique not null,
  name text not null,
  description text default '',
  created_at timestamptz not null default now()
);

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  key text,
  name text not null,
  permissions text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.governorates (
  id uuid primary key default gen_random_uuid(),
  code text unique,
  name text not null,
  active boolean not null default true,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.complexes (
  id uuid primary key default gen_random_uuid(),
  code text unique,
  name text not null,
  governorate_id uuid references public.governorates(id),
  active boolean not null default true,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  code text unique,
  name text not null,
  address text default '',
  governorate_id uuid references public.governorates(id),
  complex_id uuid references public.complexes(id),
  latitude numeric(18,15),
  longitude numeric(18,15),
  geofence_radius_meters integer not null default 200,
  max_accuracy_meters integer not null default 300,
  timezone text not null default 'Africa/Cairo',
  active boolean not null default true,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  code text unique,
  name text not null,
  branch_id uuid references public.branches(id),
  active boolean not null default true,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shifts (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references public.branches(id),
  name text not null,
  start_time text not null default '09:00',
  end_time text not null default '17:00',
  grace_minutes integer not null default 15,
  late_after_minutes integer not null default 15,
  half_day_after_minutes integer not null default 240,
  days_mask text not null default 'SAT,SUN,MON,TUE,WED,THU',
  is_night_shift boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================
-- 2) People and profiles
-- =========================
create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  employee_code text unique,
  full_name text not null,
  phone text,
  email text,
  photo_url text default '',
  job_title text default '',
  role_id uuid references public.roles(id),
  branch_id uuid references public.branches(id),
  department_id uuid references public.departments(id),
  governorate_id uuid references public.governorates(id),
  complex_id uuid references public.complexes(id),
  manager_employee_id uuid references public.employees(id),
  shift_id uuid references public.shifts(id),
  status text not null default 'ACTIVE',
  is_active boolean not null default true,
  is_deleted boolean not null default false,
  hire_date date,
  user_id uuid references auth.users(id) on delete set null,
  last_location_latitude numeric(18,15),
  last_location_longitude numeric(18,15),
  last_location_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Security hardening for existing databases that previously ran older schema versions
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='branches' and column_name='radius_meters') then
    alter table public.branches drop column radius_meters;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'employees_user_id_fkey') then
    alter table public.employees add constraint employees_user_id_fkey foreign key (user_id) references auth.users(id) on delete set null;
  end if;
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='profiles') and not exists (select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='avatar_url') then
    alter table public.profiles add column avatar_url text default '';
  end if;
exception when duplicate_object then null;
end $$;

create index if not exists employees_email_idx on public.employees (lower(email));
create index if not exists employees_phone_idx on public.employees (phone);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  employee_id uuid references public.employees(id),
  email text unique not null,
  phone text,
  full_name text not null default '',
  avatar_url text default '',
  role_id uuid references public.roles(id),
  branch_id uuid references public.branches(id),
  department_id uuid references public.departments(id),
  governorate_id uuid references public.governorates(id),
  complex_id uuid references public.complexes(id),
  status text not null default 'ACTIVE',
  temporary_password boolean not null default true,
  must_change_password boolean not null default true,
  passkey_enabled boolean not null default false,
  failed_logins integer not null default 0,
  locked_until timestamptz,
  last_login_at timestamptz,
  last_seen_at timestamptz,
  password_changed_at timestamptz,
  last_ip text,
  last_user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================
-- 3) Attendance, requests, KPI
-- =========================
create table if not exists public.attendance_events (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  user_id uuid references auth.users(id),
  type text not null,
  status text default '',
  event_at timestamptz not null default now(),
  latitude numeric(18,15),
  longitude numeric(18,15),
  accuracy_meters numeric(10,2),
  geofence_status text not null default 'unknown',
  distance_from_branch_meters integer,
  branch_id uuid references public.branches(id),
  verification_status text default 'verified',
  biometric_method text default 'passkey',
  passkey_credential_id text,
  passkey_verified_at timestamptz,
  selfie_url text default '',
  notes text default '',
  late_minutes integer not null default 0,
  requires_review boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.attendance_daily (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  date date not null,
  status text not null default 'ABSENT',
  first_check_in_at timestamptz,
  last_check_out_at timestamptz,
  late_minutes integer not null default 0,
  work_minutes integer not null default 0,
  requires_review boolean not null default false,
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(employee_id, date)
);

create table if not exists public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  type text default 'ANNUAL',
  start_date date not null,
  end_date date not null,
  reason text default '',
  status text not null default 'PENDING',
  manager_employee_id uuid references public.employees(id),
  decided_by uuid references auth.users(id),
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.missions (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  title text not null default 'Ù…Ø£Ù…ÙˆØ±ÙŠØ©',
  destination text default '',
  planned_start timestamptz,
  planned_end timestamptz,
  status text not null default 'PENDING',
  notes text default '',
  manager_employee_id uuid references public.employees(id),
  decided_by uuid references auth.users(id),
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.attendance_exceptions (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  date date not null default current_date,
  type text not null default 'ADJUSTMENT',
  reason text default '',
  status text not null default 'PENDING',
  created_by uuid references auth.users(id),
  decided_by uuid references auth.users(id),
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.location_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  purpose text default '',
  request_reason text default '',
  status text not null default 'PENDING',
  requested_by uuid references auth.users(id),
  decided_by uuid references auth.users(id),
  requested_at timestamptz not null default now(),
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.employee_locations (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  latitude numeric(18,15),
  longitude numeric(18,15),
  accuracy_meters numeric(10,2),
  source text default 'manual',
  attendance_event_id uuid references public.attendance_events(id),
  created_at timestamptz not null default now()
);

create table if not exists public.kpi_evaluations (
  id uuid primary key default gen_random_uuid(),
  cycle_id text not null default to_char(now(), 'YYYY-MM'),
  employee_id uuid not null references public.employees(id) on delete cascade,
  manager_employee_id uuid references public.employees(id),
  evaluation_date date not null default current_date,
  meeting_held boolean not null default false,
  status text not null default 'DRAFT',
  target_score numeric(5,2) not null default 0,
  efficiency_score numeric(5,2) not null default 0,
  attendance_score numeric(5,2) not null default 0,
  conduct_score numeric(5,2) not null default 0,
  prayer_score numeric(5,2) not null default 0,
  quran_circle_score numeric(5,2) not null default 0,
  initiatives_score numeric(5,2) not null default 0,
  total_score numeric(5,2) generated always as (target_score + efficiency_score + attendance_score + conduct_score + prayer_score + quran_circle_score + initiatives_score) stored,
  grade text,
  rating text,
  employee_notes text default '',
  manager_notes text default '',
  submitted_at timestamptz,
  approved_at timestamptz,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(cycle_id, employee_id)
);

create table if not exists public.dispute_cases (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text default '',
  employee_id uuid references public.employees(id),
  status text not null default 'OPEN',
  severity text default 'MEDIUM',
  committee_decision text default '',
  escalated_to_executive boolean not null default false,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================
-- 4) System tables
-- =========================
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  employee_id uuid references public.employees(id),
  title text not null,
  body text default '',
  type text default 'INFO',
  status text not null default 'UNREAD',
  is_read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  actor text default '',
  actor_user_id uuid references auth.users(id),
  before_data jsonb,
  after_data jsonb,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  scope text not null default 'EMPLOYEE',
  entity_id uuid,
  employee_id uuid references public.employees(id),
  file_name text default '',
  original_name text default '',
  mime_type text default '',
  size_bytes bigint default 0,
  bucket_id text default '',
  storage_path text default '',
  url text not null default '',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.passkey_credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text default 'Passkey',
  credential_id text not null,
  public_key text,
  counter bigint not null default 0,
  transports text[],
  platform text default '',
  browser_supported boolean not null default true,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  unique(user_id, credential_id)
);

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  endpoint text not null,
  payload jsonb not null default '{}',
  permission text default '',
  created_at timestamptz not null default now(),
  unique(endpoint)
);

create table if not exists public.integration_settings (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  name text not null,
  provider text default 'custom',
  enabled boolean not null default false,
  status text default 'CONFIGURED',
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.login_identifier_attempts (
  id uuid primary key default gen_random_uuid(),
  ip_hash text not null,
  identifier_hash text not null,
  attempts integer not null default 1,
  blocked_until timestamptz,
  last_attempt_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(ip_hash, identifier_hash)
);

create table if not exists public.payroll_exports (
  id uuid primary key default gen_random_uuid(),
  provider text default 'manual-csv',
  status text default 'READY',
  from_date date,
  to_date date,
  payload jsonb not null default '{}',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.access_control_events (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references public.employees(id),
  device_id text default 'main-gate',
  direction text default 'ENTRY',
  decision text default 'ALLOW',
  reason text default '',
  created_at timestamptz not null default now()
);

-- =========================
-- 5) Indexes
-- =========================
create index if not exists idx_employees_email on public.employees(lower(email));
create index if not exists idx_employees_phone on public.employees(phone);
create index if not exists idx_employees_manager on public.employees(manager_employee_id);
create index if not exists idx_profiles_employee on public.profiles(employee_id);
create index if not exists idx_profiles_phone on public.profiles(phone);
create index if not exists idx_attendance_events_employee_at on public.attendance_events(employee_id, event_at desc);
create index if not exists idx_attendance_daily_employee_date on public.attendance_daily(employee_id, date desc);
create index if not exists idx_leave_requests_employee_status on public.leave_requests(employee_id, status);
create index if not exists idx_missions_employee_status on public.missions(employee_id, status);
create index if not exists idx_audit_logs_created_at on public.audit_logs(created_at desc);
create index if not exists idx_employee_locations_employee_created on public.employee_locations(employee_id, created_at desc);
create index if not exists idx_login_identifier_attempts_last on public.login_identifier_attempts(last_attempt_at desc);

-- =========================
-- 6) Helper functions for RLS
-- =========================
create or replace function public.current_profile()
returns public.profiles
language sql
stable
security definer
set search_path = public
as $$
  select p from public.profiles p where p.id = auth.uid() limit 1;
$$;

create or replace function public.current_employee_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select employee_id from public.profiles where id = auth.uid() limit 1;
$$;

create or replace function public.current_role_permissions()
returns text[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(r.permissions, '{}')
  from public.profiles p
  left join public.roles r on r.id = p.role_id
  where p.id = auth.uid()
  limit 1;
$$;

create or replace function public.current_is_full_access()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select coalesce(
      '*' = any(coalesce(r.permissions, '{}'))
      or r.slug in ('admin', 'executive', 'executive-secretary', 'hr-manager'),
      false
    )
    from public.profiles p
    left join public.roles r on r.id = p.role_id
    where p.id = auth.uid()
    limit 1
  ), false);
$$;

create or replace function public.has_permission(scope text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_is_full_access() or scope = any(public.current_role_permissions());
$$;

create or replace function public.can_access_employee(emp_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    public.current_is_full_access()
    or emp_id = public.current_employee_id()
    or exists (
      select 1 from public.employees e
      where e.id = emp_id and e.manager_employee_id = public.current_employee_id()
    ), false
  );
$$;

-- =========================
-- 7) Auth profile trigger
-- =========================
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  emp public.employees;
  fallback_role uuid;
begin
  select * into emp from public.employees where lower(email) = lower(new.email) limit 1;
  select id into fallback_role from public.roles where slug = 'employee' limit 1;
  insert into public.profiles (
    id, email, phone, full_name, avatar_url, employee_id, role_id, branch_id, department_id, governorate_id, complex_id,
    status, temporary_password, must_change_password
  ) values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'phone', emp.phone, null),
    coalesce(emp.full_name, new.raw_user_meta_data->>'full_name', new.email),
    coalesce(new.raw_user_meta_data->>'avatar_url', emp.photo_url, ''),
    emp.id,
    coalesce(emp.role_id, fallback_role),
    emp.branch_id,
    emp.department_id,
    emp.governorate_id,
    emp.complex_id,
    'ACTIVE',
    true,
    true
  )
  on conflict (id) do update set
    email = excluded.email,
    phone = coalesce(nullif(excluded.phone, ''), public.profiles.phone),
    full_name = excluded.full_name,
    avatar_url = coalesce(nullif(excluded.avatar_url, ''), public.profiles.avatar_url),
    employee_id = coalesce(public.profiles.employee_id, excluded.employee_id),
    -- Ø¹Ù†Ø¯ ÙˆØ¬ÙˆØ¯ Ù…ÙˆØ¸Ù Ù…Ø·Ø§Ø¨Ù‚ Ù„Ù„Ø¨Ø±ÙŠØ¯ØŒ Ù†Ø¹ØªÙ…Ø¯ Ø¯ÙˆØ± Ø§Ù„Ù…ÙˆØ¸Ù ÙƒÙ…Ø±Ø¬Ø¹ ØµÙ„Ø§Ø­ÙŠØ§Øª Ø­ØªÙ‰ Ù„Ø§ ÙŠØ¨Ù‚Ù‰ Ø§Ù„Ø­Ø³Ø§Ø¨ Ø¹Ù„Ù‰ Ø¯ÙˆØ± Ù‚Ø¯ÙŠÙ…/Ø®Ø§Ø·Ø¦.
    role_id = coalesce(excluded.role_id, public.profiles.role_id),
    branch_id = coalesce(excluded.branch_id, public.profiles.branch_id),
    department_id = coalesce(excluded.department_id, public.profiles.department_id),
    governorate_id = coalesce(excluded.governorate_id, public.profiles.governorate_id),
    complex_id = coalesce(excluded.complex_id, public.profiles.complex_id),
    status = coalesce(public.profiles.status, excluded.status),
    updated_at = now();

  if emp.id is not null then
    update public.employees set user_id = new.id, updated_at = now() where id = emp.id;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_hr_profile on auth.users;
create trigger on_auth_user_created_hr_profile
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- =========================
-- 7.5) Server-side triggers and attendance helpers
-- =========================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['roles','governorates','complexes','branches','departments','shifts','employees','profiles','attendance_daily','leave_requests','missions','attendance_exceptions','location_requests','kpi_evaluations','dispute_cases','integration_settings'] loop
    execute format('drop trigger if exists set_updated_at_%1$s on public.%1$I', t);
    execute format('create trigger set_updated_at_%1$s before update on public.%1$I for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

create or replace function public.server_now()
returns timestamptz
language sql
stable
as $$ select now(); $$;

create or replace function public.calculate_late_minutes(p_employee_id uuid, p_event_at timestamptz default now())
returns integer
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  emp public.employees;
  sh public.shifts;
  start_text text;
  start_ts timestamptz;
  tz text := 'Africa/Cairo';
  grace integer := 15;
begin
  select * into emp from public.employees where id = p_employee_id;
  if emp.id is null then return 0; end if;
  select * into sh from public.shifts where id = emp.shift_id;
  start_text := coalesce(sh.start_time, '09:00');
  grace := coalesce(sh.grace_minutes, 15);
  start_ts := ((p_event_at at time zone tz)::date::text || ' ' || start_text)::timestamp at time zone tz;
  return greatest(0, floor(extract(epoch from (p_event_at - start_ts)) / 60)::integer - grace);
end;
$$;

create or replace function public.upsert_attendance_daily_from_event(
  p_employee_id uuid,
  p_type text,
  p_event_at timestamptz,
  p_status text,
  p_late_minutes integer default 0,
  p_requires_review boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  p_date date := (p_event_at at time zone 'Africa/Cairo')::date;
begin
  insert into public.attendance_daily (employee_id, date, status, first_check_in_at, last_check_out_at, late_minutes, work_minutes, requires_review)
  values (
    p_employee_id,
    p_date,
    case when p_type = 'CHECK_OUT' then 'PRESENT' else coalesce(p_status, p_type) end,
    case when p_type = 'CHECK_IN' then p_event_at else null end,
    case when p_type = 'CHECK_OUT' then p_event_at else null end,
    coalesce(p_late_minutes, 0),
    0,
    coalesce(p_requires_review, false)
  )
  on conflict (employee_id, date) do update set
    status = case when p_type = 'CHECK_OUT' then coalesce(attendance_daily.status, 'PRESENT') else coalesce(p_status, attendance_daily.status) end,
    first_check_in_at = case when p_type = 'CHECK_IN' then least(coalesce(attendance_daily.first_check_in_at, p_event_at), p_event_at) else attendance_daily.first_check_in_at end,
    last_check_out_at = case when p_type = 'CHECK_OUT' then greatest(coalesce(attendance_daily.last_check_out_at, p_event_at), p_event_at) else attendance_daily.last_check_out_at end,
    late_minutes = greatest(coalesce(attendance_daily.late_minutes, 0), coalesce(p_late_minutes, 0)),
    requires_review = attendance_daily.requires_review or coalesce(p_requires_review, false),
    work_minutes = case
      when coalesce(attendance_daily.first_check_in_at, case when p_type='CHECK_IN' then p_event_at end) is not null
       and coalesce(case when p_type='CHECK_OUT' then p_event_at end, attendance_daily.last_check_out_at) is not null
      then greatest(0, floor(extract(epoch from (coalesce(case when p_type='CHECK_OUT' then p_event_at end, attendance_daily.last_check_out_at) - coalesce(attendance_daily.first_check_in_at, case when p_type='CHECK_IN' then p_event_at end))) / 60)::integer)
      else attendance_daily.work_minutes
    end,
    updated_at = now();
end;
$$;

create or replace function public.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_logs(action, entity_type, entity_id, actor_user_id, actor, before_data, after_data, metadata)
  values (
    lower(tg_op),
    tg_table_name,
    coalesce(new.id, old.id),
    auth.uid(),
    coalesce((select full_name from public.profiles where id = auth.uid()), 'system'),
    case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) else null end,
    jsonb_build_object('schema', tg_table_schema)
  );
  return coalesce(new, old);
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['employees','profiles','attendance_events','attendance_daily','leave_requests','missions','attendance_exceptions','location_requests','employee_locations','kpi_evaluations','dispute_cases','attachments','passkey_credentials','push_subscriptions','integration_settings','payroll_exports','access_control_events'] loop
    execute format('drop trigger if exists audit_row_change_%1$s on public.%1$I', t);
    execute format('create trigger audit_row_change_%1$s after insert or update or delete on public.%1$I for each row execute function public.audit_row_change()', t);
  end loop;
end $$;

-- =========================
-- 8) Enable RLS
-- =========================
alter table public.permissions enable row level security;
alter table public.roles enable row level security;
alter table public.governorates enable row level security;
alter table public.complexes enable row level security;
alter table public.branches enable row level security;
alter table public.departments enable row level security;
alter table public.shifts enable row level security;
alter table public.employees enable row level security;
alter table public.profiles enable row level security;
alter table public.attendance_events enable row level security;
alter table public.attendance_daily enable row level security;
alter table public.leave_requests enable row level security;
alter table public.missions enable row level security;
alter table public.attendance_exceptions enable row level security;
alter table public.location_requests enable row level security;
alter table public.employee_locations enable row level security;
alter table public.kpi_evaluations enable row level security;
alter table public.dispute_cases enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;
alter table public.login_identifier_attempts enable row level security;
alter table public.attachments enable row level security;
alter table public.passkey_credentials enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.integration_settings enable row level security;
alter table public.payroll_exports enable row level security;
alter table public.access_control_events enable row level security;

-- =========================
-- 9) Policies
-- =========================
-- lookups: authenticated read, full-access write
do $$
declare t text;
begin
  foreach t in array array['permissions','roles','governorates','complexes','branches','departments','shifts','integration_settings'] loop
    execute format('drop policy if exists "lookup_read_%1$s" on public.%1$I', t);
    execute format('drop policy if exists "lookup_write_%1$s" on public.%1$I', t);
    execute format('create policy "lookup_read_%1$s" on public.%1$I for select to authenticated using (true)', t);
    execute format('create policy "lookup_write_%1$s" on public.%1$I for all to authenticated using (public.current_is_full_access()) with check (public.current_is_full_access())', t);
  end loop;
end $$;

-- employees
drop policy if exists "employees_read_scope" on public.employees;
create policy "employees_read_scope" on public.employees for select to authenticated using (public.can_access_employee(id));
drop policy if exists "employees_write_full" on public.employees;
create policy "employees_write_full" on public.employees for all to authenticated using (public.current_is_full_access()) with check (public.current_is_full_access());

-- profiles
drop policy if exists "profiles_read_scope" on public.profiles;
create policy "profiles_read_scope" on public.profiles for select to authenticated using (id = auth.uid() or public.current_is_full_access() or public.can_access_employee(employee_id));
drop policy if exists "profiles_update_full" on public.profiles;
create policy "profiles_update_full" on public.profiles for update to authenticated using (id = auth.uid() or public.current_is_full_access()) with check (id = auth.uid() or public.current_is_full_access());
drop policy if exists "profiles_insert_full" on public.profiles;
create policy "profiles_insert_full" on public.profiles for insert to authenticated with check (public.current_is_full_access());

-- employee-scoped tables
do $$
declare t text;
begin
  foreach t in array array['attendance_events','attendance_daily','leave_requests','missions','attendance_exceptions','location_requests','employee_locations','kpi_evaluations','attachments','access_control_events'] loop
    execute format('drop policy if exists "employee_scope_read_%1$s" on public.%1$I', t);
    execute format('drop policy if exists "employee_scope_insert_%1$s" on public.%1$I', t);
    execute format('drop policy if exists "employee_scope_update_%1$s" on public.%1$I', t);
    execute format('drop policy if exists "employee_scope_delete_%1$s" on public.%1$I', t);
    execute format('create policy "employee_scope_read_%1$s" on public.%1$I for select to authenticated using (public.can_access_employee(employee_id))', t);
    execute format('create policy "employee_scope_insert_%1$s" on public.%1$I for insert to authenticated with check (public.current_is_full_access() or employee_id = public.current_employee_id() or public.has_permission(''kpi:team'') or public.has_permission(''requests:approve''))', t);
    execute format('create policy "employee_scope_update_%1$s" on public.%1$I for update to authenticated using (public.current_is_full_access() or public.can_access_employee(employee_id)) with check (public.current_is_full_access() or public.can_access_employee(employee_id))', t);
    execute format('create policy "employee_scope_delete_%1$s" on public.%1$I for delete to authenticated using (public.current_is_full_access())', t);
  end loop;
end $$;

-- disputes, notifications, audit, passkeys, push, payroll
drop policy if exists "disputes_read" on public.dispute_cases;
create policy "disputes_read" on public.dispute_cases for select to authenticated using (public.current_is_full_access() or created_by = auth.uid() or public.can_access_employee(employee_id));
drop policy if exists "disputes_write" on public.dispute_cases;
create policy "disputes_write" on public.dispute_cases for all to authenticated using (public.current_is_full_access() or created_by = auth.uid()) with check (public.current_is_full_access() or created_by = auth.uid());

drop policy if exists "notifications_read" on public.notifications;
create policy "notifications_read" on public.notifications for select to authenticated using (user_id = auth.uid() or public.current_is_full_access());
drop policy if exists "notifications_write" on public.notifications;
create policy "notifications_write" on public.notifications for all to authenticated using (user_id = auth.uid() or public.current_is_full_access()) with check (user_id = auth.uid() or public.current_is_full_access());

drop policy if exists "audit_read_full" on public.audit_logs;
create policy "audit_read_full" on public.audit_logs for select to authenticated using (public.current_is_full_access() or public.has_permission('audit:view'));
drop policy if exists "audit_insert_auth" on public.audit_logs;
-- Direct INSERT is intentionally disabled; tamper-resistant audit rows are written by database triggers.

drop policy if exists "passkeys_own" on public.passkey_credentials;
drop policy if exists "login_identifier_attempts_service_only" on public.login_identifier_attempts;
create policy "login_identifier_attempts_service_only" on public.login_identifier_attempts for all to service_role using (true) with check (true);

create policy "passkeys_own" on public.passkey_credentials for all to authenticated using (user_id = auth.uid() or public.current_is_full_access()) with check (user_id = auth.uid() or public.current_is_full_access());

drop policy if exists "push_own" on public.push_subscriptions;
create policy "push_own" on public.push_subscriptions for all to authenticated using (user_id = auth.uid() or public.current_is_full_access()) with check (user_id = auth.uid() or public.current_is_full_access());

drop policy if exists "payroll_full" on public.payroll_exports;
create policy "payroll_full" on public.payroll_exports for all to authenticated using (public.current_is_full_access() or public.has_permission('payroll:manage')) with check (public.current_is_full_access() or public.has_permission('payroll:manage'));

-- =========================
-- 10) Storage buckets and policies
-- =========================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 2097152, array['image/png','image/jpeg','image/webp','image/gif']),
  ('punch-selfies', 'punch-selfies', false, 3145728, array['image/png','image/jpeg','image/webp']),
  ('employee-attachments', 'employee-attachments', false, 8388608, null)
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read" on storage.objects for select using (bucket_id = 'avatars');
drop policy if exists "avatars_upload_auth" on storage.objects;
create policy "avatars_upload_auth" on storage.objects for insert to authenticated with check (bucket_id = 'avatars');
drop policy if exists "selfies_auth_read" on storage.objects;
create policy "selfies_auth_read" on storage.objects for select to authenticated using (bucket_id = 'punch-selfies' and (owner = auth.uid() or public.current_is_full_access()));
drop policy if exists "selfies_upload_auth" on storage.objects;
create policy "selfies_upload_auth" on storage.objects for insert to authenticated with check (bucket_id = 'punch-selfies');
drop policy if exists "attachments_auth_read" on storage.objects;
create policy "attachments_auth_read" on storage.objects for select to authenticated using (bucket_id = 'employee-attachments' and (owner = auth.uid() or public.current_is_full_access()));
drop policy if exists "attachments_upload_auth" on storage.objects;
create policy "attachments_upload_auth" on storage.objects for insert to authenticated with check (bucket_id = 'employee-attachments');

-- =========================
-- 11) Realtime publication
-- =========================
do $$
begin
  alter publication supabase_realtime add table public.attendance_events;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.employee_locations;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.leave_requests;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.missions;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.kpi_evaluations;
exception when duplicate_object then null;
end $$;

-- =========================
-- 12) Seed: roles, org, shifts, people
-- =========================
insert into public.permissions (scope, name) values
('*','ÙƒÙ„ Ø§Ù„ØµÙ„Ø§Ø­ÙŠØ§Øª'),
('dashboard:view','Ø¹Ø±Ø¶ Ù„ÙˆØ­Ø© Ø§Ù„Ù…ØªØ§Ø¨Ø¹Ø©'),
('employees:view','Ø¹Ø±Ø¶ Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ†'),
('employees:write','Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ†'),
('users:manage','Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…ÙŠÙ†'),
('organization:manage','Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ù‡ÙŠÙƒÙ„ Ø§Ù„Ø¥Ø¯Ø§Ø±ÙŠ'),
('attendance:self','Ø¨ØµÙ…Ø© Ø§Ù„Ù…ÙˆØ¸Ù'),
('attendance:manage','Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø­Ø¶ÙˆØ±'),
('requests:approve','Ø§Ø¹ØªÙ…Ø§Ø¯ Ø§Ù„Ø·Ù„Ø¨Ø§Øª'),
('kpi:self','ØªÙ‚ÙŠÙŠÙ… Ø°Ø§ØªÙŠ'),
('kpi:team','Ø§Ø¹ØªÙ…Ø§Ø¯ ØªÙ‚ÙŠÙŠÙ…Ø§Øª Ø§Ù„ÙØ±ÙŠÙ‚'),
('kpi:manage','Ø¥Ø¯Ø§Ø±Ø© ÙƒÙ„ Ø§Ù„ØªÙ‚ÙŠÙŠÙ…Ø§Øª'),
('reports:export','Ø§Ù„ØªÙ‚Ø§Ø±ÙŠØ± ÙˆØ§Ù„ØªØµØ¯ÙŠØ±'),
('audit:view','Ø³Ø¬Ù„ Ø§Ù„ØªØ¯Ù‚ÙŠÙ‚'),
('settings:manage','Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø§Ù„Ù†Ø¸Ø§Ù…'),
('realtime:view','Ù„ÙˆØ­Ø© Live'),
('integrations:manage','Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„ØªÙƒØ§Ù…Ù„Ø§Øª'),
('payroll:manage','ØªÙƒØ§Ù…Ù„ Ø§Ù„Ø±ÙˆØ§ØªØ¨'),
('ai:view','ØªØ­Ù„ÙŠÙ„Ø§Øª AI'),
('access_control:manage','Ø§Ù„Ø£Ø¬Ù‡Ø²Ø© ÙˆØ§Ù„Ø¨ÙˆØ§Ø¨Ø§Øª'),
('offline:manage','Ù…Ø²Ø§Ù…Ù†Ø© Offline'),
('executive:report','ØªÙ‚Ø§Ø±ÙŠØ± Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ'),
('executive:mobile','Ø§Ù„Ù…ØªØ§Ø¨Ø¹Ø© Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠØ© Ø§Ù„Ù…Ø®ØªØµØ±Ø©'),
('executive:presence-map','Ø®Ø±ÙŠØ·Ø© Ø§Ù„ØªÙˆØ§Ø¬Ø¯ Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠØ©'),
('live-location:request','Ø·Ù„Ø¨ Ù…ÙˆÙ‚Ø¹ Ù…Ø¨Ø§Ø´Ø± Ù…Ù† Ù…ÙˆØ¸Ù'),
('sensitive-actions:approve','Ø§Ø¹ØªÙ…Ø§Ø¯ Ø¥Ø¬Ø±Ø§Ø¡Ø§Øª Ø­Ø³Ø§Ø³Ø©'),
('sensitive-actions:request','Ø·Ù„Ø¨ Ø§Ø¹ØªÙ…Ø§Ø¯ Ø¥Ø¬Ø±Ø§Ø¡ Ø­Ø³Ø§Ø³'),
('approvals:manage','Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø§Ø¹ØªÙ…Ø§Ø¯Ø§Øª'),
('alerts:manage','Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„ØªÙ†Ø¨ÙŠÙ‡Ø§Øª'),
('control-room:view','Ø¹Ø±Ø¶ ØºØ±ÙØ© Ø§Ù„ØªØ­ÙƒÙ…'),
('daily-report:review','Ù…Ø±Ø§Ø¬Ø¹Ø© Ø§Ù„ØªÙ‚Ø§Ø±ÙŠØ± Ø§Ù„ÙŠÙˆÙ…ÙŠØ©')
on conflict (scope) do update set name = excluded.name;

insert into public.roles (slug, key, name, permissions) values
('admin','ADMIN','Ù…Ø¯ÙŠØ± Ø§Ù„Ù†Ø¸Ø§Ù…', array['*']),
('executive','EXECUTIVE','Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ', array['dashboard:view','employees:view','reports:export','executive:report','executive:mobile','executive:presence-map','live-location:request','sensitive-actions:approve','approvals:manage','alerts:manage','control-room:view','daily-report:review']),
('executive-secretary','EXECUTIVE_SECRETARY','Ø§Ù„Ø³ÙƒØ±ØªÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ', array['dashboard:view','employees:view','reports:export','executive:report','executive:mobile','executive:presence-map','live-location:request','sensitive-actions:request','daily-report:review','alerts:manage']),
('hr-manager','HR','Ø§Ù„Ù…ÙˆØ§Ø±Ø¯ Ø§Ù„Ø¨Ø´Ø±ÙŠØ©', array['*']),
('manager','MANAGER','Ù…Ø¯ÙŠØ± Ù…Ø¨Ø§Ø´Ø±', array['dashboard:view','employees:view','attendance:manage','requests:approve','kpi:team','reports:export','realtime:view']),
('employee','EMPLOYEE','Ù…ÙˆØ¸Ù', array['dashboard:view','attendance:self','kpi:self'])
on conflict (slug) do update set name = excluded.name, permissions = excluded.permissions, active = true;

insert into public.governorates (code, name) values ('GZ','Ø§Ù„Ø¬ÙŠØ²Ø©') on conflict (code) do update set name = excluded.name;

insert into public.complexes (code, name, governorate_id)
select 'AHLA-MANIL', 'Ù…Ø¬Ù…Ø¹ Ù…Ù†ÙŠÙ„ Ø´ÙŠØ­Ø©', g.id from public.governorates g where g.code='GZ'
on conflict (code) do update set name = excluded.name, governorate_id = excluded.governorate_id;

insert into public.branches (code, name, address, governorate_id, complex_id, latitude, longitude, geofence_radius_meters, max_accuracy_meters)
select 'MAIN', 'Ù…Ø¬Ù…Ø¹ Ù…Ù†ÙŠÙ„ Ø´ÙŠØ­Ø©', 'Ø´Ø§Ø±Ø¹ Ù…Ø²Ù„Ù‚Ø§Ù† Ø§Ù„Ø¹Ø±Ø¨, Manil Shihah, Abu El Numrus, Giza Governorate 12912', g.id, c.id, 29.951196809090636::numeric, 31.238367688465857::numeric, 300, 500
from public.governorates g cross join public.complexes c where g.code='GZ' and c.code='AHLA-MANIL'
on conflict (code) do update set name = excluded.name, address = excluded.address, governorate_id = excluded.governorate_id, complex_id = excluded.complex_id, latitude = excluded.latitude, longitude = excluded.longitude, geofence_radius_meters = excluded.geofence_radius_meters, max_accuracy_meters = excluded.max_accuracy_meters;

-- ØªØ«Ø¨ÙŠØª Ø¥Ø­Ø¯Ø§Ø«ÙŠØ§Øª Ø§Ù„ÙØ±Ø¹ Ø§Ù„ÙØ¹Ù„ÙŠØ© Ù„Ù„Ø¨ØµÙ…Ø© Ø§Ù„Ø¬ØºØ±Ø§ÙÙŠØ© Ø­Ø³Ø¨ Google Maps.
update public.branches
set latitude = 29.951196809090636::numeric,
    longitude = 31.238367688465857::numeric,
    geofence_radius_meters = 300,
    max_accuracy_meters = 500,
    address = 'Ø´Ø§Ø±Ø¹ Ù…Ø²Ù„Ù‚Ø§Ù† Ø§Ù„Ø¹Ø±Ø¨, Manil Shihah, Abu El Numrus, Giza Governorate 12912'
where code = 'MAIN';


insert into public.departments (code, name, branch_id)
select code, name, (select id from public.branches where code='MAIN') from (values
('EXEC','Ø§Ù„Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠØ©'),
('HR','Ø§Ù„Ù…ÙˆØ§Ø±Ø¯ Ø§Ù„Ø¨Ø´Ø±ÙŠØ©'),
('OPS','Ø§Ù„ØªØ´ØºÙŠÙ„'),
('QURAN','Ø§Ù„Ù‚Ø±Ø¢Ù† ÙˆØ§Ù„ØªØ¬ÙˆÙŠØ¯'),
('FIN','Ø§Ù„Ø­Ø³Ø§Ø¨Ø§Øª')
) as d(code,name)
on conflict (code) do update set name = excluded.name, branch_id = excluded.branch_id;

insert into public.shifts (branch_id, name, start_time, end_time, grace_minutes, days_mask)
select b.id, 'ÙˆØ±Ø¯ÙŠØ© 9Øµ Ø¥Ù„Ù‰ 5Ù…', '09:00', '17:00', 15, 'SAT,SUN,MON,TUE,WED,THU' from public.branches b where b.code='MAIN'
on conflict do nothing;
insert into public.shifts (branch_id, name, start_time, end_time, grace_minutes, days_mask)
select b.id, 'ÙˆØ±Ø¯ÙŠØ© 10Øµ Ø¥Ù„Ù‰ 6Ù…', '10:00', '18:00', 15, 'SAT,SUN,MON,TUE,WED,THU' from public.branches b where b.code='MAIN'
on conflict do nothing;

-- Ù…ÙˆØ¸ÙÙˆÙ† Ù…Ø¨Ø¯Ø¦ÙŠÙˆÙ†. Ø£Ù†Ø´Ø¦ Ù…Ø³ØªØ®Ø¯Ù…ÙŠ Auth Ø¨Ù†ÙØ³ Ø§Ù„Ø¥ÙŠÙ…ÙŠÙ„Ø§ØªØŒ ÙˆØ³ÙŠØªÙ… Ø±Ø¨Ø· profile ØªÙ„Ù‚Ø§Ø¦ÙŠÙ‹Ø§.
insert into public.employees (employee_code, full_name, phone, email, job_title, role_id, branch_id, department_id, governorate_id, complex_id, shift_id, status, hire_date)
select * from (
  select 'EMP-001' employee_code, 'Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ' full_name, 'PHONE_PLACEHOLDER_002' phone, 'executive.director@organization.local' email, 'Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ' job_title, (select id from public.roles where slug='executive') role_id, (select id from public.branches where code='MAIN') branch_id, (select id from public.departments where code='EXEC') department_id, (select id from public.governorates where code='GZ') governorate_id, (select id from public.complexes where code='AHLA-MANIL') complex_id, (select id from public.shifts where name='ÙˆØ±Ø¯ÙŠØ© 9Øµ Ø¥Ù„Ù‰ 5Ù…' limit 1) shift_id, 'ACTIVE' status, current_date hire_date
  union all select 'EMP-002','Ø§Ù„Ø³ÙƒØ±ØªÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ','PHONE_PLACEHOLDER_003','executive.secretary@organization.local','Ø§Ù„Ø³ÙƒØ±ØªÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ',(select id from public.roles where slug='executive-secretary'),(select id from public.branches where code='MAIN'),(select id from public.departments where code='EXEC'),(select id from public.governorates where code='GZ'),(select id from public.complexes where code='AHLA-MANIL'),(select id from public.shifts where name='ÙˆØ±Ø¯ÙŠØ© 9Øµ Ø¥Ù„Ù‰ 5Ù…' limit 1),'ACTIVE',current_date
  union all select 'EMP-003','Ù…Ø³Ø¤ÙˆÙ„ Ø§Ù„Ù…ÙˆØ§Ø±Ø¯ Ø§Ù„Ø¨Ø´Ø±ÙŠØ©','PHONE_PLACEHOLDER_004','hr@ahla.local','HR',(select id from public.roles where slug='hr-manager'),(select id from public.branches where code='MAIN'),(select id from public.departments where code='HR'),(select id from public.governorates where code='GZ'),(select id from public.complexes where code='AHLA-MANIL'),(select id from public.shifts where name='ÙˆØ±Ø¯ÙŠØ© 9Øµ Ø¥Ù„Ù‰ 5Ù…' limit 1),'ACTIVE',current_date
  union all select 'EMP-004','Ù…Ø¯ÙŠØ± Ø§Ù„ØªØ´ØºÙŠÙ„','PHONE_PLACEHOLDER_005','manager.ops@ahla.local','Ù…Ø¯ÙŠØ± Ù…Ø¨Ø§Ø´Ø±',(select id from public.roles where slug='manager'),(select id from public.branches where code='MAIN'),(select id from public.departments where code='OPS'),(select id from public.governorates where code='GZ'),(select id from public.complexes where code='AHLA-MANIL'),(select id from public.shifts where name='ÙˆØ±Ø¯ÙŠØ© 10Øµ Ø¥Ù„Ù‰ 6Ù…' limit 1),'ACTIVE',current_date
  union all select 'EMP-005','Ù…ÙˆØ¸Ù ØªØ¬Ø±ÙŠØ¨ÙŠ','PHONE_PLACEHOLDER_006','employee@ahla.local','Ù…ÙˆØ¸Ù',(select id from public.roles where slug='employee'),(select id from public.branches where code='MAIN'),(select id from public.departments where code='OPS'),(select id from public.governorates where code='GZ'),(select id from public.complexes where code='AHLA-MANIL'),(select id from public.shifts where name='ÙˆØ±Ø¯ÙŠØ© 10Øµ Ø¥Ù„Ù‰ 6Ù…' limit 1),'ACTIVE',current_date
) s
on conflict (employee_code) do update set full_name = excluded.full_name, email = excluded.email, role_id = excluded.role_id, branch_id = excluded.branch_id, department_id = excluded.department_id, shift_id = excluded.shift_id;

update public.employees e set manager_employee_id = (select id from public.employees where employee_code='EMP-004') where e.employee_code = 'EMP-005';

-- Ø¥ØµÙ„Ø§Ø­ ØªÙ„Ù‚Ø§Ø¦ÙŠ Ù„Ù„Ø£Ø¯ÙˆØ§Ø± ÙˆØ§Ù„ØµÙ„Ø§Ø­ÙŠØ§Øª Ù„Ù„Ø­Ø³Ø§Ø¨Ø§Øª Ø§Ù„Ù…ÙˆØ¬ÙˆØ¯Ø© Ø¨Ø§Ù„ÙØ¹Ù„ ÙÙŠ Auth/Profiles.
-- ÙŠØ¹Ø§Ù„Ø¬ Ø­Ø§Ù„Ø© Ø¸Ù‡ÙˆØ± Ø¯ÙˆØ± Ø®Ø§Ø·Ø¦ Ù…Ø«Ù„ "Ø¨Ø§Ø­Ø«/Ù…Ø¯Ø®Ù„ Ø¨ÙŠØ§Ù†Ø§Øª" Ø±ØºÙ… Ø£Ù† Ø§Ù„Ù…ÙˆØ¸Ù ÙÙŠ Ø¬Ø¯ÙˆÙ„ employees Ù„Ù‡ Ø¯ÙˆØ± Ø¥Ø¯Ø§Ø±ÙŠ.
update public.profiles p
set employee_id = e.id,
    full_name = coalesce(nullif(e.full_name, ''), p.full_name),
    role_id = e.role_id,
    branch_id = e.branch_id,
    department_id = e.department_id,
    governorate_id = e.governorate_id,
    complex_id = e.complex_id,
    status = 'ACTIVE',
    updated_at = now()
from public.employees e
where lower(p.email) = lower(e.email)
  and e.is_deleted = false
  and (
    p.employee_id is distinct from e.id
    or p.role_id is distinct from e.role_id
    or p.branch_id is distinct from e.branch_id
    or p.department_id is distinct from e.department_id
  );

insert into public.integration_settings (key, name, provider, enabled, status, notes) values
('odoo-payroll','Odoo Payroll','odoo',false,'NEEDS_API_KEY','Ø£Ø¶Ù Ù…ÙØ§ØªÙŠØ­ API Ù…Ù† Edge Function Ø¹Ù†Ø¯ Ø§Ù„ØªÙØ¹ÙŠÙ„'),
('xero-payroll','Xero Payroll','xero',false,'NEEDS_API_KEY','Ø¬Ø§Ù‡Ø² Ù„Ù„ØªÙƒØ§Ù…Ù„ Ù„Ø§Ø­Ù‚Ù‹Ø§'),
('access-control','Ø¨ÙˆØ§Ø¨Ø§Øª Ø§Ù„Ø¯Ø®ÙˆÙ„','custom',false,'NEEDS_DEVICE','ÙŠØªØ·Ù„Ø¨ Ø¬Ù‡Ø§Ø² Ø£Ùˆ API Ù…Ù† Ù…Ø²ÙˆØ¯ Ø§Ù„Ø¨ÙˆØ§Ø¨Ø©')
on conflict (key) do update set name = excluded.name, provider = excluded.provider, notes = excluded.notes;

-- Ù†Ù‡Ø§ÙŠØ© Ø§Ù„Ù…Ù„Ù


-- END PATCH: 001_schema_rls_seed.sql


-- =========================================================
-- BEGIN PATCH: 002_repair_profile_roles.sql
-- =========================================================

-- =========================================================
-- Patch: Ø¥ØµÙ„Ø§Ø­ Ø£Ø¯ÙˆØ§Ø± Profiles ÙˆØ±Ø¨Ø·Ù‡Ø§ Ø¨Ø¬Ø¯ÙˆÙ„ Employees
-- Ø´ØºÙ‘Ù„ Ù‡Ø°Ø§ Ø§Ù„Ù…Ù„Ù ÙÙŠ Supabase SQL Editor Ø¥Ø°Ø§ Ø¸Ù‡Ø± Ù„Ù„Ù…Ø³ØªØ®Ø¯Ù… Ø¯ÙˆØ± Ø®Ø§Ø·Ø¦
-- Ù…Ø«Ù„: Ø¨Ø§Ø­Ø«/Ù…Ø¯Ø®Ù„ Ø¨ÙŠØ§Ù†Ø§Øª Ø¨Ø¯Ù„Ø§Ù‹ Ù…Ù† Ø§Ù„Ù…Ø¯ÙŠØ±/Ø§Ù„Ø£Ø¯Ù…Ù†.
-- =========================================================

update public.profiles p
set employee_id = e.id,
    full_name = coalesce(nullif(e.full_name, ''), p.full_name),
    role_id = e.role_id,
    branch_id = e.branch_id,
    department_id = e.department_id,
    governorate_id = e.governorate_id,
    complex_id = e.complex_id,
    status = 'ACTIVE',
    updated_at = now()
from public.employees e
where lower(p.email) = lower(e.email)
  and e.is_deleted = false
  and (
    p.employee_id is distinct from e.id
    or p.role_id is distinct from e.role_id
    or p.branch_id is distinct from e.branch_id
    or p.department_id is distinct from e.department_id
  );

-- ØªØ£ÙƒÙŠØ¯ Ø£Ù† Ø§Ù„Ø£Ø¯ÙˆØ§Ø± Ø§Ù„Ø¹Ù„ÙŠØ§ Ù„Ù‡Ø§ ØµÙ„Ø§Ø­ÙŠØ© ÙƒØ§Ù…Ù„Ø©.
update public.roles
set permissions = array['*'], active = true, updated_at = now()
where slug in ('admin', 'executive', 'executive-secretary', 'hr-manager');

-- ÙØ­Øµ Ø³Ø±ÙŠØ¹ Ø¨Ø¹Ø¯ Ø§Ù„ØªÙ†ÙÙŠØ°.
select p.email,
       p.full_name,
       r.slug as role_slug,
       r.name as role_name,
       r.permissions
from public.profiles p
left join public.roles r on r.id = p.role_id
order by p.updated_at desc;


-- END PATCH: 002_repair_profile_roles.sql


-- =========================================================
-- BEGIN PATCH: 003_user_avatar_and_mobile_ui.sql
-- =========================================================

-- =========================================================
-- Patch 003 â€” User Avatar support
-- Ø´ØºÙ‘Ù„ Ù‡Ø°Ø§ Ø§Ù„Ù…Ù„Ù ÙÙŠ Supabase SQL Editor Ø¹Ù„Ù‰ Ù‚Ø§Ø¹Ø¯Ø© Ù…ÙˆØ¬ÙˆØ¯Ø© Ø¨Ø§Ù„ÙØ¹Ù„.
-- ÙŠØ¶ÙŠÙ avatar_url Ø¥Ù„Ù‰ profiles Ø­ØªÙ‰ ÙŠÙ…ÙƒÙ† Ø­ÙØ¸ ØµÙˆØ±Ø© Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… Ø§Ù„Ù…Ø³ØªÙ‚Ù„Ø©.
-- =========================================================

alter table public.profiles
  add column if not exists avatar_url text default '';

-- Ù…Ø²Ø§Ù…Ù†Ø© Ø£ÙˆÙ„ÙŠØ©: Ù„Ùˆ Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… Ù…Ø±Ø¨ÙˆØ· Ø¨Ù…ÙˆØ¸Ù Ù„Ø¯ÙŠÙ‡ photo_url ÙˆÙ„Ø§ ØªÙˆØ¬Ø¯ ØµÙˆØ±Ø© Ù…Ø³ØªØ®Ø¯Ù…ØŒ Ø§Ø³ØªØ®Ø¯Ù… ØµÙˆØ±Ø© Ø§Ù„Ù…ÙˆØ¸Ù ÙƒØ§ÙØªØ±Ø§Ø¶.
update public.profiles p
set avatar_url = e.photo_url
from public.employees e
where p.employee_id = e.id
  and coalesce(p.avatar_url, '') = ''
  and coalesce(e.photo_url, '') <> '';

-- Ø§Ù„ØªØ£ÙƒØ¯ Ù…Ù† ÙˆØ¬ÙˆØ¯ Bucket avatars ÙˆØ³ÙŠØ§Ø³Ø§Øª Ø§Ù„ØªØ®Ø²ÙŠÙ† Ø§Ù„Ø£Ø³Ø§Ø³ÙŠØ©.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/png','image/jpeg','image/webp','image/gif'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read" on storage.objects
for select using (bucket_id = 'avatars');

drop policy if exists "avatars_upload_auth" on storage.objects;
create policy "avatars_upload_auth" on storage.objects
for insert to authenticated
with check (bucket_id = 'avatars');


-- END PATCH: 003_user_avatar_and_mobile_ui.sql


-- =========================================================
-- BEGIN PATCH: 004_emergency_admin_access.sql
-- =========================================================

-- =========================================================
-- 004_emergency_admin_access.sql
-- Ø¥ØµÙ„Ø§Ø­ Ø¯Ø®ÙˆÙ„ Ø£Ø¯Ù…Ù† Ø·Ø§Ø±Ø¦ Ø¨ÙƒØ§Ù…Ù„ Ø§Ù„ØµÙ„Ø§Ø­ÙŠØ§Øª Ù„Ø§Ø®ØªØ¨Ø§Ø± Ø§Ù„Ù†Ø¸Ø§Ù…
--
-- Ù‚Ø¨Ù„ Ø§Ù„ØªØ´ØºÙŠÙ„: ØºÙŠÙ‘Ø± v_email Ùˆ v_password Ø¥Ø°Ø§ Ø£Ø±Ø¯Øª.
-- Ø¨Ø¹Ø¯ Ø§Ù„Ø¯Ø®ÙˆÙ„: ØºÙŠÙ‘Ø± ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± ÙÙˆØ±Ù‹Ø§ Ù…Ù† Supabase Auth Ø£Ùˆ Ù…Ù† Ø§Ù„Ù†Ø¸Ø§Ù… Ø¨Ø¹Ø¯ Ø§Ù„ØªØ£ÙƒØ¯ Ù…Ù† Ø¹Ù…Ù„ ØµÙØ­Ø© ØªØºÙŠÙŠØ± ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±.
-- =========================================================

create extension if not exists pgcrypto;

do $$
declare
  v_email text := 'admin@example.local';
  v_password text := 'ChangeMe_Admin#2026!';
  v_full_name text := 'Ù…Ø¯ÙŠØ± Ø§Ù„Ù†Ø¸Ø§Ù…';
  v_user_id uuid;
  v_role_id uuid;
  v_employee_id uuid;
  v_branch_id uuid;
  v_department_id uuid;
  v_governorate_id uuid;
  v_complex_id uuid;
begin
  -- 1) ØªØ£ÙƒÙŠØ¯ ÙˆØ¬ÙˆØ¯ Ø¯ÙˆØ± Ø£Ø¯Ù…Ù† ÙƒØ§Ù…Ù„ Ø§Ù„ØµÙ„Ø§Ø­ÙŠØ§Øª
  insert into public.roles (slug, key, name, permissions, active)
  values ('admin', 'ADMIN', 'Ù…Ø¯ÙŠØ± Ø§Ù„Ù†Ø¸Ø§Ù…', array['*']::text[], true)
  on conflict (slug) do update set
    key = excluded.key,
    name = excluded.name,
    permissions = array['*']::text[],
    active = true,
    updated_at = now();

  select id into v_role_id
  from public.roles
  where slug = 'admin'
  limit 1;

  -- 2) Ø§Ù„ØªÙ‚Ø§Ø· Ù…Ø±Ø§Ø¬Ø¹ Ø§Ø®ØªÙŠØ§Ø±ÙŠØ© Ù„Ù„ÙØ±Ø¹/Ø§Ù„Ù‚Ø³Ù… Ø­ØªÙ‰ ÙŠÙƒÙˆÙ† Ø§Ù„Ø­Ø³Ø§Ø¨ Ù…Ø±Ø¨ÙˆØ·Ù‹Ø§ Ø¨Ø§Ù„Ù†Ø¸Ø§Ù…
  select id into v_branch_id from public.branches where code = 'MAIN' limit 1;
  select id into v_department_id from public.departments where code in ('EXEC','HR') order by case when code='EXEC' then 0 else 1 end limit 1;
  select id into v_governorate_id from public.governorates where code = 'GZ' limit 1;
  select id into v_complex_id from public.complexes where code = 'AHLA-MANIL' limit 1;

  -- 3) Ø¥Ù†Ø´Ø§Ø¡ Ø£Ùˆ Ø¥ØµÙ„Ø§Ø­ Ù…Ø³ØªØ®Ø¯Ù… Supabase Auth
  select id into v_user_id
  from auth.users
  where lower(email) = lower(v_email)
  limit 1;

  if v_user_id is null then
    v_user_id := gen_random_uuid();

    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      confirmation_sent_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      is_super_admin
    ) values (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      v_email,
      crypt(v_password, gen_salt('bf')),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', v_full_name, 'role', 'admin'),
      now(),
      now(),
      false
    );
  else
    update auth.users
    set encrypted_password = crypt(v_password, gen_salt('bf')),
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        aud = 'authenticated',
        role = 'authenticated',
        banned_until = null,
        raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"provider":"email","providers":["email"]}'::jsonb,
        raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('full_name', v_full_name, 'role', 'admin'),
        updated_at = now()
    where id = v_user_id;
  end if;

  -- 4) ØªØ£ÙƒÙŠØ¯ ÙˆØ¬ÙˆØ¯ Identity email Ø­ØªÙ‰ ÙŠØ³ØªØ·ÙŠØ¹ Supabase Auth ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„ Ø¨Ø§Ù„Ø¨Ø±ÙŠØ¯/Ø§Ù„Ø¨Ø§Ø³ÙˆØ±Ø¯
  if exists (select 1 from information_schema.tables where table_schema = 'auth' and table_name = 'identities') then
    if exists (select 1 from auth.identities where user_id = v_user_id and provider = 'email') then
      update auth.identities
      set identity_data = jsonb_build_object(
            'sub', v_user_id::text,
            'email', v_email,
            'email_verified', true,
            'phone_verified', false
          ),
          provider_id = v_user_id::text,
          last_sign_in_at = coalesce(last_sign_in_at, now()),
          updated_at = now()
      where user_id = v_user_id and provider = 'email';
    else
      insert into auth.identities (
        id,
        user_id,
        provider_id,
        identity_data,
        provider,
        last_sign_in_at,
        created_at,
        updated_at
      ) values (
        gen_random_uuid(),
        v_user_id,
        v_user_id::text,
        jsonb_build_object(
          'sub', v_user_id::text,
          'email', v_email,
          'email_verified', true,
          'phone_verified', false
        ),
        'email',
        now(),
        now(),
        now()
      );
    end if;
  end if;

  -- 5) Ø¥Ù†Ø´Ø§Ø¡ Ø£Ùˆ Ø±Ø¨Ø· Employee Ø£Ø¯Ù…Ù†
  select id into v_employee_id
  from public.employees
  where user_id = v_user_id or lower(email) = lower(v_email)
  order by case when user_id = v_user_id then 0 else 1 end
  limit 1;

  if v_employee_id is null then
    insert into public.employees (
      employee_code,
      full_name,
      phone,
      email,
      job_title,
      role_id,
      branch_id,
      department_id,
      governorate_id,
      complex_id,
      status,
      is_active,
      is_deleted,
      hire_date,
      user_id
    ) values (
      'ADMIN-001',
      v_full_name,
      'PHONE_PLACEHOLDER_001',
      v_email,
      'Ø£Ø¯Ù…Ù† Ø±Ø¦ÙŠØ³ÙŠ',
      v_role_id,
      v_branch_id,
      v_department_id,
      v_governorate_id,
      v_complex_id,
      'ACTIVE',
      true,
      false,
      current_date,
      v_user_id
    )
    on conflict (employee_code) do update set
      full_name = excluded.full_name,
      email = excluded.email,
      job_title = excluded.job_title,
      role_id = excluded.role_id,
      branch_id = excluded.branch_id,
      department_id = excluded.department_id,
      governorate_id = excluded.governorate_id,
      complex_id = excluded.complex_id,
      status = 'ACTIVE',
      is_active = true,
      is_deleted = false,
      user_id = excluded.user_id,
      updated_at = now()
    returning id into v_employee_id;
  else
    update public.employees
    set full_name = coalesce(nullif(full_name, ''), v_full_name),
        email = v_email,
        job_title = 'Ø£Ø¯Ù…Ù† Ø±Ø¦ÙŠØ³ÙŠ',
        role_id = v_role_id,
        branch_id = coalesce(branch_id, v_branch_id),
        department_id = coalesce(department_id, v_department_id),
        governorate_id = coalesce(governorate_id, v_governorate_id),
        complex_id = coalesce(complex_id, v_complex_id),
        status = 'ACTIVE',
        is_active = true,
        is_deleted = false,
        user_id = v_user_id,
        updated_at = now()
    where id = v_employee_id;
  end if;

  -- 6) Ø¥Ù†Ø´Ø§Ø¡/Ø¥ØµÙ„Ø§Ø­ Profile ÙˆØ±Ø¨Ø·Ù‡ Ø¨Ø¯ÙˆØ± Ø§Ù„Ø£Ø¯Ù…Ù†
  insert into public.profiles (
    id,
    employee_id,
    email,
    full_name,
    avatar_url,
    role_id,
    branch_id,
    department_id,
    governorate_id,
    complex_id,
    status,
    temporary_password,
    must_change_password,
    password_changed_at,
    created_at,
    updated_at
  ) values (
    v_user_id,
    v_employee_id,
    v_email,
    v_full_name,
    '',
    v_role_id,
    v_branch_id,
    v_department_id,
    v_governorate_id,
    v_complex_id,
    'ACTIVE',
    false,
    false,
    now(),
    now(),
    now()
  )
  on conflict (id) do update set
    employee_id = excluded.employee_id,
    email = excluded.email,
    full_name = coalesce(nullif(public.profiles.full_name, ''), excluded.full_name),
    role_id = excluded.role_id,
    branch_id = coalesce(public.profiles.branch_id, excluded.branch_id),
    department_id = coalesce(public.profiles.department_id, excluded.department_id),
    governorate_id = coalesce(public.profiles.governorate_id, excluded.governorate_id),
    complex_id = coalesce(public.profiles.complex_id, excluded.complex_id),
    status = 'ACTIVE',
    temporary_password = false,
    must_change_password = false,
    password_changed_at = now(),
    failed_logins = 0,
    locked_until = null,
    updated_at = now();

  -- 7) Ø¯Ø¹Ù… Ù‚ÙˆØ§Ø¹Ø¯ Ù‚Ø¯ÙŠÙ…Ø© Ù„Ùˆ ÙƒØ§Ù† profiles ÙŠØ­ØªÙˆÙŠ permissions jsonb Ù…Ù† Ù†Ø³Ø®Ø© Ø³Ø§Ø¨Ù‚Ø©
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'permissions'
  ) then
    execute 'update public.profiles set permissions = $1::jsonb where id = $2'
    using jsonb_build_object(
      'role', 'admin',
      'fullAccess', true,
      'system', true,
      'employees', true,
      'attendance', true,
      'reports', true,
      'settings', true
    ), v_user_id;
  end if;

  raise notice 'Emergency admin is ready. Email: %, Temporary password: %. Change it immediately after login.', v_email, v_password;
end $$;

-- 8) ÙØ­Øµ Ù†Ù‡Ø§Ø¦ÙŠ Ø³Ø±ÙŠØ¹
select
  u.id as auth_user_id,
  u.email,
  u.email_confirmed_at,
  p.status as profile_status,
  p.temporary_password,
  p.must_change_password,
  e.employee_code,
  e.full_name as employee_name,
  e.is_active as employee_active,
  e.is_deleted as employee_deleted,
  r.slug as role_slug,
  r.permissions as role_permissions
from auth.users u
left join public.profiles p on p.id = u.id
left join public.employees e on e.user_id = u.id
left join public.roles r on r.id = p.role_id
where lower(u.email) = lower('admin@example.local');


-- END PATCH: 004_emergency_admin_access.sql


-- =========================================================
-- BEGIN PATCH: 005_simplify_employee_punch_fields.sql
-- =========================================================

-- =========================================================
-- Patch 005: ØªØ¨Ø³ÙŠØ· Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ† ÙˆØ§Ù„Ø¨ØµÙ…Ø©
-- - Ø§Ù„Ø­Ø§Ù„Ø© Ø¯Ø§Ø¦Ù…Ù‹Ø§ ACTIVE
-- - Ù„Ø§ Ù†Ø¹ØªÙ…Ø¯ Ø¹Ù„Ù‰ Ø§Ù„ÙˆØ±Ø¯ÙŠØ© ÙÙŠ Ù‚Ø¨ÙˆÙ„ Ø§Ù„Ø¨ØµÙ…Ø©
-- - ÙˆÙ‚Øª Ø§Ù„Ø¯ÙˆØ§Ù… Ø§Ù„Ø±Ø³Ù…ÙŠ Ù„Ù„ØªÙ‚Ø§Ø±ÙŠØ± ÙÙ‚Ø·: 10:00 Ø¥Ù„Ù‰ 18:00 Ø¨ØªÙˆÙ‚ÙŠØª Ø§Ù„Ù‚Ø§Ù‡Ø±Ø©
-- - Ø¥Ù†Ø´Ø§Ø¡ Ø¹Ù…ÙˆØ¯ passkey_credential_id Ø¥Ù† Ù„Ù… ÙŠÙƒÙ† Ù…ÙˆØ¬ÙˆØ¯Ù‹Ø§ Ù„ØªØ³Ø¬ÙŠÙ„ Ù…Ø±Ø¬Ø¹ Ø¨ØµÙ…Ø© Ø§Ù„Ø¬Ù‡Ø§Ø²
-- =========================================================

alter table public.attendance_events
  add column if not exists passkey_credential_id text;

update public.employees
set status = 'ACTIVE',
    is_active = true,
    shift_id = null
where is_deleted is not true;

create or replace function public.calculate_late_minutes(p_employee_id uuid, p_event_at timestamptz default now())
returns integer
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  start_ts timestamptz;
  tz text := 'Africa/Cairo';
begin
  -- Ù„Ø§ Ù†Ø³ØªØ®Ø¯Ù… Ø§Ù„ÙˆØ±Ø¯ÙŠØ§Øª. Ø§Ù„Ø¨Ø¯Ø§ÙŠØ© Ø§Ù„Ø±Ø³Ù…ÙŠØ© 10:00 ØµØ¨Ø§Ø­Ù‹Ø§ Ù„Ù„ØªÙ‚Ø§Ø±ÙŠØ± ÙÙ‚Ø·.
  start_ts := ((p_event_at at time zone tz)::date::text || ' 10:00')::timestamp at time zone tz;
  return greatest(0, floor(extract(epoch from (p_event_at - start_ts)) / 60)::integer);
end;
$$;

create or replace function public.force_employee_active_defaults()
returns trigger
language plpgsql
as $$
begin
  new.status := 'ACTIVE';
  new.is_active := true;
  new.shift_id := null;
  if new.employee_code is null or btrim(new.employee_code) = '' then
    new.employee_code := 'EMP-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  end if;
  return new;
end;
$$;

drop trigger if exists trg_force_employee_active_defaults on public.employees;
create trigger trg_force_employee_active_defaults
before insert or update on public.employees
for each row execute function public.force_employee_active_defaults();


-- END PATCH: 005_simplify_employee_punch_fields.sql


-- =========================================================
-- BEGIN PATCH: 006_single_branch_locations_disputes_cleanup.sql
-- =========================================================

-- =========================================================
-- Patch 006 â€” Single Branch + Live Location Requests + Complaint Flow
-- ØªØ§Ø±ÙŠØ® Ø§Ù„ØªÙ†ÙÙŠØ°: 27 Ø£Ø¨Ø±ÙŠÙ„ 2026
-- =========================================================

-- 1) Ø§Ø¹ØªÙ…Ø§Ø¯ Ù…Ø¬Ù…Ø¹ ÙˆØ§Ø­Ø¯ ÙÙ‚Ø· Ø¨Ø¥Ø­Ø¯Ø§Ø«ÙŠØ§Øª Ù…Ù†ÙŠÙ„ Ø´ÙŠØ­Ø© Ø§Ù„ØµØ­ÙŠØ­Ø©
update public.governorates
set name = 'Ø§Ù„Ø¬ÙŠØ²Ø©'
where code in ('GZ', 'GIZ') or name ilike '%Ø¬ÙŠØ²Ø©%';

update public.complexes
set name = 'Ù…Ø¬Ù…Ø¹ Ù…Ù†ÙŠÙ„ Ø´ÙŠØ­Ø©'
where code in ('AHLA-MANIL', 'CX-AHLA-MANIL') or name ilike '%Ù…Ù†ÙŠÙ„%';

update public.branches
set name = 'Ù…Ø¬Ù…Ø¹ Ù…Ù†ÙŠÙ„ Ø´ÙŠØ­Ø©',
    address = 'Ù…Ø¬Ù…Ø¹ Ù…Ù†ÙŠÙ„ Ø´ÙŠØ­Ø© - Ø§Ù„Ø¬ÙŠØ²Ø©',
    latitude = 29.95109939158933,
    longitude = 31.238741920853883,
    geofence_radius_meters = 300,
    max_accuracy_meters = 2000,
    active = true,
    is_deleted = false
where code in ('MAIN', 'AHLA-MANIL') or name ilike '%Ù…Ù†ÙŠÙ„%';

-- 2) ØªØ«Ø¨ÙŠØª Ø£Ù† ÙƒÙ„ Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ† Ù†Ø´Ø·ÙˆÙ† ÙˆÙ…Ø±ØªØ¨Ø·ÙˆÙ† Ø¨Ø§Ù„Ù…Ø¬Ù…Ø¹ Ø§Ù„ÙˆØ§Ø­Ø¯
update public.employees
set status = 'ACTIVE',
    is_active = true,
    branch_id = coalesce(branch_id, (select id from public.branches where code in ('MAIN','AHLA-MANIL') or name ilike '%Ù…Ù†ÙŠÙ„%' order by created_at nulls last limit 1)),
    complex_id = coalesce(complex_id, (select id from public.complexes where code in ('AHLA-MANIL','CX-AHLA-MANIL') or name ilike '%Ù…Ù†ÙŠÙ„%' order by created_at nulls last limit 1)),
    governorate_id = coalesce(governorate_id, (select id from public.governorates where code in ('GZ','GIZ') or name ilike '%Ø¬ÙŠØ²Ø©%' order by created_at nulls last limit 1)),
    shift_id = null
where is_deleted is not true;

-- 3) ØªØ¨Ø³ÙŠØ· Ø·Ù„Ø¨Ø§Øª Ø§Ù„Ù…ÙˆØ§Ù‚Ø¹: Ù„Ø§ Ø³Ø¨Ø¨ ÙˆÙ„Ø§ ØºØ±Ø¶ Ù…Ø·Ù„ÙˆØ¨ Ù…Ù† Ø§Ù„ÙˆØ§Ø¬Ù‡Ø©
alter table public.location_requests
  alter column purpose set default 'ÙØªØ­ Ø§Ù„Ù…ÙˆÙ‚Ø¹ ÙˆØ¥Ø±Ø³Ø§Ù„ Ø§Ù„Ù„ÙˆÙƒÙŠØ´Ù† Ø§Ù„Ù…Ø¨Ø§Ø´Ø±',
  alter column request_reason set default '';

update public.location_requests
set purpose = 'ÙØªØ­ Ø§Ù„Ù…ÙˆÙ‚Ø¹ ÙˆØ¥Ø±Ø³Ø§Ù„ Ø§Ù„Ù„ÙˆÙƒÙŠØ´Ù† Ø§Ù„Ù…Ø¨Ø§Ø´Ø±',
    request_reason = ''
where purpose is null or trim(purpose) = '' or request_reason is not null;

-- 4) ØªÙˆØ­ÙŠØ¯ Ø­Ø§Ù„Ø© Ø§Ù„Ø´ÙƒØ§ÙˆÙ‰ Ø§Ù„Ø¬Ø¯ÙŠØ¯Ø© Ù„ØªØ°Ù‡Ø¨ Ù„Ù„Ø¬Ù†Ø© Ù…Ø¨Ø§Ø´Ø±Ø©
alter table public.dispute_cases
  alter column status set default 'IN_REVIEW',
  alter column severity set default 'MEDIUM';

-- 5) ØµÙ„Ø§Ø­ÙŠØ§Øª Ø£Ø³Ø§Ø³ÙŠØ© Ù„Ù„Ù…ÙˆØ¸Ù Ù„Ø§Ø³ØªØ®Ø¯Ø§Ù… Ø§Ù„Ø´ÙƒØ§ÙˆÙ‰ ÙˆØ¥Ø±Ø³Ø§Ù„ Ø§Ù„Ù…ÙˆÙ‚Ø¹
insert into public.permissions (scope, name)
values
  ('disputes:create', 'ØªØ³Ø¬ÙŠÙ„ Ø´ÙƒÙˆÙ‰ Ø°Ø§ØªÙŠØ©'),
  ('location:self', 'Ø¥Ø±Ø³Ø§Ù„ Ù…ÙˆÙ‚Ø¹ÙŠ Ø§Ù„Ø­Ø§Ù„ÙŠ')
on conflict (scope) do update set name = excluded.name;

update public.roles
set permissions = array(
  select distinct unnest(coalesce(public.roles.permissions, '{}'::text[]) || array['dashboard:view','attendance:self','kpi:self','disputes:create','location:self'])
)
where slug = 'employee' or key = 'EMPLOYEE';

-- 6) Ù…Ù„Ø§Ø­Ø¸Ø© ØªØ´ØºÙŠÙ„ÙŠØ©:
-- Ø¨Ø¹Ø¯ ØªØ´ØºÙŠÙ„ Ù‡Ø°Ø§ Ø§Ù„Ù…Ù„Ù Ø§ÙØªØ­ tools/reset-cache.html Ù„Ù…Ø³Ø­ Ø§Ù„ÙƒØ§Ø´ Ø«Ù… Ø£Ø¹Ø¯ ÙØªØ­ Ø§Ù„Ù†Ø¸Ø§Ù….


-- END PATCH: 006_single_branch_locations_disputes_cleanup.sql


-- =========================================================
-- BEGIN PATCH: 007_login_punch_gps_layout_fix.sql
-- =========================================================

-- =========================================================
-- Patch 007: Login UX + Punch GPS tolerance + clean location display
-- Date: 27 Apr 2026
-- =========================================================

-- ØªÙ†Ø¸ÙŠÙ Ø¹Ù†ÙˆØ§Ù† Ø§Ù„Ù…Ø¬Ù…Ø¹ Ù…Ù† Ø±Ø§Ø¨Ø· Google Maps Ø§Ù„Ø·ÙˆÙŠÙ„ Ø­ØªÙ‰ Ù„Ø§ ÙŠÙƒØ³Ø± ÙˆØ§Ø¬Ù‡Ø© Ø§Ù„Ø¨ØµÙ…Ø©
-- ÙˆØªÙˆØ³ÙŠØ¹ Ù†Ø·Ø§Ù‚ ÙˆØ¯Ù‚Ø© GPS Ø§Ù„Ù…Ø³Ù…ÙˆØ­Ø© Ù„Ù„Ø§Ø®ØªØ¨Ø§Ø± Ø§Ù„Ø¹Ù…Ù„ÙŠ Ø¹Ù„Ù‰ Ø§Ù„Ù…ÙˆØ¨Ø§ÙŠÙ„ ÙˆØ£Ø¬Ù‡Ø²Ø© Ø§Ù„Ù…ÙƒØªØ¨.
update public.branches
set name = 'Ù…Ø¬Ù…Ø¹ Ù…Ù†ÙŠÙ„ Ø´ÙŠØ­Ø©',
    address = 'Ù…Ø¬Ù…Ø¹ Ù…Ù†ÙŠÙ„ Ø´ÙŠØ­Ø© - Ø§Ù„Ø¬ÙŠØ²Ø©',
    latitude = 29.95109939158933,
    longitude = 31.238741920853883,
    geofence_radius_meters = 300,
    max_accuracy_meters = 2000,
    active = true,
    is_deleted = false,
    updated_at = now()
where code in ('MAIN', 'AHLA-MANIL')
   or name ilike '%Ù…Ù†ÙŠÙ„ Ø´ÙŠØ­Ø©%';

-- Ø¶Ù…Ø§Ù† Ø£Ù† Ø£ÙŠ Ù…ÙˆØ¸Ù Ø¨Ø¯ÙˆÙ† ÙØ±Ø¹ ÙŠØ¹ÙˆØ¯ Ù„Ù„Ù…Ø¬Ù…Ø¹ Ø§Ù„ÙˆØ§Ø­Ø¯ Ø§Ù„Ù…Ø¹ØªÙ…Ø¯.
update public.employees e
set branch_id = b.id,
    is_active = true,
    status = 'ACTIVE',
    updated_at = now()
from public.branches b
where b.name = 'Ù…Ø¬Ù…Ø¹ Ù…Ù†ÙŠÙ„ Ø´ÙŠØ­Ø©'
  and (e.branch_id is null or e.is_active is distinct from true or e.status is distinct from 'ACTIVE');

-- Ù…Ù„Ø§Ø­Ø¸Ø©:
-- Ø§Ù„Ø¨ØµÙ…Ø© Ø£ØµØ¨Ø­Øª ØªÙ‚Ø¨Ù„ inside_branch_low_accuracy Ø¹Ù†Ø¯ ÙˆØ¬ÙˆØ¯ GPS Ø¶Ø¹ÙŠÙ Ù„ÙƒÙ† Ø§Ù„Ù…ÙˆÙ‚Ø¹ Ø¯Ø§Ø®Ù„ Ù†Ø·Ø§Ù‚ Ø§Ù„Ù…Ø¬Ù…Ø¹ Ù…Ø¹ Ù‡Ø§Ù…Ø´ Ø§Ù„Ø¯Ù‚Ø©.


-- END PATCH: 007_login_punch_gps_layout_fix.sql


-- =========================================================
-- BEGIN PATCH: 008_supabase_cli_advisor_hardening.sql
-- =========================================================

-- Advisor hardening applied after Supabase CLI checks.
-- Keeps application-facing RPCs available for signed-in users, but removes public anon execution.

alter function public.set_updated_at() set search_path = public, pg_temp;
alter function public.server_now() set search_path = public, pg_temp;
alter function public.audit_row_change() set search_path = public, pg_temp;
alter function public.calculate_late_minutes(uuid, timestamptz) set search_path = public, pg_temp;
alter function public.can_access_employee(uuid) set search_path = public, pg_temp;
alter function public.current_employee_id() set search_path = public, pg_temp;
alter function public.current_is_full_access() set search_path = public, pg_temp;
alter function public.current_profile() set search_path = public, pg_temp;
alter function public.current_role_permissions() set search_path = public, pg_temp;
alter function public.handle_new_auth_user() set search_path = public, pg_temp;
alter function public.has_permission(text) set search_path = public, pg_temp;
alter function public.upsert_attendance_daily_from_event(uuid, text, timestamptz, text, integer, boolean) set search_path = public, pg_temp;

do $$
begin
  if exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'rls_auto_enable') then
    execute 'alter function public.rls_auto_enable() set search_path = public, pg_temp';
    execute 'revoke execute on function public.rls_auto_enable() from anon';
    execute 'revoke execute on function public.rls_auto_enable() from public';
    execute 'revoke execute on function public.rls_auto_enable() from authenticated';
  end if;
end $$;

revoke execute on function public.audit_row_change() from anon;
revoke execute on function public.calculate_late_minutes(uuid, timestamptz) from anon;
revoke execute on function public.can_access_employee(uuid) from anon;
revoke execute on function public.current_employee_id() from anon;
revoke execute on function public.current_is_full_access() from anon;
revoke execute on function public.current_profile() from anon;
revoke execute on function public.current_role_permissions() from anon;
revoke execute on function public.handle_new_auth_user() from anon;
revoke execute on function public.has_permission(text) from anon;
revoke execute on function public.upsert_attendance_daily_from_event(uuid, text, timestamptz, text, integer, boolean) from anon;

revoke execute on function public.audit_row_change() from public;
revoke execute on function public.calculate_late_minutes(uuid, timestamptz) from public;
revoke execute on function public.can_access_employee(uuid) from public;
revoke execute on function public.current_employee_id() from public;
revoke execute on function public.current_is_full_access() from public;
revoke execute on function public.current_profile() from public;
revoke execute on function public.current_role_permissions() from public;
revoke execute on function public.handle_new_auth_user() from public;
revoke execute on function public.has_permission(text) from public;
revoke execute on function public.upsert_attendance_daily_from_event(uuid, text, timestamptz, text, integer, boolean) from public;

grant execute on function public.calculate_late_minutes(uuid, timestamptz) to authenticated;
grant execute on function public.can_access_employee(uuid) to authenticated;
grant execute on function public.current_employee_id() to authenticated;
grant execute on function public.current_is_full_access() to authenticated;
grant execute on function public.current_profile() to authenticated;
grant execute on function public.current_role_permissions() to authenticated;
grant execute on function public.has_permission(text) to authenticated;
grant execute on function public.upsert_attendance_daily_from_event(uuid, text, timestamptz, text, integer, boolean) to authenticated;

revoke execute on function public.audit_row_change() from authenticated;
revoke execute on function public.handle_new_auth_user() from authenticated;

drop policy if exists "avatars_public_read" on storage.objects;

drop index if exists public.idx_employees_email;
drop index if exists public.idx_employees_phone;


-- END PATCH: 008_supabase_cli_advisor_hardening.sql


-- =========================================================
-- BEGIN PATCH: 009_passkey_attendance_activation.sql
-- =========================================================

-- Activate browser passkey attendance fields and refresh PostgREST schema cache.

alter table public.attendance_events
  add column if not exists passkey_credential_id text;

alter table public.attendance_events
  add column if not exists passkey_verified_at timestamptz;

create index if not exists idx_attendance_events_passkey_credential
  on public.attendance_events(passkey_credential_id)
  where passkey_credential_id is not null;

select pg_notify('pgrst', 'reload schema');


-- END PATCH: 009_passkey_attendance_activation.sql


-- =========================================================
-- BEGIN PATCH: 010_simplify_employee_users_remove_payroll_gps_production.sql
-- =========================================================

-- =========================================================
-- 010 - ØªØ¨Ø³ÙŠØ· Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ† ÙˆØ§Ù„Ù…Ø³ØªØ®Ø¯Ù…ÙŠÙ† + Ø­Ø°Ù ØµÙ„Ø§Ø­ÙŠØ§Øª Ø§Ù„Ø±ÙˆØ§ØªØ¨ + Ø¶Ø¨Ø· GPS Ù„Ù„Ø¥Ù†ØªØ§Ø¬
-- Ù„Ø§ ÙŠØ­Ø°Ù .git Ø£Ùˆ supabase/.temp Ø£Ùˆ 004_emergency_admin_access.sql
-- =========================================================

-- 1) Ø­Ø°Ù ØµÙ„Ø§Ø­ÙŠØ§Øª Ø§Ù„Ø±ÙˆØ§ØªØ¨ Ù…Ù† Ù†Ø¸Ø§Ù… Ø§Ù„ØµÙ„Ø§Ø­ÙŠØ§Øª Ù„Ø£Ù†Ù‡Ø§ Ù„Ù… ØªØ¹Ø¯ Ù…Ø³ØªØ®Ø¯Ù…Ø© ÙÙŠ Ø§Ù„ÙˆØ§Ø¬Ù‡Ø©.
delete from public.permissions where scope = 'payroll:manage';

do $$
declare
  permissions_type text;
begin
  select udt_name
  into permissions_type
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'roles'
    and column_name = 'permissions';

  if permissions_type = '_text' then
    update public.roles
    set permissions = array_remove(permissions, 'payroll:manage')
    where permissions::text ilike '%payroll%';
  elsif permissions_type = 'jsonb' then
    update public.roles
    set permissions = case
      when jsonb_typeof(permissions) = 'array' then (
        select coalesce(jsonb_agg(value), '[]'::jsonb)
        from jsonb_array_elements(permissions) as value
        where trim(both '"' from value::text) <> 'payroll:manage'
      )
      when jsonb_typeof(permissions) = 'object' then permissions - 'payroll:manage' - 'payroll'
      else permissions
    end
    where permissions::text ilike '%payroll%';
  end if;
end $$;

-- Ø¥Ø²Ø§Ù„Ø© ØªÙƒØ§Ù…Ù„Ø§Øª Ø§Ù„Ø±ÙˆØ§ØªØ¨ Ø§Ù„Ù‚Ø¯ÙŠÙ…Ø© Ù…Ù† Ø´Ø§Ø´Ø© Ø§Ù„ØªÙƒØ§Ù…Ù„Ø§Øª Ø¥Ù† ÙƒØ§Ù†Øª Ù…ÙˆØ¬ÙˆØ¯Ø©.
delete from public.integration_settings
where key ilike '%payroll%'
   or provider ilike '%payroll%'
   or name ilike '%Payroll%'
   or name ilike '%Ø±ÙˆØ§ØªØ¨%';

-- 2) Ø¶Ø¨Ø· GPS Ù„Ù„Ø¥Ù†ØªØ§Ø¬: Ù†Ø·Ø§Ù‚ Ø§Ù„Ù…Ø¬Ù…Ø¹ 300 Ù…ØªØ±ØŒ ÙˆØ£Ù‚ØµÙ‰ Ø¯Ù‚Ø© GPS Ù…Ù‚Ø¨ÙˆÙ„Ø© 500 Ù…ØªØ±.
update public.branches
set
  name = 'Ù…Ø¬Ù…Ø¹ Ù…Ù†ÙŠÙ„ Ø´ÙŠØ­Ø©',
  address = 'Ù…Ø¬Ù…Ø¹ Ù…Ù†ÙŠÙ„ Ø´ÙŠØ­Ø© - Ø§Ù„Ø¬ÙŠØ²Ø©',
  latitude = 29.95109939158933,
  longitude = 31.238741920853883,
  geofence_radius_meters = 300,
  max_accuracy_meters = 500,
  active = true,
  is_deleted = false
where name ilike '%Ù…Ù†ÙŠÙ„%' or code in ('MAIN', 'AHLA-MANIL');

-- Ø¨Ø¹Ø¶ Ø§Ù„Ù†Ø³Ø® Ù„Ø¯ÙŠÙ‡Ø§ Ø£Ø¹Ù…Ø¯Ø© Ø¥Ø¶Ø§ÙÙŠØ© ÙÙŠ complexes Ù…Ù† Patches Ø³Ø§Ø¨Ù‚Ø©Ø› Ù†Ø­Ø¯Ø«Ù‡Ø§ ÙÙ‚Ø· Ù„Ùˆ Ù…ÙˆØ¬ÙˆØ¯Ø©.
do $$
begin
  update public.complexes
  set name = 'Ù…Ø¬Ù…Ø¹ Ù…Ù†ÙŠÙ„ Ø´ÙŠØ­Ø©', active = true, is_deleted = false
  where name ilike '%Ù…Ù†ÙŠÙ„%' or code in ('AHLA-MANIL', 'CX-AHLA-MANIL');

  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='complexes' and column_name='address') then
    execute $sql$update public.complexes set address = 'Ù…Ø¬Ù…Ø¹ Ù…Ù†ÙŠÙ„ Ø´ÙŠØ­Ø© - Ø§Ù„Ø¬ÙŠØ²Ø©' where name ilike '%Ù…Ù†ÙŠÙ„%' or code in ('AHLA-MANIL', 'CX-AHLA-MANIL')$sql$;
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='complexes' and column_name='latitude') then
    execute $sql$update public.complexes set latitude = 29.95109939158933 where name ilike '%Ù…Ù†ÙŠÙ„%' or code in ('AHLA-MANIL', 'CX-AHLA-MANIL')$sql$;
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='complexes' and column_name='longitude') then
    execute $sql$update public.complexes set longitude = 31.238741920853883 where name ilike '%Ù…Ù†ÙŠÙ„%' or code in ('AHLA-MANIL', 'CX-AHLA-MANIL')$sql$;
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='complexes' and column_name='radius_meters') then
    execute $sql$update public.complexes set radius_meters = 300 where name ilike '%Ù…Ù†ÙŠÙ„%' or code in ('AHLA-MANIL', 'CX-AHLA-MANIL')$sql$;
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='complexes' and column_name='max_accuracy_meters') then
    execute $sql$update public.complexes set max_accuracy_meters = 500 where name ilike '%Ù…Ù†ÙŠÙ„%' or code in ('AHLA-MANIL', 'CX-AHLA-MANIL')$sql$;
  end if;
end $$;

-- 3) Ø¥Ø²Ø§Ù„Ø© Ø§Ù„Ø§Ø¹ØªÙ…Ø§Ø¯ Ø§Ù„Ø¹Ù…Ù„ÙŠ Ø¹Ù„Ù‰ ÙƒÙˆØ¯ Ø§Ù„Ù…ÙˆØ¸Ù ÙˆØ§Ù„Ø¯ÙˆØ§Ù… Ø§Ù„Ù…Ù†ÙØµÙ„ ÙÙŠ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø¬Ø¯ÙŠØ¯Ø©.
alter table if exists public.employees alter column employee_code drop not null;
update public.employees set employee_code = null where employee_code is not null;

do $$
begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='employees' and column_name='shift_id') then
    execute 'update public.employees set shift_id = null';
  end if;
end $$;

-- 4) ØªØ«Ø¨ÙŠØª Ø§Ù„Ø­Ø§Ù„Ø© Active Ù„ÙƒÙ„ Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ† Ù„Ø£Ù† Ø§Ù„Ù†Ø¸Ø§Ù… Ø§Ù„Ø­Ø§Ù„ÙŠ Ù„Ø§ ÙŠØ­ØªØ§Ø¬ Ø­Ø§Ù„Ø§Øª Ù…ØªØ¹Ø¯Ø¯Ø© Ù„Ù„Ù…ÙˆØ¸Ù.
update public.employees
set status = 'ACTIVE', is_active = true, is_deleted = false
where coalesce(is_deleted, false) = false;

-- 5) Ø­Ø°Ù trigger Ù‚Ø¯ÙŠÙ… ÙƒØ§Ù† ÙŠØ¹ÙŠØ¯ ØªÙˆÙ„ÙŠØ¯ employee_code Ø¥Ù† ÙˆÙØ¬Ø¯.
drop trigger if exists trg_employee_defaults_single_branch on public.employees;
drop function if exists public.employee_defaults_single_branch();

-- 6) ØªØ¨Ø³ÙŠØ· profiles: Ø¥Ø¨Ù‚Ø§Ø¡ Ø§Ù„Ø±Ø¨Ø· ÙˆØ§Ù„ØµÙ„Ø§Ø­ÙŠØ§ØªØŒ Ø¨Ø¯ÙˆÙ† ÙØ±Ø¶ ÙØ±Ø¹/Ù‚Ø³Ù… Ø¸Ø§Ù‡Ø± Ù„Ù„Ù…Ø³ØªØ®Ø¯Ù….
update public.profiles
set status = coalesce(status, 'ACTIVE')
where id is not null;

do $$
begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='is_active') then
    execute 'update public.profiles set is_active = true';
  end if;
end $$;


-- END PATCH: 010_simplify_employee_users_remove_payroll_gps_production.sql


-- =========================================================
-- BEGIN PATCH: 011_advanced_uiux_diagnostics_autolink.sql
-- =========================================================

-- =========================================================
-- 011 Advanced UI/UX diagnostics + single complex settings + rejected punch logging support
-- Safe patch for testing. Does not delete .git, .temp, or emergency admin files.
-- =========================================================

-- 1) Single complex/branch production coordinates
update public.branches
set
  name = 'Ù…Ø¬Ù…Ø¹ Ù…Ù†ÙŠÙ„ Ø´ÙŠØ­Ø©',
  address = 'Ù…Ø¬Ù…Ø¹ Ù…Ù†ÙŠÙ„ Ø´ÙŠØ­Ø© - Ø§Ù„Ø¬ÙŠØ²Ø©',
  latitude = 29.95109939158933,
  longitude = 31.238741920853883,
  geofence_radius_meters = 300,
  max_accuracy_meters = 500,
  active = true,
  is_deleted = false,
  updated_at = now()
where id = (select id from public.branches order by created_at nulls last limit 1);

insert into public.branches (code, name, address, latitude, longitude, geofence_radius_meters, max_accuracy_meters, active, is_deleted)
select 'AHLA-MANIL', 'Ù…Ø¬Ù…Ø¹ Ù…Ù†ÙŠÙ„ Ø´ÙŠØ­Ø©', 'Ù…Ø¬Ù…Ø¹ Ù…Ù†ÙŠÙ„ Ø´ÙŠØ­Ø© - Ø§Ù„Ø¬ÙŠØ²Ø©', 29.95109939158933, 31.238741920853883, 300, 500, true, false
where not exists (select 1 from public.branches);

update public.complexes
set name = 'Ù…Ø¬Ù…Ø¹ Ù…Ù†ÙŠÙ„ Ø´ÙŠØ­Ø©', active = true, is_deleted = false, updated_at = now()
where id = (select id from public.complexes order by created_at nulls last limit 1);

insert into public.complexes (code, name, active, is_deleted)
select 'CX-AHLA-MANIL', 'Ù…Ø¬Ù…Ø¹ Ù…Ù†ÙŠÙ„ Ø´ÙŠØ­Ø©', true, false
where not exists (select 1 from public.complexes);

-- 2) Auto-link profiles to employees by matching e-mail.
update public.profiles p
set
  employee_id = e.id,
  full_name = coalesce(nullif(p.full_name, ''), e.full_name),
  role_id = coalesce(p.role_id, e.role_id),
  branch_id = coalesce(p.branch_id, e.branch_id),
  department_id = coalesce(p.department_id, e.department_id),
  governorate_id = coalesce(p.governorate_id, e.governorate_id),
  complex_id = coalesce(p.complex_id, e.complex_id),
  status = 'ACTIVE',
  updated_at = now()
from public.employees e
where lower(p.email) = lower(e.email)
  and (p.employee_id is null or p.employee_id <> e.id);

update public.employees e
set user_id = p.id, updated_at = now()
from public.profiles p
where p.employee_id = e.id
  and (e.user_id is null or e.user_id <> p.id);

-- 3) Ensure rejected punch rows can be reviewed through attendance_events.
-- This table already supports status='REJECTED', requires_review=true, geofence_status, distance, and accuracy.
create index if not exists idx_attendance_events_rejected_review
on public.attendance_events (requires_review, status, event_at desc)
where requires_review = true or status = 'REJECTED';

-- 4) Keep all employees active in this simplified single-branch model.
update public.employees
set status = 'ACTIVE', is_active = true, is_deleted = false, updated_at = now()
where is_deleted is distinct from true;



-- END PATCH: 011_advanced_uiux_diagnostics_autolink.sql


-- =========================================================
-- BEGIN PATCH: 012_strong_features_review_devices_reports_demo.sql
-- =========================================================

-- =========================================================
-- Patch 012 â€” Strong HR Features
-- Ù…Ø±Ø§Ø¬Ø¹Ø© Ø§Ù„Ø¨ØµÙ…Ø§Øª Ø§Ù„Ù…Ø±ÙÙˆØ¶Ø© + Ø§Ù„Ø£Ø¬Ù‡Ø²Ø© Ø§Ù„Ù…Ø¹ØªÙ…Ø¯Ø© + Ø§Ù„ØªÙ‚Ø§Ø±ÙŠØ± + Ø³Ø¬Ù„ Ø§Ù„Ø£Ù…Ø§Ù†
-- ÙŠØ­Ø§ÙØ¸ Ø¹Ù„Ù‰ Ù…Ù„ÙØ§Øª Ø§Ù„Ø§Ø®ØªØ¨Ø§Ø± ÙˆØ§Ù„Ø·ÙˆØ§Ø±Ø¦ ÙˆÙ„Ø§ ÙŠØ­Ø°Ù Ø£ÙŠ Ø¨ÙŠØ§Ù†Ø§Øª.
-- =========================================================

-- 1) ØªÙˆØ³ÙŠØ¹ Ø¬Ø¯ÙˆÙ„ Ø§Ù„Ø­Ø¶ÙˆØ± Ù„Ø¯Ø¹Ù… Ù…Ø±Ø§Ø¬Ø¹Ø© Ø§Ù„Ø¨ØµÙ…Ø§Øª Ø§Ù„Ù…Ø±ÙÙˆØ¶Ø©
alter table if exists public.attendance_events
  add column if not exists review_decision text,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by_user_id uuid,
  add column if not exists biometric_method text,
  add column if not exists passkey_credential_id uuid,
  add column if not exists risk_flags jsonb default '[]'::jsonb;

create index if not exists idx_attendance_events_rejected_review
  on public.attendance_events (status, requires_review, event_at desc);

create index if not exists idx_attendance_events_month_employee
  on public.attendance_events (employee_id, event_at desc);

-- 2) ØªÙˆØ³ÙŠØ¹ passkey_credentials Ù„Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø£Ø¬Ù‡Ø²Ø© Ø§Ù„Ù…Ø¹ØªÙ…Ø¯Ø©
alter table if exists public.passkey_credentials
  add column if not exists employee_id uuid references public.employees(id) on delete set null,
  add column if not exists label text,
  add column if not exists platform text,
  add column if not exists user_agent text,
  add column if not exists trusted boolean default true,
  add column if not exists status text default 'DEVICE_TRUSTED',
  add column if not exists trusted_at timestamptz,
  add column if not exists disabled_at timestamptz,
  add column if not exists last_used_at timestamptz;

create index if not exists idx_passkey_credentials_employee_status
  on public.passkey_credentials (employee_id, status);

-- 3) Ø±Ø¨Ø· Ø§Ù„Ø£Ø¬Ù‡Ø²Ø© Ø¨Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…/Ø§Ù„Ù…ÙˆØ¸Ù Ø¥Ù† ÙƒØ§Ù†Øª Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù‚Ø¯ÙŠÙ…Ø© Ù„Ø§ ØªØ­ØªÙˆÙŠ employee_id
update public.passkey_credentials pc
set employee_id = p.employee_id
from public.profiles p
where pc.employee_id is null
  and pc.user_id = p.id
  and p.employee_id is not null;

-- 4) ØµÙ„Ø§Ø­ÙŠØ§Øª Ø§Ù„ØµÙØ­Ø§Øª Ø§Ù„Ø¬Ø¯ÙŠØ¯Ø©
insert into public.permissions (scope, name, description)
values
  ('attendance:review', 'Ù…Ø±Ø§Ø¬Ø¹Ø© Ø§Ù„Ø¨ØµÙ…Ø§Øª Ø§Ù„Ù…Ø±ÙÙˆØ¶Ø©', 'Ø§Ø¹ØªÙ…Ø§Ø¯ Ø£Ùˆ Ø±ÙØ¶ Ù…Ø­Ø§ÙˆÙ„Ø§Øª Ø§Ù„Ø¨ØµÙ…Ø© Ø§Ù„Ù…Ø±ÙÙˆØ¶Ø©'),
  ('devices:manage', 'Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø£Ø¬Ù‡Ø²Ø© Ø§Ù„Ù…Ø¹ØªÙ…Ø¯Ø©', 'Ø§Ø¹ØªÙ…Ø§Ø¯ ÙˆØªØ¹Ø·ÙŠÙ„ Ù…ÙØ§ØªÙŠØ­ Ø§Ù„Ù…Ø±ÙˆØ± ÙˆØ£Ø¬Ù‡Ø²Ø© Ø§Ù„Ø¨ØµÙ…Ø©'),
  ('security:view', 'Ø¹Ø±Ø¶ Ø³Ø¬Ù„ Ø§Ù„Ø£Ù…Ø§Ù†', 'Ù…Ø±Ø§Ø¬Ø¹Ø© Ø§Ù„Ø¯Ø®ÙˆÙ„ Ø§Ù„ÙØ§Ø´Ù„ ÙˆØªØºÙŠÙŠØ± ÙƒÙ„Ù…Ø§Øª Ø§Ù„Ù…Ø±ÙˆØ±'),
  ('demo:manage', 'Ø¥Ø¯Ø§Ø±Ø© ÙˆØ¶Ø¹ Ø§Ù„ØªØ¯Ø±ÙŠØ¨', 'ØªØ´ØºÙŠÙ„ ÙˆØ¶Ø¹ ØªØ¯Ø±ÙŠØ¨ Ù…Ø­Ù„ÙŠ Ø¯ÙˆÙ† Ø§Ù„ØªØ£Ø«ÙŠØ± Ø¹Ù„Ù‰ Supabase')
on conflict (scope) do update
set name = excluded.name,
    description = excluded.description;

-- 5) Ù…Ù†Ø­ Ø§Ù„Ù…Ø¯ÙŠØ±ÙŠÙ†/HR ØµÙ„Ø§Ø­ÙŠØ© Ù…Ø±Ø§Ø¬Ø¹Ø© Ø§Ù„Ø¨ØµÙ…Ø§ØªØŒ Ù…Ø¹ ØªØ±Ùƒ Ø§Ù„Ø£Ø¯Ù…Ù† ÙƒÙ…Ø§ Ù‡Ùˆ
do $$
declare
  permissions_type text;
begin
  select udt_name
  into permissions_type
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'roles'
    and column_name = 'permissions';

  if permissions_type = '_text' then
    update public.roles
    set permissions = (
      select array_agg(distinct value)
      from unnest(coalesce(permissions, '{}'::text[]) || array['attendance:review']) as value
    )
    where lower(coalesce(slug, key, name, '')) in ('direct-manager','manager','hr-manager','hr');
  elsif permissions_type = 'jsonb' then
    update public.roles
    set permissions = (
      select jsonb_agg(distinct value)
      from jsonb_array_elements_text(coalesce(permissions, '[]'::jsonb) || '["attendance:review"]'::jsonb) as value
    )
    where lower(coalesce(slug, key, name, '')) in ('direct-manager','manager','hr-manager','hr');
  end if;
end $$;

-- 6) Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø§ÙØªØ±Ø§Ø¶ÙŠØ© Ù„Ù„ØªÙ†Ø¨ÙŠÙ‡Ø§Øª ÙˆØ§Ù„ØªÙ‚Ø±ÙŠØ± Ø§Ù„Ø´Ù‡Ø±ÙŠ
insert into public.integration_settings (key, name, provider, enabled, status, notes)
values
  ('missing_punch_alerts', 'ØªÙ†Ø¨ÙŠÙ‡Ø§Øª Ø¹Ø¯Ù… ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¨ØµÙ…Ø©', 'internal', true, 'READY', 'ØªÙ†Ø¨ÙŠÙ‡ Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ† Ø§Ù„Ø°ÙŠÙ† Ù„Ù… ÙŠØ³Ø¬Ù„ÙˆØ§ Ø­Ø¶ÙˆØ± Ø§Ù„ÙŠÙˆÙ…'),
  ('monthly_attendance_report', 'Ø§Ù„ØªÙ‚Ø±ÙŠØ± Ø§Ù„Ø´Ù‡Ø±ÙŠ Ø¨ØªØµÙ…ÙŠÙ… Ø§Ù„Ø¬Ù…Ø¹ÙŠØ©', 'internal-print', true, 'READY', 'PDF Ø¹Ø¨Ø± Ù†Ø§ÙØ°Ø© Ø§Ù„Ø·Ø¨Ø§Ø¹Ø© Ù…Ù† Ø§Ù„Ù…ØªØµÙØ­')
on conflict (key) do update
set enabled = excluded.enabled,
    status = excluded.status,
    notes = excluded.notes;

-- 7) ØªØ«Ø¨ÙŠØª Ø¥Ø­Ø¯Ø§Ø«ÙŠØ§Øª Ù…Ø¬Ù…Ø¹ Ù…Ù†ÙŠÙ„ Ø´ÙŠØ­Ø©
update public.branches
set name = 'Ù…Ø¬Ù…Ø¹ Ù…Ù†ÙŠÙ„ Ø´ÙŠØ­Ø©',
    address = 'Ù…Ø¬Ù…Ø¹ Ù…Ù†ÙŠÙ„ Ø´ÙŠØ­Ø© - Ø§Ù„Ø¬ÙŠØ²Ø©',
    latitude = 29.95109939158933,
    longitude = 31.238741920853883,
    geofence_radius_meters = 300,
    max_accuracy_meters = 500,
    active = true
where id in (select id from public.branches order by created_at nulls last limit 1);


-- END PATCH: 012_strong_features_review_devices_reports_demo.sql


-- =========================================================
-- BEGIN PATCH: 013_phone_login_identifier.sql
-- =========================================================

-- =========================================================
-- 013 Phone Login Identifier Resolver
-- Allows the frontend to accept phone number OR email at login.
-- =========================================================

alter table if exists public.profiles add column if not exists phone text;

create or replace function public.normalize_egypt_phone(input_phone text)
returns text
language sql
immutable
as $$
  with cleaned as (
    select regexp_replace(coalesce(input_phone, ''), '[^0-9]', '', 'g') as digits
  )
  select case
    when digits = '' then ''
    when digits like '0020%' then '0' || substring(digits from 5)
    when digits like '20%' and length(digits) >= 12 then '0' || substring(digits from 3)
    when digits like '1%' and length(digits) = 10 then '0' || digits
    else digits
  end
  from cleaned;
$$;

create or replace function public.resolve_login_identifier(login_identifier text)
returns text
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_identifier text := trim(coalesce(login_identifier, ''));
  v_phone text := public.normalize_egypt_phone(login_identifier);
  v_email text;
begin
  if v_identifier = '' then
    return null;
  end if;

  if position('@' in v_identifier) > 0 then
    return lower(v_identifier);
  end if;

  select lower(coalesce(e.email, au.email))
    into v_email
  from public.employees e
  left join auth.users au on au.id = e.user_id
  where e.is_deleted is not true
    and coalesce(e.is_active, true) is true
    and coalesce(e.status, 'ACTIVE') in ('ACTIVE', 'INVITED')
    and public.normalize_egypt_phone(e.phone) = v_phone
    and coalesce(e.email, au.email) is not null
  order by e.updated_at desc nulls last, e.created_at desc nulls last
  limit 1;

  if v_email is null then
    select lower(au.email)
      into v_email
    from public.profiles p
    join auth.users au on au.id = p.id
    where coalesce(p.status, 'ACTIVE') in ('ACTIVE', 'INVITED')
      and public.normalize_egypt_phone(coalesce(p.phone, '')) = v_phone
    order by p.updated_at desc nulls last, p.created_at desc nulls last
    limit 1;
  end if;

  return v_email;
end;
$$;

revoke all on function public.resolve_login_identifier(text) from public;
grant execute on function public.resolve_login_identifier(text) to authenticated;
grant execute on function public.resolve_login_identifier(text) to service_role;

create index if not exists idx_employees_phone_normalized on public.employees (public.normalize_egypt_phone(phone));
create index if not exists idx_profiles_phone_normalized on public.profiles (public.normalize_egypt_phone(phone));


-- END PATCH: 013_phone_login_identifier.sql


-- =========================================================
-- BEGIN PATCH: 014_location_schema_contact_and_precise_coordinates.sql
-- =========================================================

-- =========================================================
-- 014 - Fix employee location payload compatibility + contact fields + precise coordinates
-- Date: 28 Apr 2026
-- =========================================================

-- Keep high precision for the exact Google Maps coordinates supplied by operations.
alter table if exists public.branches
  alter column latitude type numeric(18,15) using latitude::numeric,
  alter column longitude type numeric(18,15) using longitude::numeric;

alter table if exists public.employees
  alter column last_location_latitude type numeric(18,15) using last_location_latitude::numeric,
  alter column last_location_longitude type numeric(18,15) using last_location_longitude::numeric;

alter table if exists public.attendance_events
  alter column latitude type numeric(18,15) using latitude::numeric,
  alter column longitude type numeric(18,15) using longitude::numeric;

alter table if exists public.employee_locations
  alter column latitude type numeric(18,15) using latitude::numeric,
  alter column longitude type numeric(18,15) using longitude::numeric;

alter table if exists public.employee_locations
  add column if not exists accuracy_meters numeric(10,2);

alter table if exists public.profiles
  add column if not exists phone text;

-- The frontend now sends accuracy_meters only. This patch intentionally does not add an
-- accuracy column, so bad payloads keep failing instead of hiding schema drift.
update public.branches
set name = 'Ù…Ø¬Ù…Ø¹ Ù…Ù†ÙŠÙ„ Ø´ÙŠØ­Ø©',
    address = 'Ø´Ø§Ø±Ø¹ Ù…Ø²Ù„Ù‚Ø§Ù† Ø§Ù„Ø¹Ø±Ø¨, Manil Shihah, Abu El Numrus, Giza Governorate 12912',
    latitude = 29.951196809090636,
    longitude = 31.238367688465857,
    geofence_radius_meters = 300,
    max_accuracy_meters = 500,
    active = true,
    is_deleted = false,
    updated_at = now()
where code in ('MAIN', 'AHLA-MANIL')
   or name ilike '%Ù…Ù†ÙŠÙ„%';

insert into public.branches (code, name, address, latitude, longitude, geofence_radius_meters, max_accuracy_meters, active, is_deleted)
select 'AHLA-MANIL',
       'Ù…Ø¬Ù…Ø¹ Ù…Ù†ÙŠÙ„ Ø´ÙŠØ­Ø©',
       'Ø´Ø§Ø±Ø¹ Ù…Ø²Ù„Ù‚Ø§Ù† Ø§Ù„Ø¹Ø±Ø¨, Manil Shihah, Abu El Numrus, Giza Governorate 12912',
       29.951196809090636,
       31.238367688465857,
       300,
       500,
       true,
       false
where not exists (select 1 from public.branches where code in ('MAIN', 'AHLA-MANIL') or name ilike '%Ù…Ù†ÙŠÙ„%');

do $$
begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='complexes' and column_name='address') then
    execute $sql$
      update public.complexes
      set address = 'Ø´Ø§Ø±Ø¹ Ù…Ø²Ù„Ù‚Ø§Ù† Ø§Ù„Ø¹Ø±Ø¨, Manil Shihah, Abu El Numrus, Giza Governorate 12912'
      where name ilike '%Ù…Ù†ÙŠÙ„%' or code in ('AHLA-MANIL', 'CX-AHLA-MANIL')
    $sql$;
  end if;

  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='complexes' and column_name='latitude') then
    execute $sql$
      update public.complexes
      set latitude = 29.951196809090636
      where name ilike '%Ù…Ù†ÙŠÙ„%' or code in ('AHLA-MANIL', 'CX-AHLA-MANIL')
    $sql$;
  end if;

  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='complexes' and column_name='longitude') then
    execute $sql$
      update public.complexes
      set longitude = 31.238367688465857
      where name ilike '%Ù…Ù†ÙŠÙ„%' or code in ('AHLA-MANIL', 'CX-AHLA-MANIL')
    $sql$;
  end if;
end $$;

-- Keep phone login lookup fast after contact edits.
create index if not exists idx_employees_phone_normalized on public.employees (public.normalize_egypt_phone(phone));
create index if not exists idx_profiles_phone_normalized on public.profiles (public.normalize_egypt_phone(phone));


-- END PATCH: 014_location_schema_contact_and_precise_coordinates.sql


-- =========================================================
-- BEGIN PATCH: 015_critical_security_hardening.sql
-- =========================================================

-- =========================================================
-- 015 Critical Security Hardening
-- - Restrict phone login resolver RPC from anon browser access.
-- - Keep audit logs tamper-resistant.
-- - Normalize passkey credential column type.
-- =========================================================

revoke all on function public.resolve_login_identifier(text) from public;
revoke execute on function public.resolve_login_identifier(text) from anon;
grant execute on function public.resolve_login_identifier(text) to authenticated;
grant execute on function public.resolve_login_identifier(text) to service_role;

drop policy if exists "audit_insert_auth" on public.audit_logs;
revoke insert on public.audit_logs from authenticated;

alter table if exists public.attendance_events
  alter column passkey_credential_id type text using passkey_credential_id::text;


-- Phone login resolver rate-limit storage. Edge Function writes with service_role only.
create table if not exists public.login_identifier_attempts (
  id uuid primary key default gen_random_uuid(),
  ip_hash text not null,
  identifier_hash text not null,
  attempts integer not null default 1,
  blocked_until timestamptz,
  last_attempt_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(ip_hash, identifier_hash)
);

alter table public.login_identifier_attempts enable row level security;
drop policy if exists "login_identifier_attempts_service_only" on public.login_identifier_attempts;
create policy "login_identifier_attempts_service_only" on public.login_identifier_attempts for all to service_role using (true) with check (true);
create index if not exists idx_login_identifier_attempts_last on public.login_identifier_attempts(last_attempt_at desc);

alter table if exists public.profiles add column if not exists phone text;
alter table if exists public.attachments
  add column if not exists bucket_id text default '',
  add column if not exists storage_path text default '',
  alter column url set default '';


-- END PATCH: 015_critical_security_hardening.sql


-- =========================================================
-- BEGIN PATCH: 016_import_employee_roster_from_excel.sql
-- =========================================================

-- =========================================================
-- 016 Safe Employee Roster Import Template
-- ØªÙ… ØªÙ†Ø¸ÙŠÙ Ù‡Ø°Ø§ Ø§Ù„Ù…Ù„Ù Ù…Ù† Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ† Ø§Ù„Ø­Ù‚ÙŠÙ‚ÙŠØ© ÙˆÙ…Ù† ØµÙŠØºØ© ÙƒÙ„Ù…Ø§Øª Ø§Ù„Ù…Ø±ÙˆØ± Ø§Ù„Ù…ØªÙˆÙ‚Ø¹Ø©.
-- Ù„Ø§ ØªØ³ØªØ®Ø¯Ù… ÙƒÙ„Ù…Ø§Øª Ù…Ø±ÙˆØ± Ù…Ø¨Ù†ÙŠØ© Ø¹Ù„Ù‰ Ø±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ. Ø§Ø³ØªØ®Ø¯Ù… Edge Function admin-create-user
-- Ù„Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ø­Ø³Ø§Ø¨Ø§Øª Ø¨ÙƒÙ„Ù…Ø§Øª Ù…Ø±ÙˆØ± Ø¹Ø´ÙˆØ§Ø¦ÙŠØ©ØŒ Ø£Ùˆ Ø£Ø±Ø³Ù„ Ø¯Ø¹ÙˆØ§Øª/Ø±ÙˆØ§Ø¨Ø· Ø¥Ø¹Ø§Ø¯Ø© ØªØ¹ÙŠÙŠÙ† Ø¢Ù…Ù†Ø©.
-- =========================================================

-- Ø·Ø±ÙŠÙ‚Ø© Ø§Ù„Ø§Ø³ØªØ®Ø¯Ø§Ù… Ø§Ù„Ø¢Ù…Ù†Ø©:
-- 1) Ø§Ø³ØªÙˆØ±Ø¯ Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ† ÙÙ‚Ø· Ø¥Ù„Ù‰ public.employees Ø¨Ø¹Ø¯ Ù…Ø±Ø§Ø¬Ø¹Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª.
-- 2) Ø£Ù†Ø´Ø¦ Ø­Ø³Ø§Ø¨Ø§Øª Ø§Ù„Ø¯Ø®ÙˆÙ„ Ù…Ù† Ù„ÙˆØ­Ø© Ø§Ù„Ø¥Ø¯Ø§Ø±Ø© Ø£Ùˆ Ù…Ù† Edge Function admin-create-user.
-- 3) Ù„Ø§ ØªØ­ÙØ¸ Ù…Ù„Ù Excel Ø§Ù„Ø­Ù‚ÙŠÙ‚ÙŠ Ø¯Ø§Ø®Ù„ Ø§Ù„Ù…Ø³ØªÙˆØ¯Ø¹ Ø£Ùˆ Ù†Ø³Ø®Ø© Ø§Ù„ØªØ³Ù„ÙŠÙ….

create extension if not exists pgcrypto;

alter table if exists public.profiles add column if not exists phone text;

-- Ù…Ø«Ø§Ù„ ØªØ¬Ø±ÙŠØ¨ÙŠ ÙÙ‚Ø·. Ø§Ø­Ø°Ù Ù‡Ø°Ø§ Ø§Ù„Ù…Ø«Ø§Ù„ Ù‚Ø¨Ù„ Ø¥Ø¯Ø®Ø§Ù„ Ø¨ÙŠØ§Ù†Ø§Øª Ø­Ù‚ÙŠÙ‚ÙŠØ©.
insert into public.employees (
  employee_code,
  full_name,
  phone,
  email,
  job_title,
  role_id,
  branch_id,
  department_id,
  governorate_id,
  complex_id,
  shift_id,
  status,
  is_active,
  is_deleted,
  hire_date
)
select
  'EMP-DEMO-001',
  'Ù…ÙˆØ¸Ù ØªØ¬Ø±Ø¨Ø© Ø¢Ù…Ù†',
  'PHONE_PLACEHOLDER_001',
  'demo.employee@ahla-shabab.local',
  'Ù…ÙˆØ¸Ù ØªØ¬Ø±Ø¨Ø©',
  (select id from public.roles where slug = 'employee' limit 1),
  (select id from public.branches where code = 'MAIN' limit 1),
  (select id from public.departments where code = 'OPS' limit 1),
  (select id from public.governorates where code = 'GZ' limit 1),
  (select id from public.complexes where code = 'AHLA-MANIL' limit 1),
  (select id from public.shifts order by name limit 1),
  'ACTIVE',
  true,
  false,
  current_date
where not exists (select 1 from public.employees where employee_code = 'EMP-DEMO-001');

-- Ø¥Ù†Ø´Ø§Ø¡ Ù…Ø³ØªØ®Ø¯Ù… Auth ÙŠØªÙ… Ù…Ù† Ù„ÙˆØ­Ø© Ø§Ù„Ø¥Ø¯Ø§Ø±Ø© / Edge FunctionØŒ ÙˆÙ„ÙŠØ³ Ù…Ù† SQL Ù…Ø¨Ø§Ø´Ø± Ø¯Ø§Ø®Ù„ auth.users.


-- END PATCH: 016_import_employee_roster_from_excel.sql


-- =========================================================
-- BEGIN PATCH: 017_completion_pack_tables.sql
-- =========================================================

-- =========================================================
-- Completion Pack Tables
-- Executive report schedules, announcement log, and backup metadata.
-- Run after 001_schema_rls_seed.sql and security patches.
-- =========================================================

create table if not exists public.report_schedules (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  report_key text not null default 'employees',
  frequency text not null default 'MONTHLY',
  format text not null default 'CSV',
  recipients text[] not null default '{}',
  is_active boolean not null default true,
  last_run_at timestamptz,
  next_run_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.employee_announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null default '',
  target_scope text not null default 'ALL',
  target_value text default '',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.system_backups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  backup_type text not null default 'MANUAL',
  summary jsonb not null default '{}',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.report_schedules enable row level security;
alter table public.employee_announcements enable row level security;
alter table public.system_backups enable row level security;

drop policy if exists "report_schedules_full" on public.report_schedules;
create policy "report_schedules_full" on public.report_schedules
  for all to authenticated
  using (public.current_is_full_access() or public.has_permission('reports:view'))
  with check (public.current_is_full_access());

drop policy if exists "employee_announcements_read" on public.employee_announcements;
create policy "employee_announcements_read" on public.employee_announcements
  for select to authenticated
  using (true);

drop policy if exists "employee_announcements_write" on public.employee_announcements;
create policy "employee_announcements_write" on public.employee_announcements
  for all to authenticated
  using (public.current_is_full_access())
  with check (public.current_is_full_access());

drop policy if exists "system_backups_full" on public.system_backups;
create policy "system_backups_full" on public.system_backups
  for all to authenticated
  using (public.current_is_full_access())
  with check (public.current_is_full_access());

create index if not exists idx_report_schedules_active on public.report_schedules(is_active, frequency);
create index if not exists idx_employee_announcements_created_at on public.employee_announcements(created_at desc);
create index if not exists idx_system_backups_created_at on public.system_backups(created_at desc);


-- END PATCH: 017_completion_pack_tables.sql


-- =========================================================
-- BEGIN PATCH: 018_ahla_shabab_org_hierarchy.sql
-- =========================================================

-- =========================================================
-- 018 Ahla Shabab Organization Hierarchy
-- Ø§Ù„Ù‡ÙŠÙƒÙ„ Ø§Ù„Ø¥Ø¯Ø§Ø±ÙŠ Ø­Ø³Ø¨ ÙˆØµÙ Ø§Ù„Ø¬Ù…Ø¹ÙŠØ©.
-- Ù„Ø§ ÙŠÙ†Ø´Ø¦ Ø­Ø³Ø§Ø¨Ø§Øª Auth ÙˆÙ„Ø§ ÙƒÙ„Ù…Ø§Øª Ù…Ø±ÙˆØ±. Ø§Ù„Ø­Ø³Ø§Ø¨Ø§Øª ØªÙ†Ø´Ø£ Ù…Ù† Ù„ÙˆØ­Ø© Ø§Ù„Ø¥Ø¯Ø§Ø±Ø©/Edge Function.
-- =========================================================

create extension if not exists pgcrypto;

alter table if exists public.employees
  add column if not exists manager_employee_id uuid references public.employees(id) on delete set null;

alter table if exists public.departments
  add column if not exists manager_employee_id uuid references public.employees(id) on delete set null;

insert into public.departments (code, name, branch_id, manager_employee_id)
select d.code, d.name, b.id, null
from (values
  ('EXEC', 'Ø§Ù„Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠØ©'),
  ('MGT', 'Ø§Ù„Ø¥Ø´Ø±Ø§Ù ÙˆØ§Ù„Ù…Ø¯ÙŠØ±ÙˆÙ† Ø§Ù„Ù…Ø¨Ø§Ø´Ø±ÙˆÙ†'),
  ('OPS', 'ÙØ±Ù‚ Ø§Ù„ØªØ´ØºÙŠÙ„ ÙˆØ§Ù„Ø®Ø¯Ù…Ø§Øª'),
  ('HR', 'Ø§Ù„Ù…ÙˆØ§Ø±Ø¯ Ø§Ù„Ø¨Ø´Ø±ÙŠØ©')
) as d(code, name)
cross join public.branches b
where b.code = 'MAIN'
on conflict (code) do update set name = excluded.name, branch_id = excluded.branch_id;

with roster(employee_code, full_name, phone, email, job_title, role_slug, department_code, manager_code, hire_date) as (
  values
  ('EMP-001', 'Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ', 'PHONE_PLACEHOLDER_021', 'executive.director@organization.local', 'Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ', 'executive', 'EXEC', '', '2020-01-01'),
  ('EMP-002', 'Ø§Ù„Ø³ÙƒØ±ØªÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ', 'PHONE_PLACEHOLDER_022', 'executive.secretary@organization.local', 'Ø§Ù„Ø³ÙƒØ±ØªÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ', 'executive-secretary', 'EXEC', 'EMP-001', '2021-01-01'),
  ('EMP-003', 'Ù…Ø¯ÙŠØ± Ù…Ø¨Ø§Ø´Ø± Ø±Ø§Ø¨Ø¹', 'PHONE_PLACEHOLDER_023', 'direct.manager.04@organization.local', 'Ù…Ø¯ÙŠØ± Ù…Ø¨Ø§Ø´Ø±', 'manager', 'MGT', 'EMP-001', '2021-02-01'),
  ('EMP-004', 'Ù…Ø¯ÙŠØ± Ù…Ø¨Ø§Ø´Ø± Ø£ÙˆÙ„', 'PHONE_PLACEHOLDER_024', 'direct.manager.01@organization.local', 'Ù…Ø¯ÙŠØ± Ù…Ø¨Ø§Ø´Ø±', 'manager', 'MGT', 'EMP-001', '2021-02-01'),
  ('EMP-005', 'Ù…Ø¯ÙŠØ± Ù…Ø¨Ø§Ø´Ø± Ø«Ø§Ù†Ù', 'PHONE_PLACEHOLDER_025', 'direct.manager.02@organization.local', 'Ù…Ø¯ÙŠØ± Ù…Ø¨Ø§Ø´Ø±', 'manager', 'MGT', 'EMP-001', '2021-02-01'),
  ('EMP-006', 'Ù…Ø¯ÙŠØ± Ù…Ø¨Ø§Ø´Ø± Ø«Ø§Ù„Ø«', 'PHONE_PLACEHOLDER_026', 'direct.manager.03@organization.local', 'Ù…Ø¯ÙŠØ± Ù…Ø¨Ø§Ø´Ø±', 'manager', 'MGT', 'EMP-001', '2021-02-01'),
  ('EMP-007', 'Ù…ÙˆØ¸Ù ØªØ´ØºÙŠÙ„ÙŠ 01', 'PHONE_PLACEHOLDER_027', 'employee.001@organization.local', 'Ù…Ø¯ÙŠØ± Ù…Ø¨Ø§Ø´Ø±', 'manager', 'MGT', 'EMP-001', '2021-02-01'),
  ('EMP-008', 'Ù…ÙˆØ¸Ù ØªØ´ØºÙŠÙ„ÙŠ 18', 'PHONE_PLACEHOLDER_028', 'employee.017@organization.local', 'Ù…Ø¯ÙŠØ± Ù…Ø¨Ø§Ø´Ø±', 'manager', 'MGT', 'EMP-001', '2021-02-01'),
  ('EMP-009', 'Ù…ÙˆØ¸Ù ØªØ´ØºÙŠÙ„ÙŠ 14', 'PHONE_PLACEHOLDER_029', 'direct.manager.07@organization.local', 'Ù…Ø¯ÙŠØ± Ù…Ø¨Ø§Ø´Ø±', 'manager', 'MGT', 'EMP-001', '2021-02-01'),
  ('EMP-010', 'Ù…ÙˆØ¸Ù ØªØ´ØºÙŠÙ„ÙŠ 07', 'PHONE_PLACEHOLDER_030', 'employee.006@organization.local', 'Ù…ÙˆØ¸Ù ÙØ±ÙŠÙ‚ Ù…Ø¯ÙŠØ± Ù…Ø¨Ø§Ø´Ø± Ø«Ø§Ù„Ø«', 'employee', 'OPS', 'EMP-006', '2022-01-01'),
  ('EMP-011', 'Ù…ÙˆØ¸Ù ØªØ´ØºÙŠÙ„ÙŠ 08', 'PHONE_PLACEHOLDER_031', 'employee.007@organization.local', 'Ù…ÙˆØ¸Ù ÙØ±ÙŠÙ‚ Ù…Ø¯ÙŠØ± Ù…Ø¨Ø§Ø´Ø± Ø«Ø§Ù„Ø«', 'employee', 'OPS', 'EMP-006', '2022-01-01'),
  ('EMP-012', 'Ù…ÙˆØ¸Ù ØªØ´ØºÙŠÙ„ÙŠ 04', 'PHONE_PLACEHOLDER_032', 'direct.manager.08@organization.local', 'Ù…Ø´Ø±Ù Ù…Ø¨Ø§Ø´Ø±', 'manager', 'MGT', 'EMP-006', '2022-01-01'),
  ('EMP-013', 'Ù…ÙˆØ¸Ù ØªØ´ØºÙŠÙ„ÙŠ 05', 'PHONE_PLACEHOLDER_033', 'employee.004@organization.local', 'Ù…ÙˆØ¸Ù ØªØ­Øª Ø¥Ø´Ø±Ø§Ù Ù…Ø¨Ø§Ø´Ø±', 'employee', 'OPS', 'EMP-012', '2022-01-01'),
  ('EMP-014', 'Ù…ÙˆØ¸Ù ØªØ´ØºÙŠÙ„ÙŠ 13', 'PHONE_PLACEHOLDER_034', 'abdullah.hussein@ahla-shabab.local', 'Ù…ÙˆØ¸Ù ÙØ±ÙŠÙ‚ Ù…Ø¯ÙŠØ± Ù…Ø¨Ø§Ø´Ø± Ø±Ø§Ø¨Ø¹', 'employee', 'OPS', 'EMP-003', '2022-01-01'),
  ('EMP-015', 'Ù…ÙˆØ¸Ù ØªØ´ØºÙŠÙ„ÙŠ 06', 'PHONE_PLACEHOLDER_035', 'employee.005@organization.local', 'Ù…ÙˆØ¸Ù ÙØ±ÙŠÙ‚ Ù…Ø¯ÙŠØ± Ù…Ø¨Ø§Ø´Ø± Ø±Ø§Ø¨Ø¹', 'employee', 'OPS', 'EMP-003', '2022-01-01'),
  ('EMP-016', 'Ù…ÙˆØ¸Ù ØªØ´ØºÙŠÙ„ÙŠ 16', 'PHONE_PLACEHOLDER_036', 'employee.015@organization.local', 'Ù…ÙˆØ¸Ù ÙØ±ÙŠÙ‚ Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„Ù…Ø¨Ø§Ø´Ø± Ø§Ù„Ø³Ø§Ø¨Ø¹', 'employee', 'OPS', 'EMP-009', '2022-01-01'),
  ('EMP-017', 'Ù…ÙˆØ¸Ù ØªØ´ØºÙŠÙ„ÙŠ 10', 'PHONE_PLACEHOLDER_037', 'employee.009@organization.local', 'Ù…ÙˆØ¸Ù ÙØ±ÙŠÙ‚ Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„Ù…Ø¨Ø§Ø´Ø± Ø§Ù„Ø³Ø§Ø¨Ø¹', 'employee', 'OPS', 'EMP-009', '2022-01-01'),
  ('EMP-018', 'Ù…ÙˆØ¸Ù ØªØ´ØºÙŠÙ„ÙŠ 15', 'PHONE_PLACEHOLDER_038', 'employee.014@organization.local', 'Ù…ÙˆØ¸Ù ÙØ±ÙŠÙ‚ Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„Ù…Ø¨Ø§Ø´Ø± Ø§Ù„Ø³Ø§Ø¨Ø¹', 'employee', 'OPS', 'EMP-009', '2022-01-01'),
  ('EMP-019', 'Ù…ÙˆØ¸Ù ØªØ´ØºÙŠÙ„ÙŠ 17', 'PHONE_PLACEHOLDER_039', 'employee.016@organization.local', 'Ù…ÙˆØ¸Ù ÙØ±ÙŠÙ‚ Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„Ù…Ø¨Ø§Ø´Ø± Ø§Ù„Ø£ÙˆÙ„', 'employee', 'OPS', 'EMP-004', '2022-01-01'),
  ('EMP-020', 'Ù…ÙˆØ¸Ù ØªØ´ØºÙŠÙ„ÙŠ 11', 'PHONE_PLACEHOLDER_040', 'employee.010@organization.local', 'Ù…ÙˆØ¸Ù ÙØ±ÙŠÙ‚ Ù…ÙˆØ¸Ù ØªØ´ØºÙŠÙ„ÙŠ 18', 'employee', 'OPS', 'EMP-008', '2022-01-01'),
  ('EMP-021', 'Ù…ÙˆØ¸Ù ØªØ´ØºÙŠÙ„ÙŠ 12', 'PHONE_PLACEHOLDER_041', 'employee.011@organization.local', 'Ù…ÙˆØ¸Ù ÙØ±ÙŠÙ‚ Ù…ÙˆØ¸Ù ØªØ´ØºÙŠÙ„ÙŠ 18', 'employee', 'OPS', 'EMP-008', '2022-01-01'),
  ('EMP-022', 'Ù…ÙˆØ¸Ù ØªØ´ØºÙŠÙ„ÙŠ 03', 'PHONE_PLACEHOLDER_042', 'employee.002@organization.local', 'Ù…ÙˆØ¸Ù ÙØ±ÙŠÙ‚ Ù…ÙˆØ¸Ù ØªØ´ØºÙŠÙ„ÙŠ 18', 'employee', 'OPS', 'EMP-008', '2022-01-01'),
  ('EMP-023', 'Ù…ÙˆØ¸Ù ØªØ´ØºÙŠÙ„ÙŠ 09', 'PHONE_PLACEHOLDER_043', 'tarek.ibrahim@ahla-shabab.local', 'Ù…ÙˆØ¸Ù ÙØ±ÙŠÙ‚ Ù…ÙˆØ¸Ù ØªØ´ØºÙŠÙ„ÙŠ 18', 'employee', 'OPS', 'EMP-008', '2022-01-01')
), upserted as (
  insert into public.employees (
    employee_code, full_name, phone, email, job_title, role_id, branch_id, department_id,
    governorate_id, complex_id, shift_id, status, is_active, is_deleted, hire_date
  )
  select
    r.employee_code,
    r.full_name,
    r.phone,
    r.email,
    r.job_title,
    (select id from public.roles where slug = r.role_slug limit 1),
    (select id from public.branches where code = 'MAIN' limit 1),
    (select id from public.departments where code = r.department_code limit 1),
    (select id from public.governorates where code = 'GZ' limit 1),
    (select id from public.complexes where code = 'AHLA-MANIL' limit 1),
    (select id from public.shifts order by name limit 1),
    'ACTIVE', true, false, r.hire_date::date
  from roster r
  on conflict (employee_code) do update set
    full_name = excluded.full_name,
    phone = excluded.phone,
    email = excluded.email,
    job_title = excluded.job_title,
    role_id = excluded.role_id,
    branch_id = excluded.branch_id,
    department_id = excluded.department_id,
    governorate_id = excluded.governorate_id,
    complex_id = excluded.complex_id,
    status = 'ACTIVE',
    is_active = true,
    is_deleted = false,
    hire_date = excluded.hire_date,
    updated_at = now()
  returning employee_code, id
), roster_again as (
  select * from roster
)
update public.employees e
set manager_employee_id = mgr.id,
    updated_at = now()
from roster_again r
left join public.employees mgr on mgr.employee_code = r.manager_code
where e.employee_code = r.employee_code;

update public.departments d set manager_employee_id = e.id
from public.employees e
where (d.code = 'EXEC' and e.employee_code = 'EMP-001')
   or (d.code = 'MGT' and e.employee_code = 'EMP-001')
   or (d.code = 'OPS' and e.employee_code = 'EMP-006')
   or (d.code = 'HR' and e.employee_code = 'EMP-002');

create or replace function public.can_access_employee(emp_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with recursive team(id) as (
    select public.current_employee_id()
    union all
    select e.id
    from public.employees e
    join team t on e.manager_employee_id = t.id
    where coalesce(e.is_deleted, false) = false
  )
  select coalesce(
    public.current_is_full_access()
    or emp_id in (select id from team),
    false
  );
$$;

comment on function public.can_access_employee(uuid) is 'ÙŠØ¹Ø·ÙŠ Ø§Ù„Ù…Ø¯ÙŠØ± ØµÙ„Ø§Ø­ÙŠØ© Ù‚Ø±Ø§Ø¡Ø© ÙØ±ÙŠÙ‚Ù‡ Ø§Ù„ÙƒØ§Ù…Ù„ Ø¹Ø¨Ø± ÙƒÙ„ Ø§Ù„Ù…Ø³ØªÙˆÙŠØ§Øª Ø§Ù„Ø¥Ø¯Ø§Ø±ÙŠØ©.';


-- END PATCH: 018_ahla_shabab_org_hierarchy.sql


-- =========================================================
-- BEGIN PATCH: 019_stability_passwords_disputes_requests.sql
-- =========================================================

-- =========================================================
-- 019 Stability Pack: request payload compatibility, dispute committee workflow,
-- and temporary-password reset support notes.
-- =========================================================

-- Ù„Ø¬Ù†Ø© Ø­Ù„ Ø§Ù„Ù…Ø´Ø§ÙƒÙ„ ÙˆØ§Ù„Ø®Ù„Ø§ÙØ§Øª Ø­Ø³Ø¨ Ø§Ù„Ù‡ÙŠÙƒÙ„ Ø§Ù„Ø¥Ø¯Ø§Ø±ÙŠ:
-- Ù…Ø¯ÙŠØ± Ù…Ø¨Ø§Ø´Ø± Ø«Ø§Ù„Ø« + Ù…Ø¯ÙŠØ± Ù…Ø¨Ø§Ø´Ø± Ø«Ø§Ù†Ù + Ù…Ø¯ÙŠØ± Ù…Ø¨Ø§Ø´Ø± Ø£ÙˆÙ„ + Ø§Ù„Ø³ÙƒØ±ØªÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ + Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ.
-- ÙŠØªÙ… Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª Ù…Ù† Ø§Ù„ØªØ·Ø¨ÙŠÙ‚ Ø¹Ù†Ø¯ Ø¥Ù†Ø´Ø§Ø¡ dispute_casesØŒ ÙˆÙ‡Ø°Ø§ Ø§Ù„Ù€ patch ÙŠØ¶ÙŠÙ Ø­Ù‚ÙˆÙ„Ù‹Ø§ Ù…Ø³Ø§Ø¹Ø¯Ø© Ø¥Ù† Ù„Ù… ØªÙƒÙ† Ù…ÙˆØ¬ÙˆØ¯Ø©.

alter table if exists public.dispute_cases
  add column if not exists assigned_committee_employee_ids uuid[] default '{}',
  add column if not exists escalation_path text default 'Ø§Ù„Ù„Ø¬Ù†Ø© â† Ø§Ù„Ø³ÙƒØ±ØªÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ â† Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ',
  add column if not exists resolved_at timestamptz;

alter table if exists public.leave_requests
  add column if not exists workflow jsonb not null default '[]'::jsonb;

alter table if exists public.missions
  add column if not exists workflow jsonb not null default '[]'::jsonb;

-- ØªÙˆØ§ÙÙ‚ Ù…Ø¹ Ø§Ù„ÙˆØ§Ø¬Ù‡Ø© Ø¹Ù†Ø¯ Ø¥Ø¯Ø®Ø§Ù„ Ø·Ù„Ø¨Ø§Øª Ø§Ù„Ø¥Ø¬Ø§Ø²Ø© Ø£Ùˆ Ø§Ù„Ù…Ø£Ù…ÙˆØ±ÙŠØ§Øª Ù…Ù† ØªØ·Ø¨ÙŠÙ‚ Ø§Ù„Ù…ÙˆØ¸Ù.
create index if not exists idx_leave_requests_employee_status on public.leave_requests(employee_id, status);
create index if not exists idx_missions_employee_status on public.missions(employee_id, status);
create index if not exists idx_dispute_cases_employee_status on public.dispute_cases(employee_id, status);

-- Ù…Ù„Ø§Ø­Ø¸Ø© Ø£Ù…Ø§Ù†:
-- Supabase Auth Ù„Ø§ ÙŠØ³Ù…Ø­ Ø¨Ù‚Ø±Ø§Ø¡Ø© ÙƒÙ„Ù…Ø§Øª Ø§Ù„Ù…Ø±ÙˆØ± Ø§Ù„Ø£ØµÙ„ÙŠØ©ØŒ ÙˆÙ‡Ø°Ø§ ØµØ­ÙŠØ­ Ø£Ù…Ù†ÙŠÙ‹Ø§.
-- Ø®Ø²Ù†Ø© ÙƒÙ„Ù…Ø§Øª Ø§Ù„Ù…Ø±ÙˆØ± ÙÙŠ Ø§Ù„ÙˆØ§Ø¬Ù‡Ø© ØªØ¹Ø±Ø¶ ÙƒÙ„Ù…Ø§Øª Ø§Ù„Ù…Ø±ÙˆØ± Ø§Ù„Ù…Ø¤Ù‚ØªØ© ÙÙŠ Ø§Ù„ÙˆØ¶Ø¹ Ø§Ù„Ù…Ø­Ù„ÙŠ ÙÙ‚Ø·ØŒ
-- Ø£Ù…Ø§ ÙÙŠ Ø§Ù„Ø¥Ù†ØªØ§Ø¬ ÙÙŠØªÙ… Ø¥ØµØ¯Ø§Ø± ÙƒÙ„Ù…Ø© Ù…Ø¤Ù‚ØªØ© Ø¬Ø¯ÙŠØ¯Ø© Ø¹Ø¨Ø± Edge Function admin-update-user.


-- END PATCH: 019_stability_passwords_disputes_requests.sql


-- =========================================================
-- BEGIN PATCH: 020_full_operations_pack.sql
-- =========================================================

-- =========================================================
-- 020 Full Operations Pack
-- Ù…Ù‡Ø§Ù… Ø¯Ø§Ø®Ù„ÙŠØ© + Ù…Ø³ØªÙ†Ø¯Ø§Øª Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ† + Ø£Ø±ØµØ¯Ø© Ø§Ù„Ø¥Ø¬Ø§Ø²Ø§Øª + Ù‚Ø±Ø§Ø¡Ø§Øª Ø§Ù„Ø¥Ø¹Ù„Ø§Ù†Ø§Øª
-- Ø´ØºÙ‘Ù„ Ø¨Ø¹Ø¯ 019_stability_passwords_disputes_requests.sql
-- =========================================================

create extension if not exists pgcrypto;

insert into public.permissions (scope, name) values
  ('tasks:manage', 'Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ù…Ù‡Ø§Ù… Ø§Ù„Ø¯Ø§Ø®Ù„ÙŠØ©'),
  ('documents:manage', 'Ø¥Ø¯Ø§Ø±Ø© Ù…Ø³ØªÙ†Ø¯Ø§Øª Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ†'),
  ('leave:balance', 'Ø¥Ø¯Ø§Ø±Ø© Ø£Ø±ØµØ¯Ø© Ø§Ù„Ø¥Ø¬Ø§Ø²Ø§Øª'),
  ('announcements:manage', 'Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø¥Ø¹Ù„Ø§Ù†Ø§Øª ÙˆØ§Ù„Ù‚Ø±Ø§Ø¡Ø©'),
  ('executive:report', 'Ø§Ù„ØªÙ‚Ø±ÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ Ø§Ù„Ù…Ø®ØªØµØ±'),
  ('permissions:matrix', 'Ø¥Ø¯Ø§Ø±Ø© Ù…ØµÙÙˆÙØ© Ø§Ù„ØµÙ„Ø§Ø­ÙŠØ§Øª'),
  ('tasks:self', 'Ù…ØªØ§Ø¨Ø¹Ø© Ù…Ù‡Ø§Ù…ÙŠ'),
  ('documents:self', 'Ù…ØªØ§Ø¨Ø¹Ø© Ù…Ø³ØªÙ†Ø¯Ø§ØªÙŠ'),
  ('requests:self', 'Ù…ØªØ§Ø¨Ø¹Ø© Ø·Ù„Ø¨Ø§ØªÙŠ')
on conflict (scope) do update set name = excluded.name;

update public.roles
set permissions = array(select distinct unnest(coalesce(permissions, '{}') || array['tasks:self','documents:self','requests:self']))
where slug = 'employee';

update public.roles
set permissions = array['*']
where slug in ('admin','executive','executive-secretary','hr-manager');

create table if not exists public.leave_balances (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  annual_total numeric not null default 21,
  casual_total numeric not null default 7,
  sick_total numeric not null default 15,
  used_days numeric not null default 0,
  remaining_days numeric not null default 28,
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(employee_id)
);

create table if not exists public.employee_tasks (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  assigned_by_employee_id uuid references public.employees(id) on delete set null,
  title text not null,
  description text default '',
  priority text not null default 'MEDIUM',
  status text not null default 'OPEN',
  due_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.employee_documents (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  title text not null,
  document_type text not null default 'OTHER',
  status text not null default 'ACTIVE',
  file_name text default '',
  file_url text default '',
  expires_on date,
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.announcement_reads (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid references public.notifications(id) on delete cascade,
  employee_id uuid references public.employees(id) on delete cascade,
  read_at timestamptz not null default now(),
  unique(notification_id, employee_id)
);

create table if not exists public.policy_acknowledgements (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  policy_key text not null,
  policy_title text not null,
  acknowledged_at timestamptz not null default now(),
  unique(employee_id, policy_key)
);

create index if not exists idx_leave_balances_employee on public.leave_balances(employee_id);
create index if not exists idx_employee_tasks_employee_status on public.employee_tasks(employee_id, status);
create index if not exists idx_employee_tasks_due on public.employee_tasks(due_date);
create index if not exists idx_employee_documents_employee on public.employee_documents(employee_id);
create index if not exists idx_employee_documents_expiry on public.employee_documents(expires_on);

alter table public.leave_balances enable row level security;
alter table public.employee_tasks enable row level security;
alter table public.employee_documents enable row level security;
alter table public.announcement_reads enable row level security;
alter table public.policy_acknowledgements enable row level security;

-- Employee scoped policies
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['leave_balances','employee_tasks','employee_documents','policy_acknowledgements'] LOOP
    EXECUTE format('drop policy if exists "%1$s_read_scope" on public.%1$I', t);
    EXECUTE format('drop policy if exists "%1$s_insert_scope" on public.%1$I', t);
    EXECUTE format('drop policy if exists "%1$s_update_scope" on public.%1$I', t);
    EXECUTE format('drop policy if exists "%1$s_delete_full" on public.%1$I', t);
    EXECUTE format('create policy "%1$s_read_scope" on public.%1$I for select to authenticated using (public.can_access_employee(employee_id) or public.current_is_full_access())', t);
    EXECUTE format('create policy "%1$s_insert_scope" on public.%1$I for insert to authenticated with check (public.current_is_full_access() or employee_id = public.current_employee_id() or public.has_permission(''tasks:manage'') or public.has_permission(''documents:manage'') or public.has_permission(''leave:balance''))', t);
    EXECUTE format('create policy "%1$s_update_scope" on public.%1$I for update to authenticated using (public.current_is_full_access() or public.can_access_employee(employee_id)) with check (public.current_is_full_access() or public.can_access_employee(employee_id))', t);
    EXECUTE format('create policy "%1$s_delete_full" on public.%1$I for delete to authenticated using (public.current_is_full_access())', t);
  END LOOP;
END $$;

drop policy if exists "announcement_reads_scope" on public.announcement_reads;
create policy "announcement_reads_scope" on public.announcement_reads for all to authenticated
using (public.current_is_full_access() or employee_id = public.current_employee_id())
with check (public.current_is_full_access() or employee_id = public.current_employee_id());

-- View used by executive reporting / BI tools
create or replace view public.v_employee_operations_summary as
select
  e.id as employee_id,
  e.full_name,
  e.status,
  e.manager_employee_id,
  coalesce(lb.remaining_days, 28) as leave_remaining_days,
  count(distinct t.id) filter (where t.status <> 'DONE') as open_tasks,
  count(distinct d.id) filter (where d.expires_on is not null and d.expires_on <= current_date + interval '30 days') as expiring_documents
from public.employees e
left join public.leave_balances lb on lb.employee_id = e.id
left join public.employee_tasks t on t.employee_id = e.id
left join public.employee_documents d on d.employee_id = e.id
group by e.id, e.full_name, e.status, e.manager_employee_id, lb.remaining_days;


-- END PATCH: 020_full_operations_pack.sql


-- =========================================================
-- BEGIN PATCH: 021_quality_workflow_policy_center.sql
-- =========================================================

-- =========================================================
-- 021 Quality / Workflow / Policy Center
-- Adds operational hardening tables for maintenance runs, SLA escalations,
-- employee policies, policy acknowledgements, and committee actions.
-- Safe to run more than once.
-- =========================================================

create extension if not exists pgcrypto;

create table if not exists public.employee_policies (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default 'GENERAL',
  version text not null default '1.0',
  body text not null default '',
  requires_acknowledgement boolean not null default true,
  status text not null default 'ACTIVE' check (status in ('DRAFT','ACTIVE','ARCHIVED')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.policy_acknowledgements (
  id uuid primary key default gen_random_uuid(),
  policy_id uuid not null references public.employee_policies(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  policy_version text,
  acknowledged_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(policy_id, employee_id)
);

create table if not exists public.workflow_escalations (
  id uuid primary key default gen_random_uuid(),
  fingerprint text unique,
  source_kind text not null,
  source_id uuid,
  employee_id uuid references public.employees(id) on delete set null,
  target_employee_ids uuid[] not null default '{}',
  reason text not null default '',
  status text not null default 'OPEN' check (status in ('OPEN','CLOSED','IGNORED')),
  created_by_user_id uuid references auth.users(id) on delete set null,
  closed_by_user_id uuid references auth.users(id) on delete set null,
  closed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.maintenance_runs (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'Maintenance Run',
  before_score numeric,
  after_score numeric,
  repair jsonb not null default '{}'::jsonb,
  workflow jsonb not null default '{}'::jsonb,
  created_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.committee_actions (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.dispute_cases(id) on delete cascade,
  employee_id uuid references public.employees(id) on delete set null,
  action_type text not null default 'NOTE',
  decision text not null default '',
  note text not null default '',
  created_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_policy_ack_employee on public.policy_acknowledgements(employee_id);
create index if not exists idx_workflow_escalations_status on public.workflow_escalations(status, created_at desc);
create index if not exists idx_maintenance_runs_created on public.maintenance_runs(created_at desc);
create index if not exists idx_committee_actions_case on public.committee_actions(case_id, created_at desc);

alter table public.employee_policies enable row level security;
alter table public.policy_acknowledgements enable row level security;
alter table public.workflow_escalations enable row level security;
alter table public.maintenance_runs enable row level security;
alter table public.committee_actions enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_is_full_access();
$$;

drop policy if exists employee_policies_select on public.employee_policies;
create policy employee_policies_select on public.employee_policies
for select using (status <> 'ARCHIVED' or public.is_admin());

drop policy if exists employee_policies_admin_write on public.employee_policies;
create policy employee_policies_admin_write on public.employee_policies
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists policy_ack_select on public.policy_acknowledgements;
create policy policy_ack_select on public.policy_acknowledgements
for select using (public.is_admin() or employee_id = public.current_employee_id());

drop policy if exists policy_ack_insert_self on public.policy_acknowledgements;
create policy policy_ack_insert_self on public.policy_acknowledgements
for insert with check (public.is_admin() or employee_id = public.current_employee_id());

drop policy if exists policy_ack_update_admin on public.policy_acknowledgements;
create policy policy_ack_update_admin on public.policy_acknowledgements
for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists workflow_escalations_admin on public.workflow_escalations;
create policy workflow_escalations_admin on public.workflow_escalations
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists maintenance_runs_admin on public.maintenance_runs;
create policy maintenance_runs_admin on public.maintenance_runs
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists committee_actions_select on public.committee_actions;
create policy committee_actions_select on public.committee_actions
for select using (
  public.is_admin()
  or employee_id = public.current_employee_id()
  or exists (
    select 1 from public.dispute_cases dc
    where dc.id = committee_actions.case_id
      and dc.employee_id = public.current_employee_id()
  )
);

drop policy if exists committee_actions_insert_committee on public.committee_actions;
create policy committee_actions_insert_committee on public.committee_actions
for insert with check (public.is_admin() or employee_id = public.current_employee_id());

insert into public.employee_policies (id, title, category, version, body, requires_acknowledgement, status)
values
  ('00000000-0000-0000-0000-000000021001', 'Ø³ÙŠØ§Ø³Ø© Ø§Ù„Ø­Ø¶ÙˆØ± ÙˆØ§Ù„Ø§Ù†ØµØ±Ø§Ù', 'ATTENDANCE', '1.0', 'Ø§Ù„Ø§Ù„ØªØ²Ø§Ù… Ø¨ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø­Ø¶ÙˆØ± ÙˆØ§Ù„Ø§Ù†ØµØ±Ø§Ù Ù…Ù† Ø§Ù„Ù…ÙˆÙ‚Ø¹ Ø§Ù„Ù…Ø¹ØªÙ…Ø¯ØŒ ÙˆØ£ÙŠ Ø¨ØµÙ…Ø© Ø®Ø§Ø±Ø¬ Ø§Ù„Ù†Ø·Ø§Ù‚ ØªØ­ØªØ§Ø¬ Ù…Ø±Ø§Ø¬Ø¹Ø© Ø§Ù„Ø¥Ø¯Ø§Ø±Ø©.', true, 'ACTIVE'),
  ('00000000-0000-0000-0000-000000021002', 'Ø³ÙŠØ§Ø³Ø© Ù„Ø¬Ù†Ø© Ø­Ù„ Ø§Ù„Ù…Ø´Ø§ÙƒÙ„ ÙˆØ§Ù„Ø®Ù„Ø§ÙØ§Øª', 'DISPUTES', '1.0', 'ØªÙØ±ÙØ¹ Ø§Ù„Ø´ÙƒØ§ÙˆÙ‰ Ø¥Ù„Ù‰ Ø§Ù„Ù„Ø¬Ù†Ø© Ø§Ù„Ù…Ø®ØªØµØ©ØŒ ÙˆÙŠØªÙ… Ø§Ù„ØªÙ†Ø³ÙŠÙ‚ Ø£Ùˆ Ø§Ù„ØªØµØ¹ÙŠØ¯ Ù„Ù„Ù…Ø¯ÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ Ø¹Ø¨Ø± Ø§Ù„Ø³ÙƒØ±ØªÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ Ø¹Ù†Ø¯ Ø§Ù„Ø­Ø§Ø¬Ø©.', true, 'ACTIVE'),
  ('00000000-0000-0000-0000-000000021003', 'Ø³ÙŠØ§Ø³Ø© Ø­Ù…Ø§ÙŠØ© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª ÙˆÙƒÙ„Ù…Ø§Øª Ø§Ù„Ù…Ø±ÙˆØ±', 'SECURITY', '1.0', 'ÙƒÙ„Ù…Ø§Øª Ø§Ù„Ù…Ø±ÙˆØ± Ø§Ù„Ù…Ø¤Ù‚ØªØ© Ù„Ø§ ØªÙØ´Ø§Ø±Ùƒ Ø¥Ù„Ø§ Ù…Ø¹ ØµØ§Ø­Ø¨ Ø§Ù„Ø­Ø³Ø§Ø¨ØŒ ÙˆÙŠØ¬Ø¨ ØªØºÙŠÙŠØ±Ù‡Ø§ Ø¨Ø¹Ø¯ Ø£ÙˆÙ„ Ø¯Ø®ÙˆÙ„. Ù„Ø§ ÙŠØªÙ… ØªØ¯Ø§ÙˆÙ„ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ† Ø®Ø§Ø±Ø¬ Ø§Ù„Ù†Ø¸Ø§Ù….', true, 'ACTIVE')
on conflict (id) do update set
  title = excluded.title,
  category = excluded.category,
  version = excluded.version,
  body = excluded.body,
  requires_acknowledgement = excluded.requires_acknowledgement,
  status = excluded.status,
  updated_at = now();


-- END PATCH: 021_quality_workflow_policy_center.sql


-- =========================================================
-- BEGIN PATCH: 022_control_room_data_center_daily_reports.sql
-- =========================================================

-- =========================================================
-- 022 Control Room + Data Center + Daily Reports
-- Adds operational monitoring, smart alerts, safe import logs, and employee daily reports.
-- Run after 021_quality_workflow_policy_center.sql
-- =========================================================

create table if not exists public.daily_reports (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references public.employees(id) on delete cascade,
  report_date date not null default current_date,
  achievements text not null default '',
  blockers text not null default '',
  tomorrow_plan text not null default '',
  support_needed text not null default '',
  mood text not null default 'NORMAL',
  status text not null default 'SUBMITTED',
  manager_comment text not null default '',
  reviewed_at timestamptz,
  reviewed_by_user_id uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(employee_id, report_date)
);

create table if not exists public.smart_alerts (
  id uuid primary key default gen_random_uuid(),
  fingerprint text unique not null,
  severity text not null default 'MEDIUM',
  title text not null,
  body text not null default '',
  route text not null default 'quality-center',
  status text not null default 'OPEN',
  target_employee_ids uuid[] not null default '{}',
  resolution_note text not null default '',
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.import_batches (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'json',
  employees_count int not null default 0,
  users_count int not null default 0,
  warnings jsonb not null default '[]'::jsonb,
  created_by_user_id uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.approval_chains (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid,
  current_step text not null default 'MANAGER',
  status text not null default 'PENDING',
  steps jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.system_runbooks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default 'GENERAL',
  steps jsonb not null default '[]'::jsonb,
  status text not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.daily_reports enable row level security;
alter table public.smart_alerts enable row level security;
alter table public.import_batches enable row level security;
alter table public.approval_chains enable row level security;
alter table public.system_runbooks enable row level security;

create or replace function public.has_permission(user_id uuid, scope text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when scope = '*' then public.current_is_full_access()
    when user_id = auth.uid() then public.has_permission(scope)
    else false
  end;
$$;

do $$
begin
  create policy "daily_reports_self_or_admin" on public.daily_reports
    for all using (
      employee_id in (select employee_id from public.profiles where id = auth.uid())
      or public.has_permission(auth.uid(), 'daily-report:review')
      or public.has_permission(auth.uid(), '*')
    ) with check (
      employee_id in (select employee_id from public.profiles where id = auth.uid())
      or public.has_permission(auth.uid(), 'daily-report:review')
      or public.has_permission(auth.uid(), '*')
    );
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy "smart_alerts_admin" on public.smart_alerts
    for all using (public.has_permission(auth.uid(), 'alerts:manage') or public.has_permission(auth.uid(), 'control-room:view') or public.has_permission(auth.uid(), '*'))
    with check (public.has_permission(auth.uid(), 'alerts:manage') or public.has_permission(auth.uid(), '*'));
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy "import_batches_admin" on public.import_batches
    for all using (public.has_permission(auth.uid(), 'data-center:manage') or public.has_permission(auth.uid(), '*'))
    with check (public.has_permission(auth.uid(), 'data-center:manage') or public.has_permission(auth.uid(), '*'));
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy "approval_chains_admin" on public.approval_chains
    for all using (public.has_permission(auth.uid(), 'approvals:manage') or public.has_permission(auth.uid(), '*'))
    with check (public.has_permission(auth.uid(), 'approvals:manage') or public.has_permission(auth.uid(), '*'));
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy "system_runbooks_admin_read" on public.system_runbooks
    for select using (public.has_permission(auth.uid(), 'settings:manage') or public.has_permission(auth.uid(), '*'));
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy "system_runbooks_admin_write" on public.system_runbooks
    for all using (public.has_permission(auth.uid(), 'settings:manage') or public.has_permission(auth.uid(), '*'))
    with check (public.has_permission(auth.uid(), 'settings:manage') or public.has_permission(auth.uid(), '*'));
exception when duplicate_object then null;
end $$;

insert into public.system_runbooks (title, category, steps, status)
values ('ØªØ´ØºÙŠÙ„ Ø§Ù„Ù†Ø¸Ø§Ù… Ø£ÙˆÙ„ Ù…Ø±Ø©', 'PRODUCTION', '["ØªØ·Ø¨ÙŠÙ‚ ÙƒÙ„ SQL patches", "Ù†Ø´Ø± Edge Functions", "ØªÙØ¹ÙŠÙ„ supabase-config.js", "ØªØ´ØºÙŠÙ„ Health Check", "ØªØ¬Ø±Ø¨Ø© Ø¯Ø®ÙˆÙ„ Ù…ÙˆØ¸Ù ÙˆØ¥Ø¯Ø§Ø±Ø©"]'::jsonb, 'ACTIVE')
on conflict do nothing;


-- END PATCH: 022_control_room_data_center_daily_reports.sql


-- =========================================================
-- BEGIN PATCH: 023_executive_mobile_gateway_live_location.sql
-- =========================================================

-- =========================================================
-- 023 Executive Mobile + Secure Gateway + Live Location Requests
-- Adds: live location request/response workflow, admin access logs,
-- executive view logs, and permissions used by the new UI pack.
-- =========================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------
-- Tables
-- ---------------------------------------------------------
create table if not exists public.live_location_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  requested_by_user_id uuid references auth.users(id) on delete set null,
  requested_by_employee_id uuid references public.employees(id) on delete set null,
  requested_by_name text,
  reason text not null default 'Ù…ØªØ§Ø¨Ø¹Ø© ØªÙ†ÙÙŠØ°ÙŠØ© Ù…Ø¨Ø§Ø´Ø±Ø©',
  precision text not null default 'HIGH',
  status text not null default 'PENDING' check (status in ('PENDING','APPROVED','REJECTED','EXPIRED','CANCELLED')),
  expires_at timestamptz,
  responded_at timestamptz,
  response_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.live_location_responses (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.live_location_requests(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  requested_by_user_id uuid references auth.users(id) on delete set null,
  status text not null check (status in ('APPROVED','REJECTED')),
  latitude double precision,
  longitude double precision,
  accuracy_meters numeric,
  captured_at timestamptz,
  responded_at timestamptz not null default now(),
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_access_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_employee_id uuid references public.employees(id) on delete set null,
  action text not null,
  route text,
  result text,
  user_agent text,
  ip_address inet,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.executive_views (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_employee_id uuid references public.employees(id) on delete set null,
  employee_id uuid references public.employees(id) on delete set null,
  route text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_live_location_requests_employee on public.live_location_requests(employee_id, created_at desc);
create index if not exists idx_live_location_requests_status on public.live_location_requests(status, created_at desc);
create index if not exists idx_live_location_responses_employee on public.live_location_responses(employee_id, responded_at desc);
create index if not exists idx_admin_access_logs_actor on public.admin_access_logs(actor_user_id, created_at desc);
create index if not exists idx_executive_views_actor on public.executive_views(actor_user_id, created_at desc);

-- ---------------------------------------------------------
-- Permissions seed
-- ---------------------------------------------------------
insert into public.permissions (scope, name)
values
  ('executive:mobile', 'Ø§Ù„Ù…ØªØ§Ø¨Ø¹Ø© Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠØ© Ù…Ù† Ø§Ù„Ù…ÙˆØ¨Ø§ÙŠÙ„'),
  ('live-location:request', 'Ø·Ù„Ø¨ Ø§Ù„Ù…ÙˆÙ‚Ø¹ Ø§Ù„Ù…Ø¨Ø§Ø´Ø± Ù…Ù† Ø§Ù„Ù…ÙˆØ¸Ù'),
  ('live-location:respond', 'Ø§Ù„Ø±Ø¯ Ø¹Ù„Ù‰ Ø·Ù„Ø¨ Ø§Ù„Ù…ÙˆÙ‚Ø¹ Ø§Ù„Ù…Ø¨Ø§Ø´Ø±'),
  ('admin-gateway:access', 'Ø§Ù„Ø¯Ø®ÙˆÙ„ Ù…Ù† Ø¨ÙˆØ§Ø¨Ø© Ø§Ù„ØªØ´ØºÙŠÙ„')
on conflict (scope) do update set name = excluded.name;

-- Give full-access roles access to the new scopes.
update public.roles
set permissions = (
  select array_agg(distinct p)
  from unnest(coalesce(permissions, '{}'::text[]) || array['executive:mobile','live-location:request','admin-gateway:access']::text[]) as p
)
where ('*' = any(coalesce(permissions, '{}'::text[])))
   or lower(coalesce(key, slug, name, '')) in ('admin','super-admin','super_admin','executive','executive-secretary','hr-manager')
   or coalesce(name,'') in ('Ù…Ø¯ÙŠØ± Ø§Ù„Ù†Ø¸Ø§Ù…','Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ','Ø§Ù„Ø³ÙƒØ±ØªÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ','Ù…Ø¯ÙŠØ± Ù…ÙˆØ§Ø±Ø¯ Ø¨Ø´Ø±ÙŠØ©');

-- Employee role can respond to requests that target their own employee profile.
update public.roles
set permissions = (
  select array_agg(distinct p)
  from unnest(coalesce(permissions, '{}'::text[]) || array['attendance:self','location:self','live-location:respond']::text[]) as p
)
where lower(coalesce(key, slug, name, '')) in ('employee','role-employee')
   or coalesce(name,'') = 'Ù…ÙˆØ¸Ù';

-- ---------------------------------------------------------
-- RLS
-- ---------------------------------------------------------
alter table public.live_location_requests enable row level security;
alter table public.live_location_responses enable row level security;
alter table public.admin_access_logs enable row level security;
alter table public.executive_views enable row level security;

drop policy if exists live_location_requests_select on public.live_location_requests;
create policy live_location_requests_select on public.live_location_requests
for select using (
  public.has_permission('live-location:request')
  or employee_id = public.current_employee_id()
  or requested_by_employee_id = public.current_employee_id()
);

drop policy if exists live_location_requests_insert on public.live_location_requests;
create policy live_location_requests_insert on public.live_location_requests
for insert with check (public.has_permission('live-location:request'));

drop policy if exists live_location_requests_update on public.live_location_requests;
create policy live_location_requests_update on public.live_location_requests
for update using (
  public.has_permission('live-location:request')
  or employee_id = public.current_employee_id()
) with check (
  public.has_permission('live-location:request')
  or employee_id = public.current_employee_id()
);

drop policy if exists live_location_responses_select on public.live_location_responses;
create policy live_location_responses_select on public.live_location_responses
for select using (
  public.has_permission('live-location:request')
  or employee_id = public.current_employee_id()
);

drop policy if exists live_location_responses_insert on public.live_location_responses;
create policy live_location_responses_insert on public.live_location_responses
for insert with check (employee_id = public.current_employee_id() or public.current_is_full_access());

drop policy if exists admin_access_logs_select on public.admin_access_logs;
create policy admin_access_logs_select on public.admin_access_logs
for select using (public.has_permission('audit:view') or public.has_permission('settings:manage'));

drop policy if exists admin_access_logs_insert on public.admin_access_logs;
create policy admin_access_logs_insert on public.admin_access_logs
for insert with check (auth.uid() is not null);

drop policy if exists executive_views_select on public.executive_views;
create policy executive_views_select on public.executive_views
for select using (public.has_permission('audit:view') or public.has_permission('executive:mobile'));

drop policy if exists executive_views_insert on public.executive_views;
create policy executive_views_insert on public.executive_views
for insert with check (public.has_permission('executive:mobile'));


-- END PATCH: 023_executive_mobile_gateway_live_location.sql


-- =========================================================
-- BEGIN PATCH: 024_sensitive_approvals_gateway_hardening.sql
-- =========================================================

-- =========================================================
-- 024 - Sensitive approvals + Executive presence hardening
-- Adds executive approval workflow for dangerous actions
-- and presence snapshot storage for mobile executive view.
-- =========================================================

create table if not exists public.sensitive_approvals (
  id uuid primary key default gen_random_uuid(),
  action_type text not null default 'SENSITIVE_ACTION',
  target_type text not null default 'system',
  target_id text,
  target_employee_id uuid references public.employees(id) on delete set null,
  title text not null default 'Ø·Ù„Ø¨ Ø§Ø¹ØªÙ…Ø§Ø¯ Ø¹Ù…Ù„ÙŠØ© Ø­Ø³Ø§Ø³Ø©',
  summary text,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'PENDING' check (status in ('PENDING','APPROVED','REJECTED','EXECUTED','CANCELLED')),
  requested_by_user_id uuid references auth.users(id) on delete set null,
  requested_by_employee_id uuid references public.employees(id) on delete set null,
  requested_by_name text,
  requested_at timestamptz not null default now(),
  decided_by_user_id uuid references auth.users(id) on delete set null,
  decided_at timestamptz,
  decision_note text,
  executed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sensitive_approvals_status_idx on public.sensitive_approvals(status, created_at desc);
create index if not exists sensitive_approvals_target_employee_idx on public.sensitive_approvals(target_employee_id);

create table if not exists public.executive_presence_snapshots (
  id uuid primary key default gen_random_uuid(),
  snapshot_date date not null default current_date,
  counts jsonb not null default '{}'::jsonb,
  rows jsonb not null default '[]'::jsonb,
  generated_by_user_id uuid references auth.users(id) on delete set null,
  generated_at timestamptz not null default now()
);

create index if not exists executive_presence_snapshots_date_idx on public.executive_presence_snapshots(snapshot_date desc, generated_at desc);

alter table public.sensitive_approvals enable row level security;
alter table public.executive_presence_snapshots enable row level security;

do $$ begin
  create policy "sensitive approvals readable by admins"
  on public.sensitive_approvals for select
  using (
    exists (
      select 1 from public.profiles p
      left join public.roles r on r.id = p.role_id
      where p.id = auth.uid()
        and coalesce(r.key, r.slug, '') in ('ADMIN','EXECUTIVE','EXECUTIVE_SECRETARY','HR_MANAGER','admin','executive','executive-secretary','hr-manager')
    )
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "sensitive approvals insert by admins"
  on public.sensitive_approvals for insert
  with check (
    exists (
      select 1 from public.profiles p
      left join public.roles r on r.id = p.role_id
      where p.id = auth.uid()
        and coalesce(r.key, r.slug, '') in ('ADMIN','EXECUTIVE','EXECUTIVE_SECRETARY','HR_MANAGER','admin','executive','executive-secretary','hr-manager')
    )
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "sensitive approvals update by executive authority"
  on public.sensitive_approvals for update
  using (
    exists (
      select 1 from public.profiles p
      left join public.roles r on r.id = p.role_id
      where p.id = auth.uid()
        and coalesce(r.key, r.slug, '') in ('ADMIN','EXECUTIVE','EXECUTIVE_SECRETARY','admin','executive','executive-secretary')
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      left join public.roles r on r.id = p.role_id
      where p.id = auth.uid()
        and coalesce(r.key, r.slug, '') in ('ADMIN','EXECUTIVE','EXECUTIVE_SECRETARY','admin','executive','executive-secretary')
    )
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "executive presence readable by executive authority"
  on public.executive_presence_snapshots for select
  using (
    exists (
      select 1 from public.profiles p
      left join public.roles r on r.id = p.role_id
      where p.id = auth.uid()
        and coalesce(r.key, r.slug, '') in ('ADMIN','EXECUTIVE','EXECUTIVE_SECRETARY','HR_MANAGER','admin','executive','executive-secretary','hr-manager')
    )
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "executive presence insert by executive authority"
  on public.executive_presence_snapshots for insert
  with check (
    exists (
      select 1 from public.profiles p
      left join public.roles r on r.id = p.role_id
      where p.id = auth.uid()
        and coalesce(r.key, r.slug, '') in ('ADMIN','EXECUTIVE','EXECUTIVE_SECRETARY','HR_MANAGER','admin','executive','executive-secretary','hr-manager')
    )
  );
exception when duplicate_object then null; end $$;

-- Optional permission seeds if your roles/permissions tables exist.
insert into public.permissions (scope, name)
select scope, name
from (values
  ('sensitive-actions:approve', 'Ø§Ø¹ØªÙ…Ø§Ø¯ Ø§Ù„Ø¹Ù…Ù„ÙŠØ§Øª Ø§Ù„Ø­Ø³Ø§Ø³Ø©'),
  ('sensitive-actions:request', 'Ø·Ù„Ø¨ ØªÙ†ÙÙŠØ° Ø¹Ù…Ù„ÙŠØ© Ø­Ø³Ø§Ø³Ø©'),
  ('executive:presence-map', 'Ø¹Ø±Ø¶ Ø®Ø±ÙŠØ·Ø© Ø§Ù„Ø­Ø¶ÙˆØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠØ©')
) as v(scope, name)
where exists (select 1 from information_schema.tables where table_schema='public' and table_name='permissions')
on conflict (scope) do nothing;


-- END PATCH: 024_sensitive_approvals_gateway_hardening.sql


-- =========================================================
-- BEGIN PATCH: 025_smart_attendance_executive_archive_backup.sql
-- =========================================================

-- =========================================================
-- 025 Smart Attendance + Executive PDF + Employee Archive + Auto Backup
-- Safe to run after patches 001-024.
-- =========================================================

create table if not exists public.attendance_rule_runs (
  id text primary key,
  run_date date not null default current_date,
  counts jsonb not null default '{}'::jsonb,
  alerts_created integer not null default 0,
  notifications_created integer not null default 0,
  created_by_user_id uuid null,
  created_at timestamptz not null default now()
);

create table if not exists public.end_of_day_reports (
  id text primary key,
  report_date date not null default current_date,
  period text not null default 'daily',
  title text not null,
  counts jsonb not null default '{}'::jsonb,
  totals jsonb not null default '{}'::jsonb,
  rows jsonb not null default '[]'::jsonb,
  created_by_user_id uuid null,
  created_at timestamptz not null default now()
);

create table if not exists public.auto_backup_runs (
  id text primary key,
  backup_id text null,
  reason text not null default 'scheduled',
  counts jsonb not null default '{}'::jsonb,
  status text not null default 'SUCCESS',
  created_by_user_id uuid null,
  created_at timestamptz not null default now()
);

create table if not exists public.database_migration_status (
  id text primary key,
  name text not null unique,
  status text not null default 'APPLIED',
  applied_by_user_id uuid null,
  applied_at timestamptz not null default now(),
  notes text null
);

alter table public.attendance_daily add column if not exists smart_status text;
alter table public.attendance_daily add column if not exists early_exit_minutes integer not null default 0;
alter table public.attendance_daily add column if not exists risk_flags jsonb not null default '[]'::jsonb;
alter table public.attendance_daily add column if not exists recommendation text;

alter table public.attendance_events add column if not exists review_note text;
alter table public.attendance_events add column if not exists review_decision text;
alter table public.attendance_events add column if not exists reviewed_by_user_id uuid null;
alter table public.attendance_events add column if not exists reviewed_at timestamptz null;

insert into public.permissions (scope, name)
values
  ('attendance:rules', 'Ø¥Ø¯Ø§Ø±Ø© Ù‚ÙˆØ§Ø¹Ø¯ Ø§Ù„Ø­Ø¶ÙˆØ± Ø§Ù„Ø°ÙƒÙŠØ©'),
  ('attendance:smart', 'ØªØ´ØºÙŠÙ„ ØªØ­Ù„ÙŠÙ„ Ø§Ù„Ø­Ø¶ÙˆØ± Ø§Ù„Ø°ÙƒÙŠ'),
  ('employee:archive', 'Ø¹Ø±Ø¶ Ø£Ø±Ø´ÙŠÙ Ø§Ù„Ù…ÙˆØ¸Ù Ø§Ù„ÙƒØ§Ù…Ù„'),
  ('manager:suite', 'Ù„ÙˆØ­Ø© Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„Ù…Ø¨Ø§Ø´Ø± Ø§Ù„Ù…ØªÙ‚Ø¯Ù…Ø©'),
  ('kpi:monthly', 'Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„ØªÙ‚ÙŠÙŠÙ… Ø§Ù„Ø´Ù‡Ø±ÙŠ'),
  ('supabase:diagnostics', 'ÙØ­Øµ Ø¥Ø¹Ø¯Ø§Ø¯ Supabase'),
  ('database:migrations', 'Ù…ØªØ§Ø¨Ø¹Ø© ØªØ­Ø¯ÙŠØ«Ø§Øª Ù‚Ø§Ø¹Ø¯Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª'),
  ('backup:auto', 'Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ù†Ø³Ø® Ø§Ù„Ø§Ø­ØªÙŠØ§Ø·ÙŠ Ø§Ù„ØªÙ„Ù‚Ø§Ø¦ÙŠ'),
  ('action-center:self', 'ØµÙØ­Ø© Ù…Ø·Ù„ÙˆØ¨ Ù…Ù†ÙŠ Ø§Ù„Ø¢Ù† Ù„Ù„Ù…ÙˆØ¸Ù')
on conflict (scope) do nothing;

create or replace function public.has_any_permission(scopes text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_is_full_access()
    or exists (
      select 1
      from unnest(public.current_role_permissions()) as p(scope)
      where p.scope = any(scopes)
    );
$$;

alter table public.attendance_rule_runs enable row level security;
alter table public.end_of_day_reports enable row level security;
alter table public.auto_backup_runs enable row level security;
alter table public.database_migration_status enable row level security;

drop policy if exists "attendance_rule_runs_admin" on public.attendance_rule_runs;
create policy "attendance_rule_runs_admin" on public.attendance_rule_runs for all using (public.has_any_permission(array['attendance:smart','attendance:rules','settings:manage'])) with check (public.has_any_permission(array['attendance:smart','attendance:rules','settings:manage']));

drop policy if exists "end_of_day_reports_admin" on public.end_of_day_reports;
create policy "end_of_day_reports_admin" on public.end_of_day_reports for all using (public.has_any_permission(array['executive:report','reports:export'])) with check (public.has_any_permission(array['executive:report','reports:export']));

drop policy if exists "auto_backup_runs_admin" on public.auto_backup_runs;
create policy "auto_backup_runs_admin" on public.auto_backup_runs for all using (public.has_any_permission(array['backup:auto','settings:manage'])) with check (public.has_any_permission(array['backup:auto','settings:manage']));

drop policy if exists "database_migration_status_admin" on public.database_migration_status;
create policy "database_migration_status_admin" on public.database_migration_status for all using (public.has_any_permission(array['database:migrations','settings:manage'])) with check (public.has_any_permission(array['database:migrations','settings:manage']));


-- END PATCH: 025_smart_attendance_executive_archive_backup.sql


-- =========================================================
-- BEGIN PATCH: 026_missing_functions_fix.sql
-- =========================================================

-- =========================================================
-- 026 - Ø¥ØµÙ„Ø§Ø­ Ø§Ù„Ø¯ÙˆØ§Ù„ Ø§Ù„Ù…ÙÙ‚ÙˆØ¯Ø© Ø§Ù„Ø­Ø±Ø¬Ø©
-- ÙŠØµÙ„Ø­ Ø§Ù„Ù…Ø´Ø§ÙƒÙ„ Ø§Ù„ØªØ§Ù„ÙŠØ©:
--   1. Ø¥Ø¶Ø§ÙØ© has_any_permission() Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…Ø© ÙÙŠ patch 025 ÙˆÙ„Ù… ØªÙƒÙ† Ù…ÙˆØ¬ÙˆØ¯Ø©.
--   2. Ø¥Ø¶Ø§ÙØ© resolve_login_identifier() Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…Ø© ÙÙŠ Edge Function.
--   3. Ø¥Ø¹Ø§Ø¯Ø© ØªØ¹Ø±ÙŠÙ policies Ø§Ù„Ù€ 4 ÙÙŠ patch 025 Ø¨Ø·Ø±ÙŠÙ‚Ø© ØµØ­ÙŠØ­Ø©.
--   4. Ø¥Ø¶Ø§ÙØ© Ø¯ÙˆØ§Ù„ Ù…Ø³Ø§Ø¹Ø¯Ø© Ø¥Ø¶Ø§ÙÙŠØ© Ù„Ù„ØªØ­Ù‚Ù‚ Ù…Ù† Ø§Ù„Ø£Ø¯ÙˆØ§Ø±.
--   5. Ø¥Ø¶Ø§ÙØ© smart_alerts table (Ù…Ø°ÙƒÙˆØ±Ø© ÙÙŠ supabase-api.js Ù„ÙƒÙ† ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯Ø© ÙÙŠ schema).
-- Ø¢Ù…Ù† Ù„Ù„ØªØ´ØºÙŠÙ„ Ø¹Ù„Ù‰ Ù‚Ø§Ø¹Ø¯Ø© Ø¨ÙŠØ§Ù†Ø§Øª ÙŠØ¹Ù…Ù„ Ø¹Ù„ÙŠÙ‡Ø§ 001-025.
-- =========================================================

-- =========================
-- 1) has_any_permission(scopes text[])
-- ØªØªØ­Ù‚Ù‚ Ø¥Ø°Ø§ ÙƒØ§Ù† Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… Ù„Ø¯ÙŠÙ‡ Ø£ÙŠ Ù…Ù† Ø§Ù„ØµÙ„Ø§Ø­ÙŠØ§Øª Ø§Ù„Ù…Ø¹Ø·Ø§Ø©.
-- =========================
create or replace function public.has_any_permission(scopes text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_is_full_access()
    or exists (
      select 1
      from unnest(public.current_role_permissions()) as p(scope)
      where p.scope = any(scopes)
    );
$$;

-- =========================
-- 2) resolve_login_identifier(login_identifier text)
-- ØªÙØ±Ø¬Ø¹ Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ Ù„Ù…ÙˆØ¸Ù Ø¹Ø¨Ø± Ø±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ Ø£Ùˆ Ø§Ù„Ø¨Ø±ÙŠØ¯ Ù…Ø¨Ø§Ø´Ø±Ø©Ù‹.
-- ØªÙØ³ØªØ®Ø¯Ù… Ù…Ù† Edge Function resolve-login-identifier.
-- Ù…Ù‚ÙŠÙ‘Ø¯Ø© Ø¨Ù€ authenticated Ùˆ service_role ÙÙ‚Ø· (Ø±Ø§Ø¬Ø¹ patch 015).
-- =========================
create or replace function public.resolve_login_identifier(login_identifier text)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  resolved_email text;
  normalized_phone text;
begin
  -- ØªØ·Ø¨ÙŠØ¹ Ø±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ Ø§Ù„Ù…ØµØ±ÙŠ
  normalized_phone := regexp_replace(login_identifier, '[^0-9]', '', 'g');
  if length(normalized_phone) = 10 and left(normalized_phone, 1) = '1' then
    normalized_phone := '0' || normalized_phone;
  end if;

  -- 1) Ø¨Ø­Ø« ÙÙŠ Ø¬Ø¯ÙˆÙ„ employees
  select e.email into resolved_email
  from public.employees e
  where
    e.is_deleted = false
    and (
      lower(e.email) = lower(login_identifier)
      or e.phone = login_identifier
      or e.phone = normalized_phone
    )
  limit 1;

  if resolved_email is not null and resolved_email <> '' then
    return lower(trim(resolved_email));
  end if;

  -- 2) Ø¨Ø­Ø« ÙÙŠ Ø¬Ø¯ÙˆÙ„ profiles
  select p.email into resolved_email
  from public.profiles p
  where
    lower(p.email) = lower(login_identifier)
    or p.phone = login_identifier
    or p.phone = normalized_phone
  limit 1;

  return lower(trim(coalesce(resolved_email, '')));
end;
$$;

-- ØªÙ‚ÙŠÙŠØ¯ Ø§Ù„ÙˆØµÙˆÙ„ Ù„Ù€ resolve_login_identifier ÙƒÙ…Ø§ ÙÙŠ patch 015
revoke all on function public.resolve_login_identifier(text) from public;
revoke execute on function public.resolve_login_identifier(text) from anon;
grant execute on function public.resolve_login_identifier(text) to authenticated;
grant execute on function public.resolve_login_identifier(text) to service_role;

-- =========================
-- 3) smart_alerts table
-- Ù…Ø°ÙƒÙˆØ±Ø© ÙÙŠ supabase-api.js (maybeTableRows("smart_alerts")) Ù„ÙƒÙ† ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯Ø© ÙÙŠ 001.
-- =========================
create table if not exists public.smart_alerts (
  id uuid primary key default gen_random_uuid(),
  fingerprint text unique not null,
  severity text not null default 'MEDIUM' check (severity in ('LOW','MEDIUM','HIGH','CRITICAL')),
  title text not null,
  body text not null default '',
  route text default '',
  status text not null default 'OPEN' check (status in ('OPEN','RESOLVED','DISMISSED')),
  resolution_note text,
  resolved_at timestamptz,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists smart_alerts_status_severity_idx on public.smart_alerts(status, severity, created_at desc);

alter table public.smart_alerts enable row level security;

drop policy if exists "smart_alerts_admin" on public.smart_alerts;
create policy "smart_alerts_admin" on public.smart_alerts
  for all to authenticated
  using (public.has_any_permission(array['control-room:view','settings:manage']))
  with check (public.has_any_permission(array['control-room:view','settings:manage']));

-- =========================
-- 4) daily_reports table
-- Ù…Ø°ÙƒÙˆØ±Ø© ÙÙŠ supabase-api.js Ù„ÙƒÙ† ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯Ø© ÙÙŠ 001.
-- =========================
create table if not exists public.daily_reports (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  report_date date not null default current_date,
  achievements text not null default '',
  blockers text not null default '',
  tomorrow_plan text not null default '',
  support_needed text not null default '',
  mood text not null default 'NORMAL' check (mood in ('EXCELLENT','GOOD','NORMAL','BAD','CRITICAL')),
  status text not null default 'SUBMITTED' check (status in ('DRAFT','SUBMITTED','REVIEWED','APPROVED')),
  manager_comment text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(employee_id, report_date)
);

create index if not exists daily_reports_employee_date_idx on public.daily_reports(employee_id, report_date desc);
create index if not exists daily_reports_date_status_idx on public.daily_reports(report_date desc, status);

alter table public.daily_reports enable row level security;

drop policy if exists "daily_reports_self_read" on public.daily_reports;
create policy "daily_reports_self_read" on public.daily_reports
  for select to authenticated
  using (
    public.current_is_full_access()
    or employee_id = public.current_employee_id()
  );

drop policy if exists "daily_reports_self_write" on public.daily_reports;
create policy "daily_reports_self_write" on public.daily_reports
  for all to authenticated
  using (
    public.current_is_full_access()
    or employee_id = public.current_employee_id()
  )
  with check (
    public.current_is_full_access()
    or employee_id = public.current_employee_id()
  );

-- audit trigger Ø¹Ù„Ù‰ daily_reports
drop trigger if exists audit_row_change_daily_reports on public.daily_reports;
create trigger audit_row_change_daily_reports
  after insert or update or delete on public.daily_reports
  for each row execute function public.audit_row_change();

-- updated_at trigger Ø¹Ù„Ù‰ daily_reports
drop trigger if exists set_updated_at_daily_reports on public.daily_reports;
create trigger set_updated_at_daily_reports
  before update on public.daily_reports
  for each row execute function public.set_updated_at();

-- =========================
-- 5) import_batches table
-- Ù…Ø°ÙƒÙˆØ±Ø© ÙÙŠ supabase-api.js (maybeTableRows("import_batches"))
-- =========================
create table if not exists public.import_batches (
  id uuid primary key default gen_random_uuid(),
  batch_type text not null default 'employees',
  status text not null default 'PENDING' check (status in ('PENDING','PROCESSING','DONE','FAILED','PARTIAL')),
  total_rows integer not null default 0,
  processed_rows integer not null default 0,
  error_count integer not null default 0,
  result_summary jsonb not null default '{}'::jsonb,
  created_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.import_batches enable row level security;

drop policy if exists "import_batches_admin" on public.import_batches;
create policy "import_batches_admin" on public.import_batches
  for all to authenticated
  using (public.has_any_permission(array['data-center:manage','settings:manage']))
  with check (public.has_any_permission(array['data-center:manage','settings:manage']));

-- =========================
-- 6) system_backups table
-- Ù…Ø°ÙƒÙˆØ±Ø© ÙÙŠ supabase-api.js (maybeTableRows("system_backups"))
-- =========================
create table if not exists public.system_backups (
  id uuid primary key default gen_random_uuid(),
  backup_type text not null default 'full',
  status text not null default 'PENDING' check (status in ('PENDING','PROCESSING','DONE','FAILED')),
  size_bytes bigint,
  storage_path text,
  notes text,
  created_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.system_backups enable row level security;

drop policy if exists "system_backups_admin" on public.system_backups;
create policy "system_backups_admin" on public.system_backups
  for all to authenticated
  using (public.has_any_permission(array['backup:auto','settings:manage']))
  with check (public.has_any_permission(array['backup:auto','settings:manage']));

-- =========================
-- 7) Ø¥ØµÙ„Ø§Ø­ policies patch 025 Ø§Ù„ØªÙŠ Ø§Ø³ØªØ®Ø¯Ù…Øª has_any_permission Ù‚Ø¨Ù„ ØªØ¹Ø±ÙŠÙÙ‡Ø§
-- Ù†Ø¹ÙŠØ¯ Ø¥Ù†Ø´Ø§Ø¡Ù‡Ø§ Ø¨Ø´ÙƒÙ„ Ø¢Ù…Ù† Ø§Ù„Ø¢Ù†
-- =========================
drop policy if exists "attendance_rule_runs_admin" on public.attendance_rule_runs;
create policy "attendance_rule_runs_admin" on public.attendance_rule_runs
  for all
  using (public.has_any_permission(array['attendance:smart','attendance:rules','settings:manage']))
  with check (public.has_any_permission(array['attendance:smart','attendance:rules','settings:manage']));

drop policy if exists "end_of_day_reports_admin" on public.end_of_day_reports;
create policy "end_of_day_reports_admin" on public.end_of_day_reports
  for all
  using (public.has_any_permission(array['executive:report','reports:export']))
  with check (public.has_any_permission(array['executive:report','reports:export']));

drop policy if exists "auto_backup_runs_admin" on public.auto_backup_runs;
create policy "auto_backup_runs_admin" on public.auto_backup_runs
  for all
  using (public.has_any_permission(array['backup:auto','settings:manage']))
  with check (public.has_any_permission(array['backup:auto','settings:manage']));

drop policy if exists "database_migration_status_admin" on public.database_migration_status;
create policy "database_migration_status_admin" on public.database_migration_status
  for all
  using (public.has_any_permission(array['database:migrations','settings:manage']))
  with check (public.has_any_permission(array['database:migrations','settings:manage']));

-- =========================
-- 8) Ø¥Ø¶Ø§ÙØ© permissions seed Ø§Ù„Ø¬Ø¯ÙŠØ¯Ø© Ù„Ù„Ø¬Ø¯Ø§ÙˆÙ„ Ø§Ù„Ø¬Ø¯ÙŠØ¯Ø©
-- =========================
insert into public.permissions (scope, name) values
  ('control-room:view',   'ØºØ±ÙØ© Ø§Ù„ØªØ­ÙƒÙ… ÙˆØ§Ù„ØªÙ†Ø¨ÙŠÙ‡Ø§Øª Ø§Ù„Ø°ÙƒÙŠØ©'),
  ('data-center:manage',  'Ø¥Ø¯Ø§Ø±Ø© Ù…Ø±ÙƒØ² Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª ÙˆØ§Ù„Ø§Ø³ØªÙŠØ±Ø§Ø¯'),
  ('daily-report:self',   'Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„ØªÙ‚Ø±ÙŠØ± Ø§Ù„ÙŠÙˆÙ…ÙŠ'),
  ('daily-report:review', 'Ù…Ø±Ø§Ø¬Ø¹Ø© Ø§Ù„ØªÙ‚Ø§Ø±ÙŠØ± Ø§Ù„ÙŠÙˆÙ…ÙŠØ©')
on conflict (scope) do update set name = excluded.name;

-- ØªØ³Ø¬ÙŠÙ„ Ù‡Ø°Ø§ Ø§Ù„Ù€ patch ÙÙŠ migration_status
insert into public.database_migration_status (id, name, status, notes)
values (
  gen_random_uuid()::text,
  '026_missing_functions_fix.sql',
  'APPLIED',
  'Ø£Ø¶Ø§Ù has_any_permission, resolve_login_identifier, smart_alerts, daily_reports, import_batches, system_backups'
)
on conflict (name) do update set status = 'APPLIED', applied_at = now();

-- Ù†Ù‡Ø§ÙŠØ© patch 026


-- END PATCH: 026_missing_functions_fix.sql


-- =========================================================
-- BEGIN PATCH: 027_fix_executive_hierarchy_accounts.sql
-- =========================================================

-- =========================================================
-- 027 Fix Executive Hierarchy Accounts
-- Repairs the Ahla Shabab executive/manager tree in Supabase.
-- Safe to re-run. It does not delete rows; old duplicate roster rows are
-- marked inactive/deleted so they stop appearing in active operational views.
-- =========================================================

create extension if not exists pgcrypto;

alter table if exists public.employees
  add column if not exists manager_employee_id uuid references public.employees(id) on delete set null;

alter table if exists public.departments
  add column if not exists manager_employee_id uuid references public.employees(id) on delete set null;

-- Required roles and permissions.
insert into public.roles (slug, key, name, permissions, active)
values
  ('admin', 'ADMIN', 'Ù…Ø¯ÙŠØ± Ø§Ù„Ù†Ø¸Ø§Ù…', array['*']::text[], true),
  ('executive', 'EXECUTIVE', 'Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ', array['*']::text[], true),
  ('executive-secretary', 'EXECUTIVE_SECRETARY', 'Ø§Ù„Ø³ÙƒØ±ØªÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ', array['*']::text[], true),
  ('hr-manager', 'HR_MANAGER', 'Ø§Ù„Ù…ÙˆØ§Ø±Ø¯ Ø§Ù„Ø¨Ø´Ø±ÙŠØ©', array['*']::text[], true),
  ('manager', 'DIRECT_MANAGER', 'Ù…Ø¯ÙŠØ± Ù…Ø¨Ø§Ø´Ø±', array['dashboard:view','employees:view','attendance:manage','requests:approve','kpi:team','reports:export','realtime:view','attendance:review']::text[], true),
  ('employee', 'EMPLOYEE', 'Ù…ÙˆØ¸Ù', array['dashboard:view','attendance:self','kpi:self','disputes:create','location:self','requests:self','tasks:self']::text[], true)
on conflict (slug) do update set
  key = excluded.key,
  name = excluded.name,
  permissions = excluded.permissions,
  active = true,
  updated_at = now();

-- Stable departments for the organization tree.
insert into public.departments (code, name, branch_id, active)
select d.code, d.name, b.id, true
from (values
  ('EXEC', 'Ø§Ù„Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠØ©'),
  ('MGT', 'Ø§Ù„Ø¥Ø´Ø±Ø§Ù ÙˆØ§Ù„Ù…Ø¯ÙŠØ±ÙˆÙ† Ø§Ù„Ù…Ø¨Ø§Ø´Ø±ÙˆÙ†'),
  ('OPS', 'ÙØ±Ù‚ Ø§Ù„ØªØ´ØºÙŠÙ„ ÙˆØ§Ù„Ø®Ø¯Ù…Ø§Øª'),
  ('HR', 'Ø§Ù„Ù…ÙˆØ§Ø±Ø¯ Ø§Ù„Ø¨Ø´Ø±ÙŠØ©')
) as d(code, name)
cross join lateral (select id from public.branches order by created_at nulls last, id limit 1) b
on conflict (code) do update set
  name = excluded.name,
  branch_id = coalesce(public.departments.branch_id, excluded.branch_id),
  active = true,
  updated_at = now();

create temp table if not exists tmp_ahla_roster_027 (
  employee_code text primary key,
  full_name text not null,
  phone text,
  email text,
  job_title text,
  role_slug text not null,
  department_code text not null,
  manager_code text,
  hire_date date
) on commit drop;

truncate tmp_ahla_roster_027;

insert into tmp_ahla_roster_027 (employee_code, full_name, phone, email, job_title, role_slug, department_code, manager_code, hire_date)
values
  ('EMP-001', 'Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ', 'PHONE_PLACEHOLDER_021', 'executive.director@organization.local', 'Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ', 'executive', 'EXEC', null, '2020-01-01'),
  ('EMP-002', 'Ø§Ù„Ø³ÙƒØ±ØªÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ', 'PHONE_PLACEHOLDER_022', 'executive.secretary@organization.local', 'Ø§Ù„Ø³ÙƒØ±ØªÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ', 'executive-secretary', 'EXEC', 'EMP-001', '2021-01-01'),
  ('EMP-003', 'Ù…Ø¯ÙŠØ± Ù…Ø¨Ø§Ø´Ø± Ø±Ø§Ø¨Ø¹', 'PHONE_PLACEHOLDER_023', 'ahmed.mahgoob@ahla.local', 'Ù…Ø¯ÙŠØ± Ù…Ø¨Ø§Ø´Ø±', 'manager', 'MGT', 'EMP-001', '2021-02-01'),
  ('EMP-004', 'Ù…Ø¯ÙŠØ± Ù…Ø¨Ø§Ø´Ø± Ø£ÙˆÙ„', 'PHONE_PLACEHOLDER_024', 'direct.manager.01@organization.local', 'Ù…Ø¯ÙŠØ± Ù…Ø¨Ø§Ø´Ø±', 'manager', 'MGT', 'EMP-001', '2021-02-01'),
  ('EMP-005', 'Ù…Ø¯ÙŠØ± Ù…Ø¨Ø§Ø´Ø± Ø«Ø§Ù†Ù', 'PHONE_PLACEHOLDER_025', 'direct.manager.02@organization.local', 'Ù…Ø¯ÙŠØ± Ù…Ø¨Ø§Ø´Ø±', 'manager', 'MGT', 'EMP-001', '2021-02-01'),
  ('EMP-006', 'Ù…Ø¯ÙŠØ± Ù…Ø¨Ø§Ø´Ø± Ø«Ø§Ù„Ø«', 'PHONE_PLACEHOLDER_026', 'direct.manager.03@organization.local', 'Ù…Ø¯ÙŠØ± Ù…Ø¨Ø§Ø´Ø±', 'manager', 'MGT', 'EMP-001', '2021-02-01'),
  ('EMP-007', 'Ù…ÙˆØ¸Ù ØªØ´ØºÙŠÙ„ÙŠ 01', 'PHONE_PLACEHOLDER_027', 'direct.manager.05@organization.local', 'Ù…Ø¯ÙŠØ± Ù…Ø¨Ø§Ø´Ø±', 'manager', 'MGT', 'EMP-001', '2021-02-01'),
  ('EMP-008', 'Ù…ÙˆØ¸Ù ØªØ´ØºÙŠÙ„ÙŠ 18', 'PHONE_PLACEHOLDER_028', 'direct.manager.06@organization.local', 'Ù…Ø¯ÙŠØ± Ù…Ø¨Ø§Ø´Ø±', 'manager', 'MGT', 'EMP-001', '2021-02-01'),
  ('EMP-009', 'Ù…ÙˆØ¸Ù ØªØ´ØºÙŠÙ„ÙŠ 14', 'PHONE_PLACEHOLDER_029', 'direct.manager.07@organization.local', 'Ù…Ø¯ÙŠØ± Ù…Ø¨Ø§Ø´Ø±', 'manager', 'MGT', 'EMP-001', '2021-02-01'),
  ('EMP-010', 'Ù…ÙˆØ¸Ù ØªØ´ØºÙŠÙ„ÙŠ 07', 'PHONE_PLACEHOLDER_030', 'employee.006@organization.local', 'Ù…ÙˆØ¸Ù ÙØ±ÙŠÙ‚ Ù…Ø¯ÙŠØ± Ù…Ø¨Ø§Ø´Ø± Ø«Ø§Ù„Ø«', 'employee', 'OPS', 'EMP-006', '2022-01-01'),
  ('EMP-011', 'Ù…ÙˆØ¸Ù ØªØ´ØºÙŠÙ„ÙŠ 08', 'PHONE_PLACEHOLDER_031', 'employee.007@organization.local', 'Ù…ÙˆØ¸Ù ÙØ±ÙŠÙ‚ Ù…Ø¯ÙŠØ± Ù…Ø¨Ø§Ø´Ø± Ø«Ø§Ù„Ø«', 'employee', 'OPS', 'EMP-006', '2022-01-01'),
  ('EMP-012', 'Ù…ÙˆØ¸Ù ØªØ´ØºÙŠÙ„ÙŠ 04', 'PHONE_PLACEHOLDER_032', 'direct.manager.08@organization.local', 'Ù…Ø´Ø±Ù Ù…Ø¨Ø§Ø´Ø±', 'manager', 'MGT', 'EMP-006', '2022-01-01'),
  ('EMP-013', 'Ù…ÙˆØ¸Ù ØªØ´ØºÙŠÙ„ÙŠ 05', 'PHONE_PLACEHOLDER_033', 'employee.005@organization.local', 'Ù…ÙˆØ¸Ù ØªØ­Øª Ø¥Ø´Ø±Ø§Ù Ù…Ø¨Ø§Ø´Ø±', 'employee', 'OPS', 'EMP-012', '2022-01-01'),
  ('EMP-014', 'Ù…ÙˆØ¸Ù ØªØ´ØºÙŠÙ„ÙŠ 13', 'PHONE_PLACEHOLDER_034', 'abdullah.hussein@ahla.local', 'Ù…ÙˆØ¸Ù ÙØ±ÙŠÙ‚ Ù…Ø¯ÙŠØ± Ù…Ø¨Ø§Ø´Ø± Ø±Ø§Ø¨Ø¹', 'employee', 'OPS', 'EMP-003', '2022-01-01'),
  ('EMP-015', 'Ù…ÙˆØ¸Ù ØªØ´ØºÙŠÙ„ÙŠ 06', 'PHONE_PLACEHOLDER_035', 'employee.006@organization.local', 'Ù…ÙˆØ¸Ù ÙØ±ÙŠÙ‚ Ù…Ø¯ÙŠØ± Ù…Ø¨Ø§Ø´Ø± Ø±Ø§Ø¨Ø¹', 'employee', 'OPS', 'EMP-003', '2022-01-01'),
  ('EMP-016', 'Ù…ÙˆØ¸Ù ØªØ´ØºÙŠÙ„ÙŠ 16', 'PHONE_PLACEHOLDER_036', 'employee.016@organization.local', 'Ù…ÙˆØ¸Ù ÙØ±ÙŠÙ‚ Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„Ù…Ø¨Ø§Ø´Ø± Ø§Ù„Ø³Ø§Ø¨Ø¹', 'employee', 'OPS', 'EMP-009', '2022-01-01'),
  ('EMP-017', 'Ù…ÙˆØ¸Ù ØªØ´ØºÙŠÙ„ÙŠ 10', 'PHONE_PLACEHOLDER_037', 'employee.010@organization.local', 'Ù…ÙˆØ¸Ù ÙØ±ÙŠÙ‚ Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„Ù…Ø¨Ø§Ø´Ø± Ø§Ù„Ø³Ø§Ø¨Ø¹', 'employee', 'OPS', 'EMP-009', '2022-01-01'),
  ('EMP-018', 'Ù…ÙˆØ¸Ù ØªØ´ØºÙŠÙ„ÙŠ 15', 'PHONE_PLACEHOLDER_038', 'employee.015@organization.local', 'Ù…ÙˆØ¸Ù ÙØ±ÙŠÙ‚ Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„Ù…Ø¨Ø§Ø´Ø± Ø§Ù„Ø³Ø§Ø¨Ø¹', 'employee', 'OPS', 'EMP-009', '2022-01-01'),
  ('EMP-019', 'Ù…ÙˆØ¸Ù ØªØ´ØºÙŠÙ„ÙŠ 17', 'PHONE_PLACEHOLDER_039', 'employee.017@organization.local', 'Ù…ÙˆØ¸Ù ÙØ±ÙŠÙ‚ Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„Ù…Ø¨Ø§Ø´Ø± Ø§Ù„Ø£ÙˆÙ„', 'employee', 'OPS', 'EMP-004', '2022-01-01'),
  ('EMP-020', 'Ù…ÙˆØ¸Ù ØªØ´ØºÙŠÙ„ÙŠ 11', 'PHONE_PLACEHOLDER_040', 'employee.011@organization.local', 'Ù…ÙˆØ¸Ù ÙØ±ÙŠÙ‚ Ù…ÙˆØ¸Ù ØªØ´ØºÙŠÙ„ÙŠ 18', 'employee', 'OPS', 'EMP-008', '2022-01-01'),
  ('EMP-021', 'Ù…ÙˆØ¸Ù ØªØ´ØºÙŠÙ„ÙŠ 12', 'PHONE_PLACEHOLDER_041', 'employee.012@organization.local', 'Ù…ÙˆØ¸Ù ÙØ±ÙŠÙ‚ Ù…ÙˆØ¸Ù ØªØ´ØºÙŠÙ„ÙŠ 18', 'employee', 'OPS', 'EMP-008', '2022-01-01'),
  ('EMP-022', 'Ù…ÙˆØ¸Ù ØªØ´ØºÙŠÙ„ÙŠ 03', 'PHONE_PLACEHOLDER_042', 'employee.003@organization.local', 'Ù…ÙˆØ¸Ù ÙØ±ÙŠÙ‚ Ù…ÙˆØ¸Ù ØªØ´ØºÙŠÙ„ÙŠ 18', 'employee', 'OPS', 'EMP-008', '2022-01-01'),
  ('EMP-023', 'Ù…ÙˆØ¸Ù ØªØ´ØºÙŠÙ„ÙŠ 09', 'PHONE_PLACEHOLDER_043', 'tarek.ibrahim@ahla.local', 'Ù…ÙˆØ¸Ù ÙØ±ÙŠÙ‚ Ù…ÙˆØ¸Ù ØªØ´ØºÙŠÙ„ÙŠ 18', 'employee', 'OPS', 'EMP-008', '2022-01-01');

-- Upsert the canonical roster.
insert into public.employees (
  employee_code, full_name, phone, email, job_title, role_id, branch_id, department_id,
  governorate_id, complex_id, shift_id, status, is_active, is_deleted, hire_date
)
select
  r.employee_code,
  r.full_name,
  r.phone,
  r.email,
  r.job_title,
  role.id,
  branch.id,
  dept.id,
  gov.id,
  complex.id,
  shift_row.id,
  'ACTIVE',
  true,
  false,
  r.hire_date
from tmp_ahla_roster_027 r
join public.roles role on role.slug = r.role_slug
left join public.departments dept on dept.code = r.department_code
left join lateral (select id from public.branches order by created_at nulls last, id limit 1) branch on true
left join lateral (select id from public.governorates order by created_at nulls last, id limit 1) gov on true
left join lateral (select id from public.complexes order by created_at nulls last, id limit 1) complex on true
left join lateral (select id from public.shifts order by created_at nulls last, id limit 1) shift_row on true
on conflict (employee_code) do update set
  full_name = excluded.full_name,
  phone = excluded.phone,
  email = excluded.email,
  job_title = excluded.job_title,
  role_id = excluded.role_id,
  branch_id = excluded.branch_id,
  department_id = excluded.department_id,
  governorate_id = excluded.governorate_id,
  complex_id = excluded.complex_id,
  shift_id = excluded.shift_id,
  status = 'ACTIVE',
  is_active = true,
  is_deleted = false,
  hire_date = excluded.hire_date,
  updated_at = now();

-- Manager tree.
update public.employees e
set manager_employee_id = manager.id,
    updated_at = now()
from tmp_ahla_roster_027 r
left join public.employees manager on manager.employee_code = r.manager_code
where e.employee_code = r.employee_code;

-- Hide duplicate active roster rows with the same names but non-canonical codes.
update public.employees e
set is_active = false,
    is_deleted = true,
    status = 'INACTIVE',
    updated_at = now()
from tmp_ahla_roster_027 r
where e.full_name = r.full_name
  and e.employee_code <> r.employee_code
  and coalesce(e.is_deleted, false) = false;

-- Current real Yihia login aliases should point to the secretary employee/profile.
update public.profiles p
set employee_id = emp.id,
    role_id = role.id,
    full_name = 'Ø§Ù„Ø³ÙƒØ±ØªÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ',
    phone = coalesce(p.phone, emp.phone),
    branch_id = emp.branch_id,
    department_id = emp.department_id,
    governorate_id = emp.governorate_id,
    complex_id = emp.complex_id,
    status = 'ACTIVE',
    updated_at = now()
from public.employees emp
join public.roles role on role.slug = 'executive-secretary'
where emp.employee_code = 'EMP-002'
  and lower(p.email) in ('legacy.secretary.01@removed.local', 'legacy.secretary.02@removed.local', 'executive.secretary@organization.local');

update public.employees e
set user_id = p.id,
    updated_at = now()
from public.profiles p
where e.employee_code = 'EMP-002'
  and lower(p.email) = 'legacy.secretary.01@removed.local';

-- Create/repair Auth + Profile accounts for canonical roster rows when absent.
do $$
declare
  rec record;
  v_user_id uuid;
  v_employee_id uuid;
  v_temp_password text := 'ChangeMe_Ahla#2026!';
begin
  for rec in
    select r.*, e.id as employee_id, e.branch_id, e.department_id, e.governorate_id, e.complex_id, role.id as role_id
    from tmp_ahla_roster_027 r
    join public.employees e on e.employee_code = r.employee_code
    join public.roles role on role.slug = r.role_slug
  loop
    v_employee_id := rec.employee_id;

    select id into v_user_id
    from auth.users
    where lower(email) = lower(rec.email)
    limit 1;

    if v_user_id is null then
      v_user_id := gen_random_uuid();
      insert into auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        confirmation_sent_at, raw_app_meta_data, raw_user_meta_data, created_at,
        updated_at, is_super_admin
      ) values (
        '00000000-0000-0000-0000-000000000000',
        v_user_id,
        'authenticated',
        'authenticated',
        rec.email,
        crypt(v_temp_password, gen_salt('bf')),
        now(),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', rec.full_name, 'role', rec.role_slug),
        now(),
        now(),
        false
      );
    else
      update auth.users
      set email_confirmed_at = coalesce(email_confirmed_at, now()),
          aud = 'authenticated',
          role = 'authenticated',
          banned_until = null,
          raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"provider":"email","providers":["email"]}'::jsonb,
          raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('full_name', rec.full_name, 'role', rec.role_slug),
          updated_at = now()
      where id = v_user_id;
    end if;

    if exists (select 1 from information_schema.tables where table_schema = 'auth' and table_name = 'identities') then
      insert into auth.identities (
        id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
      ) values (
        gen_random_uuid(),
        v_user_id,
        v_user_id::text,
        jsonb_build_object('sub', v_user_id::text, 'email', rec.email, 'email_verified', true, 'phone_verified', false),
        'email',
        now(),
        now(),
        now()
      )
      on conflict (provider, provider_id) do update set
        user_id = excluded.user_id,
        identity_data = excluded.identity_data,
        updated_at = now();
    end if;

    update public.employees
    set user_id = v_user_id,
        updated_at = now()
    where id = v_employee_id
      and (user_id is null or employee_code in ('EMP-001','EMP-003','EMP-004','EMP-005','EMP-006','EMP-007','EMP-008','EMP-009','EMP-012'));

    insert into public.profiles (
      id, employee_id, email, phone, full_name, avatar_url, role_id, branch_id,
      department_id, governorate_id, complex_id, status, temporary_password,
      must_change_password, password_changed_at, created_at, updated_at
    ) values (
      v_user_id,
      v_employee_id,
      rec.email,
      rec.phone,
      rec.full_name,
      '',
      rec.role_id,
      rec.branch_id,
      rec.department_id,
      rec.governorate_id,
      rec.complex_id,
      'ACTIVE',
      true,
      true,
      null,
      now(),
      now()
    )
    on conflict (id) do update set
      employee_id = excluded.employee_id,
      email = excluded.email,
      phone = excluded.phone,
      full_name = excluded.full_name,
      role_id = excluded.role_id,
      branch_id = excluded.branch_id,
      department_id = excluded.department_id,
      governorate_id = excluded.governorate_id,
      complex_id = excluded.complex_id,
      status = 'ACTIVE',
      updated_at = now();
  end loop;
end $$;

-- Department managers.
update public.departments d
set manager_employee_id = e.id,
    updated_at = now()
from public.employees e
where (d.code = 'EXEC' and e.employee_code = 'EMP-001')
   or (d.code = 'MGT' and e.employee_code = 'EMP-001')
   or (d.code = 'OPS' and e.employee_code = 'EMP-006')
   or (d.code = 'HR' and e.employee_code = 'EMP-002');

-- Close old imported duplicates for old executive/secretary aliases, then attach
-- any remaining active orphan employee directly under the executive root.
with canonical as (
  select id from public.employees where employee_code in ('EMP-001','EMP-002')
)
update public.employees e
set is_active = false,
    is_deleted = true,
    status = 'INACTIVE',
    updated_at = now()
where e.id not in (select id from canonical)
  and coalesce(e.is_deleted, false) = false
  and (
    e.employee_code in ('EMP-192404E9','EMP-F9889BBE')
    or
    lower(coalesce(e.email, '')) in ('legacy.secretary.01@removed.local','legacy.secretary.02@removed.local')
    or e.full_name in ('Ø§Ø³Ù… ØªÙ†ÙÙŠØ°ÙŠ Ù‚Ø¯ÙŠÙ…','Ø§Ø³Ù… Ø³ÙƒØ±ØªØ§Ø±ÙŠØ© Ù‚Ø¯ÙŠÙ…')
    or (e.full_name like '%Ø§Ù„Ø³ÙƒØ±ØªÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ Ø¬Ù…Ø§Ù„%' and e.employee_code <> 'EMP-002')
    or (e.full_name like '%Ø§Ø³Ù… ØªÙ†ÙÙŠØ°ÙŠ Ù‚Ø¯ÙŠÙ…%' and e.employee_code <> 'EMP-001')
  );

with root as (
  select id from public.employees where employee_code = 'EMP-001'
)
update public.employees e
set manager_employee_id = root.id,
    updated_at = now()
from root
where e.employee_code <> 'EMP-001'
  and coalesce(e.is_deleted, false) = false
  and e.manager_employee_id is null;

-- Recursive hierarchy visibility for managers and full access users.
create or replace function public.can_access_employee(emp_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with recursive team(id) as (
    select public.current_employee_id()
    union all
    select e.id
    from public.employees e
    join team t on e.manager_employee_id = t.id
    where coalesce(e.is_deleted, false) = false
  )
  select coalesce(
    public.current_is_full_access()
    or emp_id in (select id from team),
    false
  );
$$;

comment on function public.can_access_employee(uuid) is 'Allows a manager to read their full subordinate tree, plus full access roles.';

-- Verification result.
select
  e.employee_code,
  e.full_name,
  r.slug as role_slug,
  manager.employee_code as manager_code,
  manager.full_name as manager_name,
  e.email,
  e.user_id is not null as has_auth_user,
  coalesce(e.is_deleted, false) as is_deleted
from public.employees e
left join public.roles r on r.id = e.role_id
left join public.employees manager on manager.id = e.manager_employee_id
where e.employee_code in (select employee_code from tmp_ahla_roster_027)
order by e.employee_code;


-- END PATCH: 027_fix_executive_hierarchy_accounts.sql


-- =========================================================
-- BEGIN PATCH: 028_primary_admin_and_runtime_fixes.sql
-- =========================================================

-- =========================================================
-- 028 Primary Admin + Runtime Schema Fixes
-- Creates/repairs the requested primary admin account:
--   email: admin.production@ahla-shabab.local
--   password: set v_password locally before applying; do not commit real passwords.
-- Also adds runtime columns required by policy acknowledgement and
-- live-location response flows.
-- =========================================================

create extension if not exists pgcrypto;

alter table if exists public.policy_acknowledgements
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table if exists public.live_location_requests
  add column if not exists responded_at timestamptz,
  add column if not exists response_note text default '';

insert into public.roles (slug, key, name, permissions, active)
values ('admin', 'ADMIN', 'Primary Admin', array['*']::text[], true)
on conflict (slug) do update set
  key = excluded.key,
  name = excluded.name,
  permissions = array['*']::text[],
  active = true,
  updated_at = now();

do $$
declare
  v_email text := 'admin.production@ahla-shabab.local';
  v_password text := 'CHANGE_THIS_PASSWORD_BEFORE_APPLYING';
  v_full_name text := 'Primary Admin';
  v_user_id uuid;
  v_employee_id uuid;
  v_role_id uuid;
  v_branch_id uuid;
begin
  select id into v_role_id from public.roles where slug = 'admin' limit 1;
  select id into v_branch_id from public.branches order by created_at nulls last limit 1;
  select id into v_user_id from auth.users where lower(email) = lower(v_email) limit 1;

  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, invited_at, confirmation_sent_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      is_super_admin,
      email_change, confirmation_token, recovery_token,
      email_change_token_new, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', v_email, crypt(v_password, gen_salt('bf')),
      now(), now(), now(),
      jsonb_build_object('provider','email','providers',array['email']),
      jsonb_build_object('full_name',v_full_name,'role','admin'),
      now(), now(),
      false,
      '', '', '', '', '', null, '', '', ''
    );
  else
    update auth.users
      set email = v_email,
          encrypted_password = crypt(v_password, gen_salt('bf')),
          email_confirmed_at = coalesce(email_confirmed_at, now()),
          raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('provider','email','providers',array['email']),
          raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('full_name',v_full_name,'role','admin'),
          updated_at = now()
    where id = v_user_id;
  end if;

  insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  values (
    v_user_id,
    v_user_id,
    jsonb_build_object('sub', v_user_id::text, 'email', v_email, 'email_verified', true, 'phone_verified', false),
    'email',
    v_user_id::text,
    now(),
    now(),
    now()
  )
  on conflict (provider, provider_id) do update set
    user_id = excluded.user_id,
    identity_data = excluded.identity_data,
    updated_at = now();

  select id into v_employee_id
  from public.employees
  where employee_code = 'ADMIN-MAIN' or lower(email) = lower(v_email)
  limit 1;

  if v_employee_id is null then
    v_employee_id := gen_random_uuid();
    insert into public.employees (
      id, user_id, employee_code, full_name, email, phone, job_title,
      branch_id, role_id, manager_employee_id, status, is_active,
      is_deleted, hire_date, created_at, updated_at
    ) values (
      v_employee_id, v_user_id, 'ADMIN-MAIN', v_full_name, v_email, '', 'Primary Admin',
      v_branch_id, v_role_id, null, 'active', true,
      false, current_date, now(), now()
    );
  else
    update public.employees
      set user_id = v_user_id,
          employee_code = 'ADMIN-MAIN',
          full_name = v_full_name,
          email = v_email,
          job_title = 'Primary Admin',
          branch_id = coalesce(branch_id, v_branch_id),
          role_id = v_role_id,
          manager_employee_id = null,
          status = 'active',
          is_active = true,
          is_deleted = false,
          updated_at = now()
    where id = v_employee_id;
  end if;

  insert into public.profiles (
    id, employee_id, role_id, email, full_name, branch_id, status,
    temporary_password, must_change_password, created_at, updated_at
  ) values (
    v_user_id, v_employee_id, v_role_id, v_email, v_full_name, v_branch_id, 'active',
    false, false, now(), now()
  )
  on conflict (id) do update set
    employee_id = excluded.employee_id,
    role_id = excluded.role_id,
    email = excluded.email,
    full_name = excluded.full_name,
    branch_id = coalesce(public.profiles.branch_id, excluded.branch_id),
    status = 'active',
    temporary_password = false,
    must_change_password = false,
    updated_at = now();
end $$;

alter table if exists public.admin_access_logs enable row level security;

do $$
begin
  if to_regclass('public.admin_access_logs') is not null then
    drop policy if exists admin_access_logs_full_access_select on public.admin_access_logs;
    drop policy if exists admin_access_logs_full_access_insert on public.admin_access_logs;

    create policy admin_access_logs_full_access_select
      on public.admin_access_logs
      for select
      using (public.current_is_full_access());

    create policy admin_access_logs_full_access_insert
      on public.admin_access_logs
      for insert
      with check (public.current_is_full_access());
  end if;
end $$;


-- END PATCH: 028_primary_admin_and_runtime_fixes.sql


-- =========================================================
-- BEGIN PATCH: 029_employee_photos.sql
-- =========================================================

-- =========================================================
-- 029_employee_photos.sql
-- Production hardening note:
-- Employee face photos are no longer bundled inside the web package.
-- Upload real photos to Supabase Storage bucket `avatars` and save signed/public URLs
-- through the app instead of shipping personal images with the frontend.
-- This migration is intentionally safe/no-op for fresh production installs.
-- =========================================================

alter table if exists public.employees add column if not exists photo_url text;
alter table if exists public.profiles add column if not exists avatar_url text;

-- Remove old packaged-image references if a previous build inserted them.
update public.employees
set photo_url = null
where photo_url like '%/shared/images/employees/%';

update public.profiles
set avatar_url = null
where avatar_url like '%/shared/images/employees/%';


-- END PATCH: 029_employee_photos.sql


-- =========================================================
-- BEGIN PATCH: 030a_executive_role_separation_ui_polish.sql
-- =========================================================

-- =========================================================
-- 030 Executive Role Separation + UI Polish Alignment
-- Purpose:
--   - Stop treating EXECUTIVE / EXECUTIVE_SECRETARY as full admin roles.
--   - Keep ADMIN / HR_MANAGER with full operational permissions.
--   - Give the executive portal only the permissions it needs for monitoring,
--     approvals, reports, and live-location requests.
-- Run after: 029_employee_photos.sql
-- =========================================================

update public.roles
set permissions = array['*']::text[],
    updated_at = now()
where slug in ('admin', 'hr-manager')
   or key in ('ADMIN', 'HR_MANAGER');

update public.roles
set permissions = array[
    'dashboard:view',
    'employees:view',
    'reports:export',
    'executive:report',
    'executive:mobile',
    'executive:presence-map',
    'live-location:request',
    'sensitive-actions:approve',
    'approvals:manage',
    'alerts:manage',
    'control-room:view',
    'daily-report:review'
  ]::text[],
  description = coalesce(nullif(description, ''), 'Ù…ØªØ§Ø¨Ø¹Ø© ØªÙ†ÙÙŠØ°ÙŠØ© ÙˆÙ‚Ø±Ø§Ø±Ø§Øª Ø­Ø³Ø§Ø³Ø© Ø¨Ø¯ÙˆÙ† Ø£Ø¯ÙˆØ§Øª Ø§Ù„Ø£Ø¯Ù…Ù† Ø§Ù„ØªÙ‚Ù†ÙŠØ©'),
  updated_at = now()
where slug = 'executive' or key = 'EXECUTIVE';

update public.roles
set permissions = array[
    'dashboard:view',
    'employees:view',
    'reports:export',
    'executive:report',
    'executive:mobile',
    'executive:presence-map',
    'live-location:request',
    'sensitive-actions:request',
    'daily-report:review',
    'alerts:manage'
  ]::text[],
  description = coalesce(nullif(description, ''), 'Ù…ØªØ§Ø¨Ø¹Ø© ØªÙ†ÙÙŠØ°ÙŠØ© ÙˆØªØ¬Ù‡ÙŠØ² ØªÙ‚Ø§Ø±ÙŠØ± ÙˆØ·Ù„Ø¨ Ù…ÙˆÙ‚Ø¹ Ø¨Ø¯ÙˆÙ† Ø­Ø°Ù Ø£Ùˆ Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª ØªÙ‚Ù†ÙŠØ©'),
  updated_at = now()
where slug = 'executive-secretary' or key = 'EXECUTIVE_SECRETARY';

-- Safety audit marker for environments that track audit_log/audit_logs.
do $$
begin
  if to_regclass('public.audit_log') is not null then
    insert into public.audit_log (action, entity_type, entity_id, metadata, created_at)
    values ('roles.executive_separation', 'role', '030_executive_role_separation_ui_polish', jsonb_build_object('patch','030'), now());
  elsif to_regclass('public.audit_logs') is not null then
    insert into public.audit_logs (action, entity_type, entity_id, metadata, created_at)
    values ('roles.executive_separation', 'role', '030_executive_role_separation_ui_polish', jsonb_build_object('patch','030'), now());
  end if;
exception when others then
  null;
end $$;


-- END PATCH: 030a_executive_role_separation_ui_polish.sql


-- =========================================================
-- BEGIN PATCH: 031b_web_guard_mobile_polish.sql
-- =========================================================

-- =========================================================
-- 031 Web Guard + Mobile Polish Alignment
-- Purpose:
--   - Keep executive and admin web entry separated after Patch 030.
--   - Remove any legacy direct '*' permissions from executive profiles if an older
--     schema stored profile-level permissions in addition to role permissions.
--   - Add an audit marker for the front-end scoped gateway/mobile dialog polish.
-- Run after: 030a_executive_role_separation_ui_polish.sql
-- =========================================================

-- Re-assert role permissions in case an older seed or manual edit reintroduced '*'.
update public.roles
set permissions = array[
    'dashboard:view',
    'employees:view',
    'reports:export',
    'executive:report',
    'executive:mobile',
    'executive:presence-map',
    'live-location:request',
    'sensitive-actions:approve',
    'approvals:manage',
    'alerts:manage',
    'control-room:view',
    'daily-report:review'
  ]::text[],
  updated_at = now()
where slug = 'executive' or key = 'EXECUTIVE';

update public.roles
set permissions = array[
    'dashboard:view',
    'employees:view',
    'reports:export',
    'executive:report',
    'executive:mobile',
    'executive:presence-map',
    'live-location:request',
    'sensitive-actions:request',
    'daily-report:review',
    'alerts:manage'
  ]::text[],
  updated_at = now()
where slug = 'executive-secretary' or key = 'EXECUTIVE_SECRETARY';

-- Some very old builds had profile-level permissions. Clean '*' safely if that
-- optional legacy column exists as jsonb, text[], or text.
do $$
declare
  perm_type text;
begin
  select data_type into perm_type
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'profiles'
    and column_name = 'permissions'
  limit 1;

  if perm_type = 'jsonb' then
    execute $sql$
      update public.profiles p
      set permissions = coalesce(permissions, '[]'::jsonb) - '*'
      where p.role_id in (select id from public.roles where slug in ('executive','executive-secretary'))
    $sql$;
  elsif perm_type = 'ARRAY' then
    execute $sql$
      update public.profiles p
      set permissions = array_remove(coalesce(permissions, '{}'::text[]), '*')
      where p.role_id in (select id from public.roles where slug in ('executive','executive-secretary'))
    $sql$;
  elsif perm_type = 'text' then
    execute $sql$
      update public.profiles p
      set permissions = replace(coalesce(permissions, ''), '*', '')
      where p.role_id in (select id from public.roles where slug in ('executive','executive-secretary'))
    $sql$;
  end if;
exception when others then
  null;
end $$;

-- Safety audit marker for environments that track audit_log/audit_logs.
do $$
begin
  if to_regclass('public.audit_log') is not null then
    insert into public.audit_log (action, entity_type, entity_id, metadata, created_at)
    values ('web.scoped_gateway_mobile_polish', 'system', '031_web_guard_mobile_polish', jsonb_build_object('patch','031'), now());
  elsif to_regclass('public.audit_logs') is not null then
    insert into public.audit_logs (action, entity_type, entity_id, metadata, created_at)
    values ('web.scoped_gateway_mobile_polish', 'system', '031_web_guard_mobile_polish', jsonb_build_object('patch','031'), now());
  end if;
exception when others then
  null;
end $$;


-- END PATCH: 031b_web_guard_mobile_polish.sql


-- =========================================================
-- BEGIN PATCH: 032b_pre_publish_role_portal_consistency.sql
-- =========================================================

-- =========================================================
-- 032 Pre-publish Role + Portal Consistency Guard
-- Purpose:
--   - Make executive / executive-secretary roles safe even in environments
--     that ran older seeds or were manually edited.
--   - Ensure all executive portal scopes exist in permissions catalog.
--   - Remove accidental profile-level '*' permissions from executive profiles.
-- Run after: 031b_web_guard_mobile_polish.sql
-- =========================================================

insert into public.permissions (scope, name) values
('executive:report','ØªÙ‚Ø§Ø±ÙŠØ± Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ'),
('executive:mobile','Ø§Ù„Ù…ØªØ§Ø¨Ø¹Ø© Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠØ© Ø§Ù„Ù…Ø®ØªØµØ±Ø©'),
('executive:presence-map','Ø®Ø±ÙŠØ·Ø© Ø§Ù„ØªÙˆØ§Ø¬Ø¯ Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠØ©'),
('live-location:request','Ø·Ù„Ø¨ Ù…ÙˆÙ‚Ø¹ Ù…Ø¨Ø§Ø´Ø± Ù…Ù† Ù…ÙˆØ¸Ù'),
('sensitive-actions:approve','Ø§Ø¹ØªÙ…Ø§Ø¯ Ø¥Ø¬Ø±Ø§Ø¡Ø§Øª Ø­Ø³Ø§Ø³Ø©'),
('sensitive-actions:request','Ø·Ù„Ø¨ Ø§Ø¹ØªÙ…Ø§Ø¯ Ø¥Ø¬Ø±Ø§Ø¡ Ø­Ø³Ø§Ø³'),
('approvals:manage','Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø§Ø¹ØªÙ…Ø§Ø¯Ø§Øª'),
('alerts:manage','Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„ØªÙ†Ø¨ÙŠÙ‡Ø§Øª'),
('control-room:view','Ø¹Ø±Ø¶ ØºØ±ÙØ© Ø§Ù„ØªØ­ÙƒÙ…'),
('daily-report:review','Ù…Ø±Ø§Ø¬Ø¹Ø© Ø§Ù„ØªÙ‚Ø§Ø±ÙŠØ± Ø§Ù„ÙŠÙˆÙ…ÙŠØ©')
on conflict (scope) do update set name = excluded.name;

update public.roles
set permissions = array[
    'dashboard:view',
    'employees:view',
    'reports:export',
    'executive:report',
    'executive:mobile',
    'executive:presence-map',
    'live-location:request',
    'sensitive-actions:approve',
    'approvals:manage',
    'alerts:manage',
    'control-room:view',
    'daily-report:review'
  ]::text[],
  active = true,
  updated_at = now()
where slug = 'executive' or key = 'EXECUTIVE';

update public.roles
set permissions = array[
    'dashboard:view',
    'employees:view',
    'reports:export',
    'executive:report',
    'executive:mobile',
    'executive:presence-map',
    'live-location:request',
    'sensitive-actions:request',
    'daily-report:review',
    'alerts:manage'
  ]::text[],
  active = true,
  updated_at = now()
where slug = 'executive-secretary' or key = 'EXECUTIVE_SECRETARY';

-- Profile-level permissions are not part of the current schema, but some old
-- local/production builds added them. Remove '*' safely when the column exists.
do $$
declare
  perm_type text;
begin
  select data_type into perm_type
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'profiles'
    and column_name = 'permissions'
  limit 1;

  if perm_type = 'jsonb' then
    execute $sql$
      update public.profiles p
      set permissions = coalesce(permissions, '[]'::jsonb) - '*'
      where p.role_id in (select id from public.roles where slug in ('executive','executive-secretary'))
    $sql$;
  elsif perm_type = 'ARRAY' then
    execute $sql$
      update public.profiles p
      set permissions = array_remove(coalesce(permissions, '{}'::text[]), '*')
      where p.role_id in (select id from public.roles where slug in ('executive','executive-secretary'))
    $sql$;
  elsif perm_type = 'text' then
    execute $sql$
      update public.profiles p
      set permissions = regexp_replace(coalesce(permissions, ''), '(^|[,[:space:]])\*([,[:space:]]|$)', '\1', 'g')
      where p.role_id in (select id from public.roles where slug in ('executive','executive-secretary'))
    $sql$;
  end if;
exception when others then
  null;
end $$;

-- Optional audit marker for installations that already have audit tables.
do $$
begin
  if to_regclass('public.audit_log') is not null then
    insert into public.audit_log (action, entity_type, entity_id, metadata, created_at)
    values ('web.pre_publish_role_portal_consistency', 'system', '032_pre_publish_role_portal_consistency', jsonb_build_object('patch','032'), now());
  elsif to_regclass('public.audit_logs') is not null then
    insert into public.audit_logs (action, entity_type, entity_id, metadata, created_at)
    values ('web.pre_publish_role_portal_consistency', 'system', '032_pre_publish_role_portal_consistency', jsonb_build_object('patch','032'), now());
  end if;
exception when others then
  null;
end $$;


-- END PATCH: 032b_pre_publish_role_portal_consistency.sql


-- =========================================================
-- BEGIN PATCH: 033a_final_web_production_hardening.sql
-- =========================================================

-- =========================================================
-- 033a_final_web_production_hardening.sql
-- Final web production hardening before APK/PWA packaging.
-- Goals:
-- 1) Keep executive roles separate from full admin.
-- 2) Ensure no bundled employee-photo paths remain in DB.
-- 3) Make role permissions explicit for admin / HR / executive / employee.
-- 4) Add safe indexes for daily operational screens.
-- =========================================================

insert into public.permissions(scope, name, description) values
  ('executive:mobile', 'Ø§Ù„Ù…ØªØ§Ø¨Ø¹Ø© Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠØ© Ø§Ù„Ù…Ø®ØªØµØ±Ø©', 'ÙØªØ­ Ø´Ø§Ø´Ø© Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ Ø§Ù„Ù…Ø®ØªØµØ±Ø© ÙÙ‚Ø·'),
  ('live-location:request', 'Ø·Ù„Ø¨ Ø§Ù„Ù…ÙˆÙ‚Ø¹ Ø§Ù„Ù…Ø¨Ø§Ø´Ø±', 'Ø¥Ø±Ø³Ø§Ù„ Ø·Ù„Ø¨ Ù…ÙˆÙ‚Ø¹ Ù…Ø¨Ø§Ø´Ø± Ù„Ù„Ù…ÙˆØ¸Ù'),
  ('users:manage', 'Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…ÙŠÙ†', 'Ø¥Ù†Ø´Ø§Ø¡ ÙˆØªØ¹Ø¯ÙŠÙ„ Ø­Ø³Ø§Ø¨Ø§Øª Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…ÙŠÙ†'),
  ('settings:manage', 'Ø¥Ø¯Ø§Ø±Ø© Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø§Ù„Ù†Ø¸Ø§Ù…', 'ØªØ¹Ø¯ÙŠÙ„ Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø§Ù„Ù†Ø¸Ø§Ù… Ø§Ù„ØªÙ‚Ù†ÙŠØ©')
on conflict (scope) do update set
  name = excluded.name,
  description = excluded.description;

update public.roles
set permissions = array[
  '*'
]::text[]
where slug = 'admin';

update public.roles
set permissions = array[
  'employees:view', 'employees:manage', 'attendance:view', 'attendance:manage',
  'requests:view', 'requests:approve', 'reports:export', 'users:manage'
]::text[]
where slug in ('hr-manager', 'hr');

update public.roles
set permissions = array[
  'executive:mobile', 'employees:view', 'attendance:view', 'requests:view',
  'reports:export', 'live-location:request', 'sensitive:approve'
]::text[]
where slug = 'executive';

update public.roles
set permissions = array[
  'executive:mobile', 'employees:view', 'attendance:view', 'requests:view',
  'reports:export', 'live-location:request'
]::text[]
where slug = 'executive-secretary';

-- Explicitly remove accidental full-admin permission from non-admin executive roles.
update public.roles
set permissions = array_remove(permissions, '*')
where slug in ('executive', 'executive-secretary');

-- Remove old packaged-image references. Real photos should live in Supabase Storage.
alter table if exists public.employees add column if not exists photo_url text;
alter table if exists public.profiles add column if not exists avatar_url text;

update public.employees
set photo_url = null
where photo_url like '%/shared/images/employees/%';

update public.profiles
set avatar_url = null
where avatar_url like '%/shared/images/employees/%';

-- Helpful indexes for high-frequency web views. They are safe if tables already exist.
create index if not exists idx_attendance_events_employee_event_at on public.attendance_events(employee_id, event_at desc);
create index if not exists idx_live_location_requests_employee_status on public.live_location_requests(employee_id, status, created_at desc);
create index if not exists idx_leave_requests_employee_status on public.leave_requests(employee_id, status, created_at desc);
create index if not exists idx_profiles_role_status on public.profiles(role_id, status);



-- END PATCH: 033a_final_web_production_hardening.sql


-- =========================================================
-- BEGIN PATCH: 034a_final_lockdown_cleanup.sql
-- =========================================================

-- =========================================================
-- 034a_final_lockdown_cleanup.sql
-- Final lockdown cleanup for web production handoff.
-- Goals:
-- 1) Keep Demo/Training permission out of every non-admin role.
-- 2) Keep executive roles unable to reach technical/admin-only areas.
-- 3) Keep storage private where it contains attendance selfies or attachments.
-- 4) Add final app-version marker for auditability.
-- =========================================================

-- Admin may still own every permission through '*'. Non-admin roles must not carry demo/system permissions.
update public.roles
set permissions = array_remove(array_remove(array_remove(array_remove(coalesce(permissions, array[]::text[]), 'demo:manage'), 'settings:manage'), 'database:migrations'), 'backup:auto')
where slug <> 'admin';

-- Executive roles remain read/decision/mobile only; no hidden full-admin or users management.
update public.roles
set permissions = array[
  'executive:mobile', 'employees:view', 'attendance:view', 'requests:view',
  'reports:export', 'live-location:request', 'sensitive:approve'
]::text[]
where slug = 'executive';

update public.roles
set permissions = array[
  'executive:mobile', 'employees:view', 'attendance:view', 'requests:view',
  'reports:export', 'live-location:request'
]::text[]
where slug = 'executive-secretary';

-- Keep sensitive storage private. Avatars may remain public for browser display unless you choose signed URLs later.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('punch-selfies', 'punch-selfies', false, 3145728, array['image/png','image/jpeg','image/webp']),
  ('employee-attachments', 'employee-attachments', false, 8388608, null)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Tighten upload policies without breaking authenticated browser uploads.
drop policy if exists "selfies_upload_auth" on storage.objects;
create policy "selfies_upload_auth" on storage.objects
for insert to authenticated
with check (bucket_id = 'punch-selfies' and (owner = auth.uid() or owner is null));

drop policy if exists "attachments_upload_auth" on storage.objects;
create policy "attachments_upload_auth" on storage.objects
for insert to authenticated
with check (bucket_id = 'employee-attachments' and (owner = auth.uid() or owner is null));

drop policy if exists "attachments_update_owner_or_admin" on storage.objects;
create policy "attachments_update_owner_or_admin" on storage.objects
for update to authenticated
using (bucket_id = 'employee-attachments' and (owner = auth.uid() or public.current_is_full_access()))
with check (bucket_id = 'employee-attachments' and (owner = auth.uid() or public.current_is_full_access()));

drop policy if exists "attachments_delete_admin_only" on storage.objects;
create policy "attachments_delete_admin_only" on storage.objects
for delete to authenticated
using (bucket_id = 'employee-attachments' and public.current_is_full_access());

-- Store a final deployment marker in system settings when the table exists.
do $$
begin
  if to_regclass('public.system_settings') is not null then
    insert into public.system_settings(key, value, description)
    values ('web_production_version', '"1.2.2-kpi-cycle-control"'::jsonb, 'Final web production lockdown package version')
    on conflict (key) do update set value = excluded.value, description = excluded.description, updated_at = now();
  end if;
end $$;


-- END PATCH: 034a_final_lockdown_cleanup.sql


-- =========================================================
-- BEGIN PATCH: 035_final_sanitization_live_readiness.sql
-- =========================================================

-- =========================================================
-- 035_final_sanitization_live_readiness.sql
-- Final sanitization + live Supabase readiness.
-- - Remove training/demo permission from production roles.
-- - Sanitize remaining seeded/patched employee display names.
-- - Add Web Push subscription tables for real mobile/browser notifications.
-- =========================================================

-- 1) Production must not expose demo/training permission.
-- role_permissions existed in older drafts only; guard it so fresh installs do not fail.
do $$
begin
  if to_regclass('public.role_permissions') is not null then
    delete from public.role_permissions
    where permission_id in (select id from public.permissions where scope = 'demo:manage');
  end if;
end $$;

delete from public.permissions where scope = 'demo:manage';

update public.roles
set permissions = array_remove(coalesce(permissions, array[]::text[]), 'demo:manage')
where 'demo:manage' = any(coalesce(permissions, array[]::text[]));

-- 2) Keep seed names generic in packaged SQL/demo data.
update public.employees set full_name = 'Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ', email = 'executive.director@organization.local' where employee_code = 'EMP-001';
update public.employees set full_name = 'Ø§Ù„Ø³ÙƒØ±ØªÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ', email = 'executive.secretary@organization.local' where employee_code = 'EMP-002';
update public.employees set full_name = 'Ù…Ø¯ÙŠØ± Ù…Ø¨Ø§Ø´Ø± Ø±Ø§Ø¨Ø¹', email = 'direct.manager.04@organization.local' where employee_code = 'EMP-003';
update public.employees set full_name = 'Ù…Ø¯ÙŠØ± Ù…Ø¨Ø§Ø´Ø± Ø£ÙˆÙ„', email = 'direct.manager.01@organization.local' where employee_code = 'EMP-004';
update public.employees set full_name = 'Ù…Ø¯ÙŠØ± Ù…Ø¨Ø§Ø´Ø± Ø«Ø§Ù†Ù', email = 'direct.manager.02@organization.local' where employee_code = 'EMP-005';
update public.employees set full_name = 'Ù…Ø¯ÙŠØ± Ù…Ø¨Ø§Ø´Ø± Ø«Ø§Ù„Ø«', email = 'direct.manager.03@organization.local' where employee_code = 'EMP-006';

-- 3) Real Web Push readiness. The Edge Function that sends notifications
-- must use VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT secrets.
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  endpoint text not null unique,
  payload jsonb not null default '{}'::jsonb,
  permission text not null default 'granted',
  created_at timestamptz not null default now()
);

-- Upgrade the original 001 table shape to the real Web Push shape used by the app/function.
alter table public.push_subscriptions
  add column if not exists employee_id uuid references public.employees(id) on delete cascade,
  add column if not exists payload jsonb not null default '{}'::jsonb,
  add column if not exists keys jsonb not null default '{}'::jsonb,
  add column if not exists user_agent text,
  add column if not exists platform text,
  add column if not exists is_active boolean not null default true,
  add column if not exists updated_at timestamptz not null default now();

update public.push_subscriptions
set keys = coalesce(nullif(keys, '{}'::jsonb), payload -> 'keys', '{}'::jsonb),
    updated_at = coalesce(updated_at, created_at, now());

create table if not exists public.notification_delivery_log (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid,
  push_subscription_id uuid references public.push_subscriptions(id) on delete set null,
  target_user_id uuid references auth.users(id) on delete set null,
  status text not null default 'QUEUED',
  provider_response jsonb,
  error text,
  created_at timestamptz not null default now()
);

create index if not exists idx_push_subscriptions_user on public.push_subscriptions(user_id) where is_active = true;
create index if not exists idx_push_subscriptions_employee on public.push_subscriptions(employee_id) where is_active = true;
create index if not exists idx_notification_delivery_log_status on public.notification_delivery_log(status, created_at desc);

alter table public.push_subscriptions enable row level security;
alter table public.notification_delivery_log enable row level security;

drop policy if exists "Users manage own push subscriptions" on public.push_subscriptions;
create policy "Users manage own push subscriptions"
  on public.push_subscriptions
  for all
  using (user_id = auth.uid() or exists (select 1 from public.profiles p join public.roles r on r.id = p.role_id where p.id = auth.uid() and r.slug in ('admin','hr-manager','executive-secretary')))
  with check (user_id = auth.uid() or exists (select 1 from public.profiles p join public.roles r on r.id = p.role_id where p.id = auth.uid() and r.slug in ('admin','hr-manager','executive-secretary')));

drop policy if exists "Admins view notification delivery log" on public.notification_delivery_log;
create policy "Admins view notification delivery log"
  on public.notification_delivery_log
  for select
  using (exists (select 1 from public.profiles p join public.roles r on r.id = p.role_id where p.id = auth.uid() and r.slug in ('admin','hr-manager','executive-secretary')));

-- 4) Mark package readiness in settings table when present.
do $$
begin
  if to_regclass('public.system_settings') is not null then
    insert into public.system_settings (key, value, description)
    values (
      'production.final_sanitized_version',
      '"1.2.2-kpi-cycle-control"'::jsonb,
      'Final sanitized package: generic seed data, production/development config split, and Web Push readiness.'
    )
    on conflict (key) do update set value = excluded.value, description = excluded.description, updated_at = now();
  end if;
end $$;


-- END PATCH: 035_final_sanitization_live_readiness.sql


-- =========================================================
-- BEGIN PATCH: 036_role_kpi_workflow_access.sql
-- =========================================================

-- =========================================================
-- 036_role_kpi_workflow_access.sql
-- Role + KPI workflow realignment for the web version.
-- Goals:
-- 1) Employee self-registration always creates employee-level accounts.
-- 2) Direct managers see only their teams and approve team KPI.
-- 3) HR sees HR-only tools, not technical/admin settings.
-- 4) Executive secretary / technical owner has full system access.
-- 5) KPI flows: employee -> direct manager -> HR -> executive secretary -> executive director.
-- 6) Dispute committee: executive secretary + operations manager 1 + operations manager 2 + HR.
-- =========================================================

-- 1) Permission catalog additions.
insert into public.permissions (scope, name)
values
  ('manager:team', 'Ù…ØªØ§Ø¨Ø¹Ø© Ø§Ù„ÙØ±ÙŠÙ‚ Ø§Ù„Ù…Ø¨Ø§Ø´Ø± ÙÙ‚Ø·'),
  ('kpi:hr', 'Ø¥Ø¯Ø®Ø§Ù„ ØªÙ‚ÙŠÙŠÙ… Ø§Ù„Ù…ÙˆØ§Ø±Ø¯ Ø§Ù„Ø¨Ø´Ø±ÙŠØ©'),
  ('kpi:final-approve', 'Ø§Ø¹ØªÙ…Ø§Ø¯ Ø§Ù„Ù†ØªÙŠØ¬Ø© Ø§Ù„Ù†Ù‡Ø§Ø¦ÙŠØ© Ù„Ù„ØªÙ‚ÙŠÙŠÙ…'),
  ('kpi:executive', 'Ø¹Ø±Ø¶ ÙˆØ§Ø¹ØªÙ…Ø§Ø¯ Ø§Ù„ØªÙ‚ÙŠÙŠÙ…Ø§Øª Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠØ©'),
  ('disputes:committee', 'Ø¹Ø¶ÙˆÙŠØ© Ù„Ø¬Ù†Ø© Ø­Ù„ Ø§Ù„Ù…Ø´Ø§ÙƒÙ„ ÙˆØ§Ù„Ø®Ù„Ø§ÙØ§Øª'),
  ('notifications:manage', 'Ø¥Ø¯Ø§Ø±Ø© Ø¥Ø´Ø¹Ø§Ø±Ø§Øª Ø§Ù„Ù…ÙˆØ§Ø±Ø¯ Ø§Ù„Ø¨Ø´Ø±ÙŠØ©'),
  ('live-location:respond', 'Ø§Ù„Ø±Ø¯ Ø¹Ù„Ù‰ Ø·Ù„Ø¨ Ø§Ù„Ù…ÙˆÙ‚Ø¹ Ø§Ù„Ù…Ø¨Ø§Ø´Ø±'),
  ('employee:self-register', 'ØªØ³Ø¬ÙŠÙ„ Ù…ÙˆØ¸Ù Ø°Ø§ØªÙŠÙ‹Ø§')
on conflict (scope) do update set name = excluded.name;

alter table if exists public.roles add column if not exists description text;
-- 2) Role permission alignment.
update public.roles
set permissions = array['*']::text[],
    name = 'Ø§Ù„Ø³ÙƒØ±ØªÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ ÙˆØ§Ù„ØªÙ‚Ù†ÙŠ',
    description = 'ØµÙ„Ø§Ø­ÙŠØ§Øª ÙƒØ§Ù…Ù„Ø© Ø¹Ù„Ù‰ Ø§Ù„Ù†Ø¸Ø§Ù… Ù…Ø¹ Ù…ØªØ§Ø¨Ø¹Ø© ØªÙ†ÙÙŠØ°ÙŠØ© ÙˆØªÙ‚Ù†ÙŠØ©'
where slug in ('executive-secretary') or key = 'EXECUTIVE_SECRETARY';

update public.roles
set permissions = array[
  'dashboard:view', 'employees:view', 'employees:write', 'users:manage',
  'attendance:manage', 'attendance:review', 'attendance:rules', 'attendance:smart',
  'requests:approve', 'leave:balance', 'documents:manage', 'reports:export',
  'kpi:hr', 'kpi:monthly', 'kpi:manage', 'daily-report:review',
  'disputes:committee', 'disputes:manage', 'notifications:manage', 'policies:self'
]::text[],
    description = 'ØµÙ„Ø§Ø­ÙŠØ§Øª Ù…ÙˆØ§Ø±Ø¯ Ø¨Ø´Ø±ÙŠØ© ÙÙ‚Ø· Ø¨Ø¯ÙˆÙ† Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª ØªÙ‚Ù†ÙŠØ© Ø£Ùˆ Supabase Ø£Ùˆ Backup'
where slug in ('hr-manager') or key = 'HR_MANAGER';

update public.roles
set permissions = array[
  'dashboard:view', 'employees:view', 'manager:team', 'manager:suite',
  'attendance:manage', 'requests:approve', 'reports:export', 'kpi:team',
  'daily-report:review', 'disputes:manage', 'realtime:view'
]::text[],
    description = 'ÙŠØ±Ù‰ ÙØ±ÙŠÙ‚Ù‡ Ø§Ù„Ù…Ø¨Ø§Ø´Ø± ÙÙ‚Ø· ÙˆÙŠØ¹ØªÙ…Ø¯ ØªÙ‚ÙŠÙŠÙ…Ø§ØªÙ‡Ù…'
where slug in ('manager', 'direct-manager') or key in ('MANAGER', 'DIRECT_MANAGER');

update public.roles
set permissions = array[
  'dashboard:view', 'attendance:self', 'kpi:self', 'disputes:create',
  'location:self', 'tasks:self', 'documents:self', 'requests:self',
  'daily-report:self', 'action-center:self', 'live-location:respond',
  'policies:self'
]::text[]
where slug = 'employee' or key = 'EMPLOYEE';

update public.roles
set permissions = array[
  'dashboard:view', 'employees:view', 'reports:export', 'executive:report',
  'executive:mobile', 'executive:presence-map', 'live-location:request',
  'sensitive-actions:approve', 'approvals:manage', 'alerts:manage',
  'control-room:view', 'daily-report:review', 'kpi:executive', 'kpi:final-approve'
]::text[]
where slug = 'executive' or key = 'EXECUTIVE';

-- 3) Optional HR manager seed profile when the environment still has generic local seed data.
do $$
declare
  hr_role_id uuid;
  branch_id uuid;
  dept_id uuid;
  gov_id uuid;
  complex_id uuid;
  secretary_employee_id uuid;
begin
  if to_regclass('public.employees') is null then return; end if;
  select id into hr_role_id from public.roles where slug = 'hr-manager' limit 1;
  select id into branch_id from public.branches limit 1;
  select id into dept_id from public.departments where code = 'HR' limit 1;
  select id into gov_id from public.governorates limit 1;
  select id into complex_id from public.complexes limit 1;
  select id into secretary_employee_id from public.employees where email = 'executive.secretary@organization.local' limit 1;

  if hr_role_id is not null and not exists (select 1 from public.employees where email = 'hr.manager@organization.local') then
    insert into public.employees (full_name, employee_code, phone, email, job_title, role_id, branch_id, department_id, governorate_id, complex_id, manager_employee_id, status, hire_date)
    values ('Ù…Ø¯ÙŠØ± Ø§Ù„Ù…ÙˆØ§Ø±Ø¯ Ø§Ù„Ø¨Ø´Ø±ÙŠØ©', 'EMP-HR', 'PHONE_PLACEHOLDER_044', 'hr.manager@organization.local', 'Ù…Ø¯ÙŠØ± Ø§Ù„Ù…ÙˆØ§Ø±Ø¯ Ø§Ù„Ø¨Ø´Ø±ÙŠØ©', hr_role_id, branch_id, dept_id, gov_id, complex_id, secretary_employee_id, 'ACTIVE', current_date);
  end if;
end $$;

-- 4) KPI workflow columns for staged approvals.
do $$
begin
  if to_regclass('public.kpi_evaluations') is not null then
    alter table public.kpi_evaluations add column if not exists workflow jsonb not null default '[]'::jsonb;
    alter table public.kpi_evaluations add column if not exists hr_notes text;
    alter table public.kpi_evaluations add column if not exists secretary_notes text;
    alter table public.kpi_evaluations add column if not exists executive_notes text;
    alter table public.kpi_evaluations add column if not exists final_score numeric;
    alter table public.kpi_evaluations add column if not exists final_approved_at timestamptz;
  end if;
end $$;

-- 5) Employee self-registration request table for real backend/API implementations.
create table if not exists public.employee_self_registration_log (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references public.employees(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  full_name text not null,
  phone text,
  email text,
  assigned_role text not null default 'employee',
  status text not null default 'ACTIVE',
  created_at timestamptz not null default now()
);

alter table public.employee_self_registration_log enable row level security;
drop policy if exists "admins_hr_view_self_registration_log" on public.employee_self_registration_log;
create policy "admins_hr_view_self_registration_log"
  on public.employee_self_registration_log
  for select
  using (exists (
    select 1 from public.profiles p 
    left join public.roles r on r.id = p.role_id 
    where p.id = auth.uid() and r.slug in ('admin','executive-secretary','hr-manager')
  ));

-- 6) Store version marker.
do $$
begin
  if to_regclass('public.system_settings') is not null then
    insert into public.system_settings(key, value)
    values ('web_role_kpi_workflow_version', '"1.2.2-kpi-cycle-control"'::jsonb)
    on conflict (key) do update set value = excluded.value;
  end if;
end $$;


-- END PATCH: 036_role_kpi_workflow_access.sql


-- =========================================================
-- BEGIN PATCH: 037_kpi_policy_window_hr_scoring.sql
-- =========================================================

-- =========================================================
-- 037 KPI Policy Window + HR-only scoring fields
-- ØªÙ‚ÙŠÙŠÙ… Ø§Ù„Ø£Ø¯Ø§Ø¡ Ø§Ù„Ø´Ù‡Ø±ÙŠ: Ù…Ù† ÙŠÙˆÙ… 20 Ø¥Ù„Ù‰ ÙŠÙˆÙ… 25
-- HR ÙÙ‚Ø·: Ø§Ù„Ø­Ø¶ÙˆØ± ÙˆØ§Ù„Ø§Ù†ØµØ±Ø§ÙØŒ Ø§Ù„ØµÙ„Ø§Ø© ÙÙŠ Ø§Ù„Ù…Ø³Ø¬Ø¯ØŒ Ø­Ù„Ù‚Ø© Ø§Ù„Ø´ÙŠØ® ÙˆÙ„ÙŠØ¯ ÙŠÙˆØ³Ù Ø§Ù„Ø£Ø³Ø¨ÙˆØ¹ÙŠØ© Ù„ØªØ¯Ø±ÙŠØ³ Ø§Ù„Ù‚Ø±Ø¢Ù† ÙˆØ§Ù„ØªØ¬ÙˆÙŠØ¯
-- =========================================================

alter table if exists public.kpi_evaluations
  add column if not exists meeting_held boolean default false,
  add column if not exists hr_notes text,
  add column if not exists submitted_to_manager_at timestamptz,
  add column if not exists manager_reviewed_at timestamptz,
  add column if not exists hr_reviewed_at timestamptz,
  add column if not exists secretary_reviewed_at timestamptz,
  add column if not exists executive_approved_at timestamptz;

create table if not exists public.kpi_policy (
  id text primary key default 'default',
  evaluation_start_day integer not null default 20 check (evaluation_start_day between 1 and 31),
  evaluation_end_day integer not null default 25 check (evaluation_end_day between 1 and 31),
  submission_deadline_day integer not null default 25 check (submission_deadline_day between 1 and 31),
  meeting_required boolean not null default true,
  total_score integer not null default 100,
  hr_only_codes text[] not null default array['ATTENDANCE_COMMITMENT','MOSQUE_PRAYER','QURAN_CIRCLE'],
  updated_at timestamptz not null default now()
);

insert into public.kpi_policy (
  id,
  evaluation_start_day,
  evaluation_end_day,
  submission_deadline_day,
  meeting_required,
  total_score,
  hr_only_codes
) values (
  'default',
  20,
  25,
  25,
  true,
  100,
  array['ATTENDANCE_COMMITMENT','MOSQUE_PRAYER','QURAN_CIRCLE']
)
on conflict (id) do update set
  evaluation_start_day = excluded.evaluation_start_day,
  evaluation_end_day = excluded.evaluation_end_day,
  submission_deadline_day = excluded.submission_deadline_day,
  meeting_required = excluded.meeting_required,
  total_score = excluded.total_score,
  hr_only_codes = excluded.hr_only_codes,
  updated_at = now();

-- Ù…Ø±Ø¬Ø¹ Ù…Ø¹Ø§ÙŠÙŠØ± KPI Ø§Ù„Ø±Ø³Ù…ÙŠ Ø¯Ø§Ø®Ù„ Ù‚Ø§Ø¹Ø¯Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ù„Ù…Ù† ÙŠØ±ÙŠØ¯ Ø§Ø³ØªØ®Ø¯Ø§Ù…Ù‡ ÙÙŠ Ø§Ù„ØªÙ‚Ø§Ø±ÙŠØ±.
create table if not exists public.kpi_criteria_policy (
  code text primary key,
  name text not null,
  max_score numeric not null,
  scoring_owner text not null check (scoring_owner in ('employee_manager','hr_only')),
  sort_order integer not null
);

insert into public.kpi_criteria_policy (code, name, max_score, scoring_owner, sort_order) values
  ('TARGET', 'ØªØ­Ù‚ÙŠÙ‚ Ø§Ù„Ø£Ù‡Ø¯Ø§Ù', 40, 'employee_manager', 1),
  ('TASK_EFFICIENCY', 'Ø§Ù„ÙƒÙØ§Ø¡Ø© ÙÙŠ Ø£Ø¯Ø§Ø¡ Ø§Ù„Ù…Ù‡Ø§Ù…', 20, 'employee_manager', 2),
  ('ATTENDANCE_COMMITMENT', 'Ø§Ù„Ø§Ù„ØªØ²Ø§Ù… Ø¨Ù…ÙˆØ§Ø¹ÙŠØ¯ Ø§Ù„Ø¹Ù…Ù„ Ø­Ø¶ÙˆØ±Ù‹Ø§ ÙˆØ§Ù†ØµØ±Ø§ÙÙ‹Ø§', 20, 'hr_only', 3),
  ('CONDUCT', 'Ø­Ø³Ù† Ø§Ù„ØªØ¹Ø§Ù…Ù„ ÙˆØ§Ù„Ø³Ù„ÙˆÙƒ Ù…Ø¹ Ø§Ù„Ø²Ù…Ù„Ø§Ø¡ ÙˆØ§Ù„Ù…Ø¯ÙŠØ±ÙŠÙ†', 5, 'employee_manager', 4),
  ('MOSQUE_PRAYER', 'Ø§Ù„Ø§Ù„ØªØ²Ø§Ù… Ø¨Ø§Ù„ØµÙ„Ø§Ø© ÙÙŠ Ø§Ù„Ù…Ø³Ø¬Ø¯', 5, 'hr_only', 5),
  ('QURAN_CIRCLE', 'Ø­Ø¶ÙˆØ± Ø­Ù„Ù‚Ø© Ø§Ù„Ø´ÙŠØ® ÙˆÙ„ÙŠØ¯ ÙŠÙˆØ³Ù Ø§Ù„Ø£Ø³Ø¨ÙˆØ¹ÙŠØ© Ù„ØªØ¯Ø±ÙŠØ³ Ø§Ù„Ù‚Ø±Ø¢Ù† ÙˆØ§Ù„ØªØ¬ÙˆÙŠØ¯', 5, 'hr_only', 6),
  ('INITIATIVES_DONATIONS', 'Ø§Ù„Ù…Ø´Ø§Ø±ÙƒØ© ÙÙŠ Ø§Ù„ØªØ¨Ø±Ø¹Ø§Øª ÙˆØ§Ù„Ù…Ø¨Ø§Ø¯Ø±Ø§Øª', 5, 'employee_manager', 7)
on conflict (code) do update set
  name = excluded.name,
  max_score = excluded.max_score,
  scoring_owner = excluded.scoring_owner,
  sort_order = excluded.sort_order;

-- ØªØ£ÙƒÙŠØ¯ ØµÙ„Ø§Ø­ÙŠØ© Ø§Ø¹ØªÙ…Ø§Ø¯ Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ Ø§Ù„Ù†Ù‡Ø§Ø¦ÙŠ Ù„Ù„ØªÙ‚ÙŠÙŠÙ…Ø§Øª.
update public.roles
set permissions = (
  select array_agg(distinct permission)
  from unnest(coalesce(permissions, '{}') || array['kpi:executive','kpi:final-approve']) as permission
)
where slug in ('executive') or key = 'EXECUTIVE';

-- ØªØ£ÙƒÙŠØ¯ ØµÙ„Ø§Ø­ÙŠØ§Øª HR Ù„Ù…Ø±Ø§Ø¬Ø¹Ø© Ø¨Ù†ÙˆØ¯Ù‡ ÙÙ‚Ø·ØŒ ÙˆØ§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„Ù…Ø¨Ø§Ø´Ø± Ù„Ø¨Ù†ÙˆØ¯ Ø§Ù„ÙØ±ÙŠÙ‚.
update public.roles
set permissions = (
  select array_agg(distinct permission)
  from unnest(coalesce(permissions, '{}') || array['kpi:hr','hr:attendance','employees:read']) as permission
)
where slug in ('hr-manager') or key = 'HR_MANAGER';

update public.roles
set permissions = (
  select array_agg(distinct permission)
  from unnest(coalesce(permissions, '{}') || array['kpi:team','team:read']) as permission
)
where slug in ('manager', 'direct-manager', 'operations-manager-1', 'operations-manager-2') or key in ('MANAGER', 'DIRECT_MANAGER');

comment on table public.kpi_policy is 'Ø§Ù„Ø³ÙŠØ§Ø³Ø© Ø§Ù„Ø±Ø³Ù…ÙŠØ© Ù„ØªÙ‚ÙŠÙŠÙ… KPI: Ù…Ù† ÙŠÙˆÙ… 20 Ø¥Ù„Ù‰ 25ØŒ Ø¢Ø®Ø± ØªØ³Ù„ÙŠÙ… ÙŠÙˆÙ… 25ØŒ ÙˆØ¥Ø¬Ù…Ø§Ù„ÙŠ 100 Ø¯Ø±Ø¬Ø©.';
comment on table public.kpi_criteria_policy is 'ØªØ¹Ø±ÙŠÙ Ù…Ø¹Ø§ÙŠÙŠØ± KPI Ø§Ù„Ø±Ø³Ù…ÙŠØ© ÙˆØªØ­Ø¯ÙŠØ¯ Ø§Ù„Ø¨Ù†ÙˆØ¯ Ø§Ù„Ø®Ø§ØµØ© Ø¨Ù€ HR ÙÙ‚Ø·.';


-- END PATCH: 037_kpi_policy_window_hr_scoring.sql


-- =========================================================
-- BEGIN PATCH: 038_kpi_cycle_control_reports.sql
-- =========================================================

-- =========================================================
-- 038 KPI Cycle Control + Stage Reports
-- Ù†Ø³Ø®Ø© Ø§Ù„ÙˆÙŠØ¨: v1.2.2-kpi-cycle-control
-- Ø§Ù„Ù‡Ø¯Ù:
-- 1) ØªØ«Ø¨ÙŠØª Ù†Ø§ÙØ°Ø© Ø§Ù„ØªÙ‚ÙŠÙŠÙ… Ù…Ù† ÙŠÙˆÙ… 20 Ø¥Ù„Ù‰ 25.
-- 2) Ø¥Ø¶Ø§ÙØ© Ø£Ø¹Ù…Ø¯Ø© Ø¥ØºÙ„Ø§Ù‚/Ù‚ÙÙ„ Ø¯ÙˆØ±Ø© KPI.
-- 3) Ø¥Ø¶Ø§ÙØ© View Ù„Ù…ØªØ§Ø¨Ø¹Ø© Ù…Ø±Ø§Ø­Ù„ Ø§Ù„Ø§Ø¹ØªÙ…Ø§Ø¯ Ù…Ù† Ø§Ù„Ù…ÙˆØ¸Ù Ø­ØªÙ‰ Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ.
-- 4) Ø¥Ø¶Ø§ÙØ© Ù…Ø¤Ø´Ø±Ø§Øª ØªÙ†Ø¨ÙŠÙ‡ Ù„Ù„Ù…ØªØ£Ø®Ø±ÙŠÙ† Ø­Ø³Ø¨ Ø§Ù„Ù…Ø±Ø­Ù„Ø©.
-- =========================================================

create table if not exists public.kpi_cycles (
  id text primary key,
  name text not null,
  starts_on date,
  ends_on date,
  due_on date,
  status text not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.kpi_cycles
  add column if not exists locked_at timestamptz,
  add column if not exists locked_by_user_id uuid,
  add column if not exists final_report_generated_at timestamptz,
  add column if not exists window_start_day int default 20,
  add column if not exists window_end_day int default 25,
  add column if not exists submission_deadline_day int default 25;

alter table if exists public.kpi_evaluations
  add column if not exists self_submitted_at timestamptz,
  add column if not exists manager_approved_at timestamptz,
  add column if not exists hr_reviewed_at timestamptz,
  add column if not exists secretary_reviewed_at timestamptz,
  add column if not exists executive_approved_at timestamptz,
  add column if not exists locked_at timestamptz,
  add column if not exists locked_by_user_id uuid,
  add column if not exists escalation_note text;

update public.kpi_cycles
set window_start_day = coalesce(window_start_day, 20),
    window_end_day = coalesce(window_end_day, 25),
    submission_deadline_day = coalesce(submission_deadline_day, 25)
where true;

update public.kpi_evaluations
set self_submitted_at = coalesce(self_submitted_at, submitted_at)
where status in ('SELF_SUBMITTED', 'MANAGER_APPROVED', 'HR_REVIEWED', 'SECRETARY_REVIEWED', 'EXECUTIVE_APPROVED', 'APPROVED')
  and self_submitted_at is null;

create or replace view public.kpi_cycle_stage_report as
select
  kc.id as cycle_id,
  kc.name as cycle_name,
  kc.starts_on,
  kc.ends_on,
  kc.due_on,
  kc.status as cycle_status,
  count(ke.id) as total_evaluations,
  count(*) filter (where ke.status = 'DRAFT') as draft_count,
  count(*) filter (where ke.status = 'SELF_SUBMITTED') as waiting_manager_count,
  count(*) filter (where ke.status = 'MANAGER_APPROVED') as waiting_hr_count,
  count(*) filter (where ke.status = 'HR_REVIEWED') as waiting_secretary_count,
  count(*) filter (where ke.status = 'SECRETARY_REVIEWED') as waiting_executive_count,
  count(*) filter (where ke.status in ('EXECUTIVE_APPROVED', 'APPROVED')) as final_approved_count,
  round(avg(ke.total_score)::numeric, 2) as average_score
from public.kpi_cycles kc
left join public.kpi_evaluations ke on ke.cycle_id = kc.id
group by kc.id, kc.name, kc.starts_on, kc.ends_on, kc.due_on, kc.status;

create or replace view public.kpi_employee_stage_report as
select
  ke.id,
  ke.cycle_id,
  ke.employee_id,
  e.full_name as employee_name,
  ke.manager_employee_id,
  m.full_name as manager_name,
  ke.status,
  case ke.status
    when 'DRAFT' then 'Ù„Ù… ÙŠØ¨Ø¯Ø£'
    when 'SELF_SUBMITTED' then 'Ø¨Ø§Ù†ØªØ¸Ø§Ø± Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„Ù…Ø¨Ø§Ø´Ø±'
    when 'MANAGER_APPROVED' then 'Ø¨Ø§Ù†ØªØ¸Ø§Ø± HR'
    when 'HR_REVIEWED' then 'Ø¨Ø§Ù†ØªØ¸Ø§Ø± Ø§Ù„Ø³ÙƒØ±ØªÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ'
    when 'SECRETARY_REVIEWED' then 'Ø¨Ø§Ù†ØªØ¸Ø§Ø± Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ'
    when 'EXECUTIVE_APPROVED' then 'Ø§Ø¹ØªÙ…Ø§Ø¯ Ù†Ù‡Ø§Ø¦ÙŠ'
    when 'APPROVED' then 'Ø§Ø¹ØªÙ…Ø§Ø¯ Ù†Ù‡Ø§Ø¦ÙŠ'
    else coalesce(ke.status, 'Ù…Ø³ÙˆØ¯Ø©')
  end as stage_label,
  ke.total_score,
  ke.grade,
  ke.rating,
  ke.self_submitted_at,
  ke.manager_approved_at,
  ke.hr_reviewed_at,
  ke.secretary_reviewed_at,
  ke.executive_approved_at,
  ke.locked_at
from public.kpi_evaluations ke
left join public.employees e on e.id = ke.employee_id
left join public.employees m on m.id = ke.manager_employee_id;

do $$
begin
  if to_regclass('public.settings') is not null then
    insert into public.settings (key, value)
    values
      ('web_production_version', '"1.2.2-kpi-cycle-control"'::jsonb),
      ('kpi_cycle_control_patch', '"038_kpi_cycle_control_reports.sql"'::jsonb)
    on conflict (key) do update set value = excluded.value;
  elsif to_regclass('public.system_settings') is not null then
    insert into public.system_settings (key, value)
    values
      ('web_production_version', '"1.2.2-kpi-cycle-control"'::jsonb),
      ('kpi_cycle_control_patch', '"038_kpi_cycle_control_reports.sql"'::jsonb)
    on conflict (key) do update set value = excluded.value;
  end if;
end $$;

-- Ù…Ù„Ø§Ø­Ø¸Ø©: Ù…Ù†Ø¹ Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ù…ÙˆØ¸Ù/Ø§Ù„Ù…Ø¯ÙŠØ± Ø®Ø§Ø±Ø¬ Ù†Ø§ÙØ°Ø© 20-25 Ù…Ø·Ø¨Ù‚ ÙÙŠ Ø·Ø¨Ù‚Ø© Ø§Ù„ÙˆÙŠØ¨ØŒ
-- ÙˆØ¹Ù†Ø¯ Ø§Ù„Ø¥Ù†ØªØ§Ø¬ ÙŠÙ…ÙƒÙ† Ø¥Ø¶Ø§ÙØ© RPC/Trigger ØµØ§Ø±Ù… Ø¥Ø°Ø§ Ø±ØºØ¨Øª ÙÙŠ Ù…Ù†Ø¹ Ø£ÙŠ ÙƒØªØ§Ø¨Ø© Ù…Ø¨Ø§Ø´Ø±Ø© Ù…Ù† Ø®Ø§Ø±Ø¬ Ø§Ù„ÙˆØ§Ø¬Ù‡Ø©.


-- END PATCH: 038_kpi_cycle_control_reports.sql


-- =========================================================
-- BEGIN PATCH: 039_management_hr_reports_workflow.sql
-- =========================================================

-- =========================================================
-- 039 Management Structure + HR Operations + Reports Workflow
-- Ù†Ø³Ø®Ø© Ø§Ù„ÙˆÙŠØ¨: v1.3.0-management-hr-reports
-- Ø§Ù„Ù‡Ø¯Ù:
-- 1) ØªØ«Ø¨ÙŠØª ØµÙ„Ø§Ø­ÙŠØ§Øª Ù‡ÙŠÙƒÙ„ Ø§Ù„Ø¥Ø¯Ø§Ø±Ø© ÙˆØ§Ù„ÙØ±Ù‚.
-- 2) Ø¥Ø¶Ø§ÙØ© Ù…Ø³Ø§Ø± ÙˆØ§Ø¶Ø­ Ù„Ù„Ù…Ø¯ÙŠØ± Ø§Ù„Ù…Ø¨Ø§Ø´Ø± ÙˆØ¹Ù…Ù„ÙŠØ§Øª HR.
-- 3) ØªÙ‚ÙˆÙŠØ© Workflow Ø§Ù„Ø´ÙƒØ§ÙˆÙ‰ ÙˆØ§Ù„ØªØµØ¹ÙŠØ¯.
-- 4) ØªØ¬Ù‡ÙŠØ² Views Ù„Ù„ØªÙ‚Ø§Ø±ÙŠØ± ÙˆØ§Ù„ØªØµØ¯ÙŠØ±.
-- =========================================================

insert into public.permissions (scope, name)
values
  ('organization:manage', 'Ø¥Ø¯Ø§Ø±Ø© Ù‡ÙŠÙƒÙ„ Ø§Ù„Ø¥Ø¯Ø§Ø±Ø© ÙˆØ§Ù„ÙØ±Ù‚'),
  ('team:dashboard', 'Ù„ÙˆØ­Ø© Ø§Ù„ÙØ±ÙŠÙ‚ Ù„Ù„Ù…Ø¯ÙŠØ± Ø§Ù„Ù…Ø¨Ø§Ø´Ø±'),
  ('hr:operations', 'Ù„ÙˆØ­Ø© Ø¹Ù…Ù„ÙŠØ§Øª Ø§Ù„Ù…ÙˆØ§Ø±Ø¯ Ø§Ù„Ø¨Ø´Ø±ÙŠØ©'),
  ('disputes:escalate', 'ØªØµØ¹ÙŠØ¯ Ø§Ù„Ø´ÙƒØ§ÙˆÙ‰ Ù„Ù„Ø³ÙƒØ±ØªÙŠØ± ÙˆØ§Ù„ØªÙ†ÙÙŠØ°ÙŠ'),
  ('reports:pdf', 'ØªØµØ¯ÙŠØ± ØªÙ‚Ø§Ø±ÙŠØ± PDF/HTML'),
  ('reports:excel', 'ØªØµØ¯ÙŠØ± ØªÙ‚Ø§Ø±ÙŠØ± Excel/CSV')
on conflict (scope) do update set name = excluded.name;

update public.roles
set permissions = array(select distinct unnest(coalesce(permissions, '{}') || array['organization:manage','team:dashboard','hr:operations','disputes:escalate','reports:pdf','reports:excel']))
where slug in ('admin', 'executive-secretary') or key in ('ADMIN', 'EXECUTIVE_SECRETARY');

update public.roles
set permissions = array(select distinct unnest(coalesce(permissions, '{}') || array['hr:operations','team:dashboard','disputes:escalate','reports:pdf','reports:excel']))
where slug = 'hr-manager' or key = 'HR_MANAGER';

update public.roles
set permissions = array(select distinct unnest(coalesce(permissions, '{}') || array['team:dashboard','disputes:escalate','reports:pdf','reports:excel']))
where slug in ('manager', 'direct-manager') or key in ('MANAGER', 'DIRECT_MANAGER');

update public.roles
set permissions = array(select distinct unnest(coalesce(permissions, '{}') || array['reports:pdf','reports:excel','disputes:escalate']))
where slug = 'executive' or key = 'EXECUTIVE';

alter table if exists public.employees
  add column if not exists manager_assigned_at timestamptz,
  add column if not exists manager_assignment_note text;

alter table if exists public.dispute_cases
  add column if not exists current_stage text default 'manager_review',
  add column if not exists assigned_committee_employee_ids uuid[] default '{}',
  add column if not exists secretary_reviewed_at timestamptz,
  add column if not exists executive_decision_at timestamptz,
  add column if not exists escalation_reason text;

create or replace view public.management_team_report as
select
  manager.id as manager_employee_id,
  manager.full_name as manager_name,
  manager.job_title as manager_job_title,
  count(team.id) as team_count,
  count(team.id) filter (where team.status = 'ACTIVE') as active_team_count,
  count(team.id) filter (where team.manager_employee_id is null) as missing_manager_count
from public.employees manager
left join public.roles r on r.id = manager.role_id
left join public.employees team on team.manager_employee_id = manager.id and coalesce(team.is_deleted, false) = false
where coalesce(manager.is_deleted, false) = false
  and r.slug in ('manager', 'direct-manager', 'hr-manager', 'executive', 'executive-secretary', 'admin')
group by manager.id, manager.full_name, manager.job_title;

create or replace view public.hr_operations_report as
select
  e.id as employee_id,
  e.full_name as employee_name,
  e.job_title,
  e.status,
  e.manager_employee_id,
  m.full_name as manager_name,
  case when e.manager_employee_id is null and r.slug = 'employee' then true else false end as missing_manager,
  case when e.phone is null or e.phone = '' then true else false end as missing_phone,
  case when e.email is null or e.email = '' then true else false end as missing_email
from public.employees e
left join public.employees m on m.id = e.manager_employee_id
left join public.roles r on r.id = e.role_id
where coalesce(e.is_deleted, false) = false;

create or replace view public.dispute_workflow_report as
select
  dc.id,
  dc.title,
  dc.employee_id,
  e.full_name as employee_name,
  dc.status,
  coalesce(dc.current_stage, dc.status, 'open') as current_stage,
  dc.severity as priority,
  dc.committee_decision,
  dc.escalated_to_executive,
  dc.created_at,
  dc.updated_at
from public.dispute_cases dc
left join public.employees e on e.id = dc.employee_id;

do $$
begin
  if to_regclass('public.settings') is not null then
    insert into public.settings (key, value)
    values
      ('web_production_version', '"1.3.0-management-hr-reports"'::jsonb),
      ('latest_required_patch', '"039_management_hr_reports_workflow.sql"'::jsonb)
    on conflict (key) do update set value = excluded.value;
  elsif to_regclass('public.system_settings') is not null then
    insert into public.system_settings (key, value)
    values
      ('web_production_version', '"1.3.0-management-hr-reports"'::jsonb),
      ('latest_required_patch', '"039_management_hr_reports_workflow.sql"'::jsonb)
    on conflict (key) do update set value = excluded.value;
  end if;
end $$;


-- END PATCH: 039_management_hr_reports_workflow.sql


-- =========================================================
-- BEGIN PATCH: 040_runtime_alignment_fix.sql
-- =========================================================

-- =========================================================
-- 040_runtime_alignment_fix.sql
-- Runtime alignment after management + HR reports package.
-- Fixes production blockers discovered in final smoke review:
-- - makes settings/system_settings available for version markers,
-- - upgrades push_subscriptions created by older schema versions,
-- - records migration status for the admin migration screen,
-- - adds indexes/views used by the Supabase web runtime,
-- - keeps role/profile checks based on role_id + roles.slug, not profiles.role.
-- =========================================================

create extension if not exists pgcrypto;

create table if not exists public.system_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  description text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  description text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.database_migration_status (
  id text primary key default gen_random_uuid()::text,
  name text unique not null,
  status text not null default 'APPLIED',
  applied_at timestamptz not null default now(),
  applied_by_user_id uuid references auth.users(id),
  notes text not null default ''
);

alter table if exists public.roles
  add column if not exists description text default '';

-- Backward-compatible defaults/columns for operational runtime tables created by earlier patches.
alter table if exists public.database_migration_status
  alter column id set default gen_random_uuid()::text,
  add column if not exists applied_at timestamptz not null default now(),
  add column if not exists applied_by_user_id uuid,
  add column if not exists notes text not null default '';

alter table if exists public.attendance_rule_runs
  alter column id set default gen_random_uuid()::text,
  add column if not exists status text not null default 'COMPLETED',
  add column if not exists total_employees integer not null default 0,
  add column if not exists issues_count integer not null default 0,
  add column if not exists result jsonb not null default '{}'::jsonb;

alter table if exists public.system_backups
  add column if not exists title text,
  add column if not exists snapshot jsonb not null default '{}'::jsonb,
  add column if not exists status text not null default 'COMPLETED',
  add column if not exists name text,
  add column if not exists summary jsonb not null default '{}'::jsonb;

alter table if exists public.push_subscriptions
  add column if not exists employee_id uuid references public.employees(id) on delete cascade,
  add column if not exists payload jsonb not null default '{}'::jsonb,
  add column if not exists keys jsonb not null default '{}'::jsonb,
  add column if not exists user_agent text,
  add column if not exists platform text,
  add column if not exists is_active boolean not null default true,
  add column if not exists updated_at timestamptz not null default now();

update public.push_subscriptions
set keys = coalesce(nullif(keys, '{}'::jsonb), payload -> 'keys', '{}'::jsonb),
    updated_at = coalesce(updated_at, created_at, now())
where to_regclass('public.push_subscriptions') is not null;

create table if not exists public.notification_delivery_log (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid references public.notifications(id) on delete set null,
  push_subscription_id uuid references public.push_subscriptions(id) on delete set null,
  target_user_id uuid references auth.users(id) on delete set null,
  status text not null default 'QUEUED',
  provider_response jsonb,
  error text,
  created_at timestamptz not null default now()
);

alter table public.system_settings enable row level security;
alter table public.settings enable row level security;
alter table public.database_migration_status enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.notification_delivery_log enable row level security;

drop policy if exists "system_settings_read_admin" on public.system_settings;
create policy "system_settings_read_admin" on public.system_settings
  for select to authenticated
  using (public.current_is_full_access() or public.has_any_permission(array['settings:manage','database:migrations']));

drop policy if exists "system_settings_write_admin" on public.system_settings;
create policy "system_settings_write_admin" on public.system_settings
  for all to authenticated
  using (public.current_is_full_access() or public.has_any_permission(array['settings:manage','database:migrations']))
  with check (public.current_is_full_access() or public.has_any_permission(array['settings:manage','database:migrations']));

drop policy if exists "settings_read_admin" on public.settings;
create policy "settings_read_admin" on public.settings
  for select to authenticated
  using (public.current_is_full_access() or public.has_any_permission(array['settings:manage','database:migrations']));

drop policy if exists "settings_write_admin" on public.settings;
create policy "settings_write_admin" on public.settings
  for all to authenticated
  using (public.current_is_full_access() or public.has_any_permission(array['settings:manage','database:migrations']))
  with check (public.current_is_full_access() or public.has_any_permission(array['settings:manage','database:migrations']));

drop policy if exists "database_migration_status_admin" on public.database_migration_status;
create policy "database_migration_status_admin" on public.database_migration_status
  for all to authenticated
  using (public.current_is_full_access() or public.has_any_permission(array['database:migrations','settings:manage']))
  with check (public.current_is_full_access() or public.has_any_permission(array['database:migrations','settings:manage']));

drop policy if exists "push_subscriptions_own_or_admin" on public.push_subscriptions;
create policy "push_subscriptions_own_or_admin" on public.push_subscriptions
  for all to authenticated
  using (user_id = auth.uid() or employee_id = public.current_employee_id() or public.current_is_full_access() or public.has_any_permission(array['notifications:manage','alerts:manage']))
  with check (user_id = auth.uid() or employee_id = public.current_employee_id() or public.current_is_full_access() or public.has_any_permission(array['notifications:manage','alerts:manage']));

drop policy if exists "notification_delivery_log_admin" on public.notification_delivery_log;
create policy "notification_delivery_log_admin" on public.notification_delivery_log
  for select to authenticated
  using (public.current_is_full_access() or public.has_any_permission(array['notifications:manage','alerts:manage']));

create index if not exists idx_push_subscriptions_active_user on public.push_subscriptions(user_id) where is_active = true;
create index if not exists idx_push_subscriptions_active_employee on public.push_subscriptions(employee_id) where is_active = true;
create index if not exists idx_notifications_employee_created on public.notifications(employee_id, created_at desc);
create index if not exists idx_kpi_evaluations_cycle_status on public.kpi_evaluations(cycle_id, status);
create index if not exists idx_dispute_cases_status_updated on public.dispute_cases(status, updated_at desc);

insert into public.database_migration_status (name, status, notes)
values
  ('035_final_sanitization_live_readiness.sql', 'APPLIED', 'Runtime-aligned by patch 040'),
  ('036_role_kpi_workflow_access.sql', 'APPLIED', 'Runtime-aligned by patch 040'),
  ('037_kpi_policy_window_hr_scoring.sql', 'APPLIED', 'Runtime-aligned by patch 040'),
  ('038_kpi_cycle_control_reports.sql', 'APPLIED', 'Runtime-aligned by patch 040'),
  ('039_management_hr_reports_workflow.sql', 'APPLIED', 'Runtime-aligned by patch 040'),
  ('040_runtime_alignment_fix.sql', 'APPLIED', 'Final runtime alignment')
on conflict (name) do update set status = excluded.status, notes = excluded.notes, applied_at = now();

insert into public.system_settings (key, value, description)
values
  ('web_production_version', '"1.3.1-runtime-alignment"'::jsonb, 'Final production runtime alignment package'),
  ('latest_required_patch', '"040_runtime_alignment_fix.sql"'::jsonb, 'Latest required SQL patch for this package'),
  ('push_notifications_ready', 'true'::jsonb, 'push_subscriptions/notification_delivery_log schema aligned with Edge Function')
on conflict (key) do update set value = excluded.value, description = excluded.description, updated_at = now();

insert into public.settings (key, value, description)
values
  ('web_production_version', '"1.3.1-runtime-alignment"'::jsonb, 'Final production runtime alignment package'),
  ('latest_required_patch', '"040_runtime_alignment_fix.sql"'::jsonb, 'Latest required SQL patch for this package')
on conflict (key) do update set value = excluded.value, description = excluded.description, updated_at = now();

-- Keep the reporting views replaceable even when patch 039 was not applied cleanly before 040.
create or replace view public.management_team_report as
select
  manager.id as manager_employee_id,
  manager.full_name as manager_name,
  manager.job_title as manager_job_title,
  count(team.id) as team_count,
  count(team.id) filter (where team.status = 'ACTIVE') as active_team_count,
  count(team.id) filter (where team.manager_employee_id is null) as missing_manager_count
from public.employees manager
left join public.roles r on r.id = manager.role_id
left join public.employees team on team.manager_employee_id = manager.id and coalesce(team.is_deleted, false) = false
where coalesce(manager.is_deleted, false) = false
  and coalesce(r.slug, '') in ('manager', 'direct-manager', 'hr-manager', 'executive', 'executive-secretary', 'admin')
group by manager.id, manager.full_name, manager.job_title;

create or replace view public.hr_operations_report as
select
  e.id as employee_id,
  e.full_name as employee_name,
  e.job_title,
  e.status,
  e.manager_employee_id,
  m.full_name as manager_name,
  case when e.manager_employee_id is null and coalesce(r.slug, '') = 'employee' then true else false end as missing_manager,
  case when coalesce(e.phone, '') = '' then true else false end as missing_phone,
  case when coalesce(e.email, '') = '' then true else false end as missing_email
from public.employees e
left join public.employees m on m.id = e.manager_employee_id
left join public.roles r on r.id = e.role_id
where coalesce(e.is_deleted, false) = false;

create or replace view public.dispute_workflow_report as
select
  dc.id,
  dc.title,
  dc.employee_id,
  e.full_name as employee_name,
  dc.status,
  coalesce(dc.current_stage, dc.status, 'open') as current_stage,
  dc.severity as priority,
  dc.committee_decision,
  dc.escalated_to_executive,
  dc.created_at,
  dc.updated_at
from public.dispute_cases dc
left join public.employees e on e.id = dc.employee_id;


-- END PATCH: 040_runtime_alignment_fix.sql


-- =========================================================
-- BEGIN PATCH: 041_audit_v7_security_mobile_alignment.sql
-- =========================================================

-- =========================================================
-- Patch 041 â€” Audit V7 security/mobile alignment
-- Purpose:
-- 1) Provide a role-based password-vault guard without personal phone rules.
-- 2) Encrypt legacy credential_vault plaintext columns if they exist in older deployments.
-- 3) Keep temporary_password as a legacy boolean flag and document must_change_password usage.
-- =========================================================

begin;

create extension if not exists pgcrypto;

alter table public.profiles
  add column if not exists must_change_password boolean not null default true;

comment on column public.profiles.temporary_password is
  'Legacy boolean flag only. Do not store plaintext passwords here. Use must_change_password for login policy.';
comment on column public.profiles.must_change_password is
  'Boolean login policy flag that forces the user to change a temporary password after login.';

create or replace function public.current_can_view_password_vault()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles p
    left join public.roles r on r.id = p.role_id
    where p.id = auth.uid()
      and (
        coalesce(r.slug, '') in ('admin', 'hr-manager')
        or coalesce(r.key, '') in ('ADMIN', 'HR_MANAGER')
        or '*' = any(coalesce(r.permissions, '{}'::text[]))
        or 'users:manage' = any(coalesce(r.permissions, '{}'::text[]))
      )
  );
$$;

grant execute on function public.current_can_view_password_vault() to authenticated;

-- Upgrade older deployments that may still have public.credential_vault with plaintext fields.
do $$
declare
  vault_key text := coalesce(nullif(current_setting('app.vault_key', true), ''), nullif(current_setting('app.jwt_secret', true), ''), 'change-this-vault-key-before-production');
begin
  if to_regclass('public.credential_vault') is not null then
    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'credential_vault' and column_name = 'encrypted_temporary_password'
    ) then
      alter table public.credential_vault add column encrypted_temporary_password bytea;
    end if;

    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'credential_vault' and column_name = 'temporary_password'
    ) then
      execute 'update public.credential_vault
              set encrypted_temporary_password = pgp_sym_encrypt(temporary_password::text, $1)
              where encrypted_temporary_password is null and temporary_password is not null'
      using vault_key;
    end if;

    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'credential_vault' and column_name = 'temp_password'
    ) then
      execute 'update public.credential_vault
              set encrypted_temporary_password = pgp_sym_encrypt(temp_password::text, $1)
              where encrypted_temporary_password is null and temp_password is not null'
      using vault_key;
    end if;

    alter table public.credential_vault enable row level security;

    drop policy if exists credential_vault_role_guard_select on public.credential_vault;
    create policy credential_vault_role_guard_select
      on public.credential_vault
      for select
      using (public.current_can_view_password_vault());
  end if;
end $$;

insert into public.system_settings (key, value, description, updated_at)
values (
  'audit_v7_security_mobile_alignment',
  jsonb_build_object(
    'patch', '041_audit_v7_security_mobile_alignment.sql',
    'serviceWorkerSplit', true,
    'employeeMoreSheet', true,
    'passwordVaultRoleGuard', true,
    'legacyCredentialVaultEncrypted', true
  ),
  'Tracks Audit V7 hardening: scoped service workers, employee mobile navigation, and role-based password vault guard.',
  now()
)
on conflict (key) do update set value = excluded.value, description = excluded.description, updated_at = now();

commit;


-- END PATCH: 041_audit_v7_security_mobile_alignment.sql


-- =========================================================
-- BEGIN PATCH: 042_authorized_roster_phone_login_internal_channel.sql
-- =========================================================

-- =========================================================
-- 042 Authorized employee roster + phone login policy
-- Generated from: Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ†.xlsx
-- Purpose:
--   1) Ø§Ø¹ØªÙ…Ø§Ø¯ Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ† Ø§Ù„Ø±Ø³Ù…ÙŠØ© ÙÙ‚Ø·.
--   2) Ø±Ø¨Ø· Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„Ù…Ø¨Ø§Ø´Ø± ÙˆØ±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ ÙˆØ§Ù„Ù…Ø³Ù…Ù‰ Ø§Ù„ÙˆØ¸ÙŠÙÙŠ ÙˆØ§Ù„ØµÙˆØ±Ø©.
--   3) ØªÙØ¹ÙŠÙ„ Ø³ÙŠØ§Ø³Ø© Ø¯Ø®ÙˆÙ„ Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ† Ø¨Ø±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙØŒ ÙˆÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± Ø§Ù„Ø§ÙØªØ±Ø§Ø¶ÙŠØ© = Ø±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ/Ø§Ù„Ø±Ù‚Ù… Ø§Ù„Ø´Ø®ØµÙŠ.
--   4) Ø¥Ø¶Ø§ÙØ© Ù„Ø¬Ù†Ø© Ø­Ù„ Ø§Ù„Ù…Ø´Ø§ÙƒÙ„ ÙˆØ§Ù„Ø®Ù„Ø§ÙØ§Øª ÙˆÙ‚Ù†Ø§Ø© Ø§Ù„ØªÙˆØ§ØµÙ„ Ø§Ù„Ø¯Ø§Ø®Ù„ÙŠ Ù„Ù„ØªØ°ÙƒÙŠØ±Ø§Øª.
-- =========================================================

begin;

insert into public.permissions (scope, name)
values
  ('announcements:manage', 'Ø¥Ø¯Ø§Ø±Ø© Ù‚Ù†Ø§Ø© Ø§Ù„ØªÙˆØ§ØµÙ„ Ø§Ù„Ø¯Ø§Ø®Ù„ÙŠ'),
  ('disputes:committee', 'Ø¹Ø¶ÙˆÙŠØ© Ù„Ø¬Ù†Ø© Ø­Ù„ Ø§Ù„Ù…Ø´Ø§ÙƒÙ„ ÙˆØ§Ù„Ø®Ù„Ø§ÙØ§Øª'),
  ('disputes:manage', 'Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø´ÙƒØ§ÙˆÙ‰ ÙˆÙØ¶ Ø§Ù„Ø®Ù„Ø§ÙØ§Øª')
on conflict (scope) do update set name = excluded.name;

alter table public.employees add column if not exists roster_source text default '';
alter table public.employees add column if not exists phone_login_enabled boolean not null default true;

create table if not exists public.authorized_employee_roster (
  employee_code text primary key,
  full_name text not null,
  phone text not null,
  email text not null,
  photo_url text default '',
  job_title text default '',
  role_slug text not null default 'employee',
  department_code text not null default 'OPS',
  manager_employee_code text default '',
  initial_password_policy text not null default 'PHONE_AS_PASSWORD',
  source_file text not null default 'Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ†.xlsx',
  updated_at timestamptz not null default now()
);

with roster(employee_code, full_name, phone, email, photo_url, job_title, role_slug, department_code, manager_employee_code) as (
  values
    ('AHS-001', 'Ø§Ù„Ø´ÙŠØ® Ù…Ø­Ù…Ø¯ ÙŠÙˆØ³Ù', 'PHONE_PLACEHOLDER_010', 'emp.demo010@ahla.local', 'employee-avatars/emp-executive-director.png', 'Ø§Ù„Ù…Ø¯ÙŠØ± Ù„ØªÙ†ÙÙŠØ°ÙŠ Ù„Ù„Ø¬Ù…Ø¹ÙŠØ©', 'executive', 'EXEC', ''),
    ('AHS-002', 'ÙŠØ­ÙŠÙŠ Ø¬Ù…Ø§Ù„ Ø§Ù„Ø³Ø¨Ø¹', 'PHONE_PLACEHOLDER_083', 'emp.demo083@ahla.local', 'employee-avatars/emp-executive-secretary.png', 'Ø§Ù„Ø³ÙƒØ±ØªÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ + ØªÙƒÙ†ÙˆÙ„ÙˆØ¬ÙŠØ§ Ø§Ù„Ù…Ø¹Ù„ÙˆÙ…Ø§Øª (IT) ÙˆØ§Ù„Ø¨Ø±Ù…Ø¬Ø©', 'executive-secretary', 'EXEC', 'AHS-001'),
    ('AHS-003', 'Ù…Ø­Ù…Ø¯ Ø§Ø¨Ùˆ Ø¹Ù…Ø§Ø±', 'PHONE_PLACEHOLDER_084', 'emp.demo084@ahla.local', 'employee-avatars/emp-direct-manager-01.png', 'Ù…Ø¯ÙŠØ± ØªØ´ØºÙŠÙ„ 1', 'direct-manager', 'MGT', 'AHS-001'),
    ('AHS-004', 'Ù…Ø­Ù…Ø¯ Ø¹Ø¨Ø¯Ø§Ù„Ø¹Ø¸ÙŠÙ… Ù…Ø­Ù…Ø¯', 'PHONE_PLACEHOLDER_072', 'emp.demo072@ahla.local', 'employee-avatars/emp-xlsx-004.png', 'Ù…Ø³Ø¤ÙˆÙ„ Ø§Ù„Ù„Ø¬Ù†Ø© Ø§Ù„Ø·Ø¨ÙŠØ©', 'direct-manager', 'MGT', 'AHS-003'),
    ('AHS-005', 'Ø¨Ù„Ø§Ù„ Ù…Ø­Ù…Ø¯ Ø§Ù„Ø´Ø§ÙƒØ±', 'PHONE_PLACEHOLDER_046', 'emp.demo046@ahla.local', 'employee-avatars/emp-hr-manager.png', 'Ù…Ø³Ø¤ÙˆÙ„ Ø§Ù„Ù…ÙˆØ§Ø±Ø¯ Ø§Ù„Ø¨Ø´Ø±ÙŠØ© + Ø§Ù„Ø§Ø¹Ù„Ø§Ù…', 'hr-manager', 'HR', 'AHS-001'),
    ('AHS-006', 'ÙŠØ§Ø³Ø± ÙØªØ­ÙŠ Ù†ÙˆØ± Ø§Ù„Ø¯ÙŠÙ†', 'PHONE_PLACEHOLDER_082', 'emp.demo082@ahla.local', 'employee-avatars/emp-direct-manager-06.png', 'Ù…Ø¯ÙŠØ± ØªØ´ØºÙŠÙ„ 2', 'direct-manager', 'MGT', 'AHS-001'),
    ('AHS-007', 'Ù…ØµØ·ÙÙŠ ÙØ§ÙŠØ¯', 'PHONE_PLACEHOLDER_014', 'emp.demo014@ahla.local', 'employee-avatars/emp-xlsx-007.png', 'Ù…Ø¯ÙŠØ± Ø§Ù„Ø­Ø³Ø§Ø¨Ø§Øª', 'direct-manager', 'MGT', 'AHS-001'),
    ('AHS-008', 'Ø­Ø§Ù…Ø¯ Ù…Ø­Ù…ÙˆØ¯ Ø§Ù„Ø¹Ù…Ø¯Ø©', 'PHONE_PLACEHOLDER_013', 'emp.demo013@ahla.local', 'employee-avatars/emp-direct-manager-02.png', 'Ù…Ø³Ø¤ÙˆÙ„ Ù„Ø¬Ù†Ø© Ø£Ø³Ø±Ø© ÙƒØ±ÙŠÙ…Ø©', 'direct-manager', 'MGT', 'AHS-003'),
    ('AHS-009', 'Ù…ØµØ·ÙÙŠ Ø§Ø­Ù…Ø¯', 'PHONE_PLACEHOLDER_075', 'emp.demo075@ahla.local', 'employee-avatars/emp-direct-manager-03.png', 'Ø§Ø¯Ø§Ø±Ø© Ø§Ù„Ù„ÙˆØ¬ÙŠØ³ØªÙƒ', 'direct-manager', 'MGT', 'AHS-001'),
    ('AHS-010', 'Ù…Ø­Ù…Ø¯ Ø³ÙŠØ¯', 'PHONE_PLACEHOLDER_019', 'emp.demo019@ahla.local', 'employee-avatars/emp-xlsx-010.png', 'Ù…ÙˆØ¸Ù Ù…Ø´ØªØ±ÙŠØ§Øª', 'employee', 'OPS', 'AHS-009'),
    ('AHS-011', 'Ø­Ø§ØªÙ… Ù…Ø­Ù…Ø¯ Ø³Ø§Ù„Ù…', 'PHONE_PLACEHOLDER_074', 'emp.demo074@ahla.local', 'employee-avatars/emp-xlsx-011.png', 'Ø³Ø§Ø¦Ù‚ Ø§Ù„Ø¹Ø±Ø¨ÙŠØ© Ø¹Ø²ÙŠØ²Ø©', 'employee', 'OPS', 'AHS-009'),
    ('AHS-012', 'Ø±Ø¨ÙŠØ¹ Ù…Ø­Ù…Ø¯ Ø§Ø¨Ùˆ Ø²ÙŠØ¯', 'PHONE_PLACEHOLDER_081', 'emp.demo081@ahla.local', '', 'Ø³Ø§Ø¦Ù‚ Ø§Ù„Ø¹Ø±Ø¨ÙŠØ© Ù…Ø³Ùƒ', 'employee', 'OPS', 'AHS-009'),
    ('AHS-013', 'Ø·Ø§Ø±Ù‚ Ø³ÙŠØ¯ Ø¥Ø¨Ø±Ø§Ù‡ÙŠÙ…', 'PHONE_PLACEHOLDER_012', 'emp.demo012@ahla.local', 'employee-avatars/emp-xlsx-013.png', 'Ù…Ø¯ÙŠØ± Ø§Ù„Ø­Ø±ÙƒØ© Ø³Ø§Ø¦Ù‚ + Ù…Ø·Ø¨Ø® Ø§Ù„Ù…ØªØ¹Ø¹ÙÙŠÙ† 2', 'direct-manager', 'MGT', 'AHS-009'),
    ('AHS-014', 'Ø¹Ù…Ø§Ø± Ù…Ø­Ù…Ø¯ Ø¹Ø¨Ø¯Ø§Ù„Ø¨Ø§Ø³Ø·', 'PHONE_PLACEHOLDER_078', 'emp.demo078@ahla.local', '', 'Ø¬Ø±Ø§ÙÙŠÙƒ Ø¯ÙŠØ²Ø§ÙŠÙ†Ø±', 'employee', 'OPS', 'AHS-005'),
    ('AHS-015', 'Ø§Ø­Ù…Ø¯ Ù…Ø­Ù…Ø¯ Ù…Ø­Ø¬ÙˆØ¨', 'PHONE_PLACEHOLDER_047', 'emp.demo047@ahla.local', 'employee-avatars/emp-direct-manager-04.png', 'Ù…Ø¯ÙŠØ± Ø§Ù„Ø´Ø¤ÙˆÙ† Ø§Ù„Ø§Ø¯Ø§Ø±ÙŠØ©', 'direct-manager', 'MGT', 'AHS-001'),
    ('AHS-016', 'Ø¹Ø¨Ø¯Ø§Ù„Ù„Ù‡ Ø­Ø³ÙŠÙ† Ø­Ø§ÙØ¸', 'PHONE_PLACEHOLDER_076', 'emp.demo076@ahla.local', 'employee-avatars/emp-xlsx-016.png', 'Ø´Ø¤ÙˆÙ† Ø§Ø¯Ø§Ø±ÙŠØ©', 'direct-manager', 'MGT', 'AHS-015'),
    ('AHS-017', 'Ø¹Ø¨Ø¯ Ø§Ù„Ù‚Ø§Ø¯Ø± Ø¬Ù…Ø§Ù„', 'PHONE_PLACEHOLDER_045', 'emp.demo045@ahla.local', 'employee-avatars/emp-xlsx-017.png', 'Ø´Ø¤ÙˆÙ† Ø¥Ø¯Ø§Ø±ÙŠØ©', 'direct-manager', 'MGT', 'AHS-015'),
    ('AHS-018', 'Ù‡Ø§Ù†ÙŠ Ø§Ø­Ù…Ø¯ Ù†ØµÙŠØ±', 'PHONE_PLACEHOLDER_018', 'emp.demo018@ahla.local', 'employee-avatars/emp-xlsx-018.png', 'Ù…Ø³Ø¤ÙˆÙ„ Ø§Ù„Ù…Ø´Ø±ÙˆØ¹Ø§Øª Ùˆ Ø·Ù„Ø§Ø¨ Ø§Ù„Ø¹Ù„Ù…', 'direct-manager', 'MGT', 'AHS-003'),
    ('AHS-019', 'ÙŠÙˆØ³Ù Ø±Ø³Ù…ÙŠ Ø´Ø¹Ø¨Ø§Ù†', 'PHONE_PLACEHOLDER_007', 'emp.demo007@ahla.local', '', 'Ø§Ù„Ù…Ø´Ø±Ù Ø§Ù„ÙÙ†ÙŠ Ù„Ù…Ø¬Ù…Ø¹ Ù…Ù†ÙŠÙ„ Ø´ÙŠØ­Ø©', 'direct-manager', 'MGT', 'AHS-001'),
    ('AHS-020', 'Ø§Ø³Ù…Ø§Ø¹ÙŠÙ„ Ø¹Ø¨Ø¯Ø§Ù„Ù„Ù‡', 'PHONE_PLACEHOLDER_073', 'emp.demo073@ahla.local', 'employee-avatars/emp-xlsx-020.png', 'Ù…ÙˆØ¸Ù Ø¨Ø§Ù„Ù…Ø¬Ù…Ø¹', 'employee', 'OPS', 'AHS-019'),
    ('AHS-021', 'Ø¹Ø¨Ø¯Ø§Ù„Ø±Ø­Ù…Ù† Ø­Ø³ÙŠÙ† Ù…Ø±Ø¹ÙŠ', 'PHONE_PLACEHOLDER_079', 'emp.demo079@ahla.local', 'employee-avatars/emp-xlsx-021.png', 'Ù…ÙˆØ¸Ù Ù„Ø¬Ù†Ø© Ø£Ø³Ø±Ø© ÙƒØ±ÙŠÙ…Ø©', 'employee', 'OPS', 'AHS-008'),
    ('AHS-022', 'Ù…Ø­Ù…Ø¯ Ø¹Ø¨Ø¯Ù‡ Ù…Ø²Ø§Ø±', 'PHONE_PLACEHOLDER_011', 'emp.demo011@ahla.local', '', 'Ø·Ø¨Ø§Ø® Ø¨Ù…Ø¬Ù…Ø¹ Ø£Ø­Ù„Ù‰ Ø´Ø¨Ø§Ø¨', 'employee', 'OPS', 'AHS-019'),
    ('AHS-023', 'Ø­Ø³Ø§Ù… Ø¹ÙÙŠÙÙŠ Ø¬Ù…Ø¹Ø©', 'PHONE_PLACEHOLDER_009', 'emp.demo009@ahla.local', '', 'Ù…ÙˆØ¸Ù Ø¨Ø§Ù„Ù…Ø¬Ù…Ø¹', 'employee', 'OPS', 'AHS-019'),
    ('AHS-024', 'Ù…Ø­Ù…Ø¯ Ø§Ù„Ø§Ù†Ø¯ÙˆÙ†ÙŠØ³ÙŠ', 'PHONE_PLACEHOLDER_077', 'emp.demo077@ahla.local', 'employee-avatars/emp-xlsx-024.png', 'Ù…Ø³Ø¤ÙˆÙ„ Ø§Ù„Ø¯Ø¹Ø§ÙŠØ§', 'direct-manager', 'MGT', 'AHS-006'),
    ('AHS-025', 'ÙŠØ§Ø³ÙŠÙ† Ø·Ø§Ø±Ù‚ Ø§Ù„Ø¨Ø§Ø³Ù„', 'PHONE_PLACEHOLDER_080', 'emp.demo080@ahla.local', '', 'Ù…Ø³Ø¤ÙˆÙ„ Ø§Ù„Ø¯Ø¹Ø§ÙŠØ§', 'direct-manager', 'MGT', 'AHS-006'),
    ('AHS-026', 'Ø¹Ø¨Ø¯ Ø§Ù„Ø¹Ø²ÙŠØ² Ø·Ø§Ø±Ù‚ Ø§Ù„Ø¨Ø§Ø³Ù„', 'PHONE_PLACEHOLDER_008', 'emp.demo008@ahla.local', 'employee-avatars/emp-xlsx-026.png', 'Ù…Ø³Ø¤ÙˆÙ„ Ø³ÙÙŠØ± + Ù…Ø·ÙŠØ® Ø§Ù„Ù…ØªØ¹ÙÙÙŠÙ† 3', 'direct-manager', 'MGT', 'AHS-001'),
    ('AHS-027', 'Ù…Ø­Ù…Ø¯ Ø¹Ø¨Ø¯ Ø§Ù„Ù…Ù†Ø¹Ù…', 'PHONE_PLACEHOLDER_015', 'emp.demo015@ahla.local', '', 'Ù…Ø³Ø¤ÙˆÙ„ Ø§Ù„Ø§Ø³ØªÙƒØ´Ø§Ù', 'direct-manager', 'MGT', 'AHS-001'),
    ('AHS-028', 'Ø¹Ø¨Ø¯Ø§Ø§Ù„Ù„Ù‡ Ù†ØµØ±', 'PHONE_PLACEHOLDER_020', 'emp.demo020@ahla.local', '', 'Ø£Ø¯Ø§Ø±Ø© Ø§Ù„Ù…ØªØ·ÙˆØ¹ÙŠÙ†', 'direct-manager', 'MGT', 'AHS-006')
)
insert into public.authorized_employee_roster (
  employee_code, full_name, phone, email, photo_url, job_title, role_slug, department_code, manager_employee_code
)
select employee_code, full_name, phone, email, photo_url, job_title, role_slug, department_code, manager_employee_code
from roster
on conflict (employee_code) do update set
  full_name = excluded.full_name,
  phone = excluded.phone,
  email = excluded.email,
  photo_url = excluded.photo_url,
  job_title = excluded.job_title,
  role_slug = excluded.role_slug,
  department_code = excluded.department_code,
  manager_employee_code = excluded.manager_employee_code,
  initial_password_policy = 'PHONE_AS_PASSWORD',
  source_file = 'Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ†.xlsx',
  updated_at = now();

with roster as (
  select * from public.authorized_employee_roster
),
default_scope as (
  select
    (select id from public.branches where coalesce(is_deleted,false)=false order by created_at nulls last limit 1) as branch_id,
    (select id from public.governorates order by created_at nulls last limit 1) as governorate_id,
    (select id from public.complexes where coalesce(is_deleted,false)=false order by created_at nulls last limit 1) as complex_id
)
insert into public.employees (
  employee_code, full_name, phone, email, photo_url, job_title,
  role_id, branch_id, department_id, governorate_id, complex_id,
  status, is_active, is_deleted, hire_date, roster_source, phone_login_enabled
)
select
  r.employee_code,
  r.full_name,
  r.phone,
  r.email,
  r.photo_url,
  r.job_title,
  role_row.id,
  ds.branch_id,
  dept.id,
  ds.governorate_id,
  ds.complex_id,
  'ACTIVE',
  true,
  false,
  current_date,
  'Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ†.xlsx',
  true
from roster r
cross join default_scope ds
left join public.roles role_row on role_row.slug = r.role_slug
left join public.departments dept on dept.code = r.department_code
on conflict (employee_code) do update set
  full_name = excluded.full_name,
  phone = excluded.phone,
  email = excluded.email,
  photo_url = excluded.photo_url,
  job_title = excluded.job_title,
  role_id = excluded.role_id,
  branch_id = excluded.branch_id,
  department_id = excluded.department_id,
  governorate_id = excluded.governorate_id,
  complex_id = excluded.complex_id,
  status = 'ACTIVE',
  is_active = true,
  is_deleted = false,
  roster_source = 'Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ†.xlsx',
  phone_login_enabled = true,
  updated_at = now();

with roster as (
  select * from public.authorized_employee_roster
)
update public.employees e
set manager_employee_id = manager.id,
    updated_at = now()
from roster r
left join public.employees manager on manager.employee_code = nullif(r.manager_employee_code, '')
where e.employee_code = r.employee_code;

-- Ø§Ø¹ØªÙ…Ø§Ø¯ Ø§Ù„Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ø±Ø³Ù…ÙŠØ© ÙÙ‚Ø·: Ø£ÙŠ employee_code Ø®Ø§Ø±Ø¬ Ø§Ù„Ù‚Ø§Ø¦Ù…Ø© ÙŠØªÙ… ØªØ¹Ø·ÙŠÙ„Ù‡ Ù…Ù†Ø·Ù‚ÙŠÙ‹Ø§ ÙˆÙ„Ø§ ÙŠØ­Ø°Ù Ø³Ø¬Ù„Ù‡ Ø§Ù„ØªØ§Ø±ÙŠØ®ÙŠ.
update public.employees
set is_deleted = true,
    is_active = false,
    status = 'INACTIVE',
    updated_at = now()
where employee_code is not null
  and employee_code not in ('AHS-001', 'AHS-002', 'AHS-003', 'AHS-004', 'AHS-005', 'AHS-006', 'AHS-007', 'AHS-008', 'AHS-009', 'AHS-010', 'AHS-011', 'AHS-012', 'AHS-013', 'AHS-014', 'AHS-015', 'AHS-016', 'AHS-017', 'AHS-018', 'AHS-019', 'AHS-020', 'AHS-021', 'AHS-022', 'AHS-023', 'AHS-024', 'AHS-025', 'AHS-026', 'AHS-027', 'AHS-028');

-- Ø±Ø¨Ø· Ø§Ù„ØµÙˆØ± ÙˆØ§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø¨Ø£ÙŠ profiles Ù…ÙˆØ¬ÙˆØ¯Ø© Ù…Ø³Ø¨Ù‚Ù‹Ø§ Ø¨Ù†ÙØ³ Ø§Ù„Ù‡Ø§ØªÙ/Ø§Ù„Ø¨Ø±ÙŠØ¯.
update public.profiles p
set employee_id = e.id,
    full_name = e.full_name,
    phone = e.phone,
    email = e.email,
    avatar_url = e.photo_url,
    role_id = e.role_id,
    branch_id = e.branch_id,
    department_id = e.department_id,
    governorate_id = e.governorate_id,
    complex_id = e.complex_id,
    status = 'ACTIVE',
    temporary_password = false,
    must_change_password = false,
    updated_at = now()
from public.employees e
where (p.phone = e.phone or lower(p.email) = lower(e.email))
  and e.employee_code in ('AHS-001', 'AHS-002', 'AHS-003', 'AHS-004', 'AHS-005', 'AHS-006', 'AHS-007', 'AHS-008', 'AHS-009', 'AHS-010', 'AHS-011', 'AHS-012', 'AHS-013', 'AHS-014', 'AHS-015', 'AHS-016', 'AHS-017', 'AHS-018', 'AHS-019', 'AHS-020', 'AHS-021', 'AHS-022', 'AHS-023', 'AHS-024', 'AHS-025', 'AHS-026', 'AHS-027', 'AHS-028');

-- Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª ØªÙˆØ¶Ø­ Ø§Ù„Ø³ÙŠØ§Ø³Ø© Ù„Ù„Ø¥Ø¯Ø§Ø±Ø© ÙˆØ§Ù„ÙˆØ§Ø¬Ù‡Ø©.
create table if not exists public.settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  description text default '',
  updated_at timestamptz not null default now()
);

insert into public.settings (key, value, description)
values
  ('employee_login_policy', '{"identifier":"phone","initialPassword":"same_as_phone","selfRegistration":false,"source":"Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ†.xlsx"}'::jsonb, 'Ø³ÙŠØ§Ø³Ø© Ø§Ù„Ø¯Ø®ÙˆÙ„ Ø§Ù„Ù…Ø¹ØªÙ…Ø¯Ø© Ø¨Ø¹Ø¯ Ø§Ø³ØªÙŠØ±Ø§Ø¯ Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ†'),
  ('internal_communication_channel', '{"enabled":true,"push":true,"inAppSound":true,"audience":"all"}'::jsonb, 'Ù‚Ù†Ø§Ø© Ø§Ù„ØªÙˆØ§ØµÙ„ Ø§Ù„Ø¯Ø§Ø®Ù„ÙŠ Ù„Ù„Ø¥Ø¹Ù„Ø§Ù†Ø§Øª ÙˆØ§Ù„ØªØ°ÙƒÙŠØ±Ø§Øª ÙˆØ§Ù„ØªØ¹Ù„ÙŠÙ…Ø§Øª')
on conflict (key) do update set value = excluded.value, description = excluded.description, updated_at = now();

create table if not exists public.dispute_committee_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.dispute_committee_settings (key, value)
values (
  'main_committee',
  '{"name":"Ù„Ø¬Ù†Ø© Ø­Ù„ Ø§Ù„Ù…Ø´Ø§ÙƒÙ„ ÙˆØ§Ù„Ø®Ù„Ø§ÙØ§Øª","members":["Ø§Ù„Ø´ÙŠØ® Ù…Ø­Ù…Ø¯ ÙŠÙˆØ³Ù","ÙŠØ­ÙŠÙŠ Ø¬Ù…Ø§Ù„ Ø§Ù„Ø³Ø¨Ø¹","Ù…Ø­Ù…Ø¯ Ø§Ø¨Ùˆ Ø¹Ù…Ø§Ø±","Ø¨Ù„Ø§Ù„ Ù…Ø­Ù…Ø¯ Ø§Ù„Ø´Ø§ÙƒØ±","ÙŠØ§Ø³Ø± ÙØªØ­ÙŠ Ù†ÙˆØ± Ø§Ù„Ø¯ÙŠÙ†"],"executiveEscalationTo":"Ø§Ù„Ø´ÙŠØ® Ù…Ø­Ù…Ø¯ ÙŠÙˆØ³Ù","secretary":"ÙŠØ­ÙŠÙŠ Ø¬Ù…Ø§Ù„ Ø§Ù„Ø³Ø¨Ø¹"}'::jsonb
)
on conflict (key) do update set value = excluded.value, updated_at = now();

commit;


-- END PATCH: 042_authorized_roster_phone_login_internal_channel.sql


-- =========================================================
-- BEGIN PATCH: 043_executive_presence_risk_decisions_reports.sql
-- =========================================================

-- =========================================================
-- 043 Executive live presence + attendance risk + decisions + committee minutes + monthly PDF queue
-- Purpose:
--   1) Ù„ÙˆØ­Ø© Ø­Ø¶ÙˆØ± Ù„Ø­Ø¸ÙŠØ© Ù„Ù„Ù…Ø¯ÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ Ù…Ø¹ Ø®Ø±ÙŠØ·Ø© ÙˆÙ…ÙˆÙ‚Ø¹.
--   2) Ù†Ø¸Ø§Ù… ØªÙ‚ÙŠÙŠÙ… Ø®Ø·Ø± Ø§Ù„Ø¨ØµÙ…Ø© ÙˆØ§Ù„ØªÙ„Ø§Ø¹Ø¨.
--   3) Ø³Ø¬Ù„ Ù‚Ø±Ø§Ø±Ø§Øª Ø¥Ø¯Ø§Ø±ÙŠØ© Ø±Ø³Ù…ÙŠ Ù…Ø¹ ØªÙˆÙ‚ÙŠØ¹ Ø§Ø·Ù„Ø§Ø¹ Ù„ÙƒÙ„ Ù…ÙˆØ¸Ù.
--   4) Ù…Ø­Ø§Ø¶Ø± Ù„Ø¬Ù†Ø© Ø­Ù„ Ø§Ù„Ù…Ø´Ø§ÙƒÙ„ ÙˆØ§Ù„Ø®Ù„Ø§ÙØ§Øª.
--   5) ØµÙ„Ø§Ø­ÙŠØ§Øª Ø£Ø¯Ù‚ Ù„Ù„Ù…Ø¯ÙŠØ± Ø§Ù„Ù…Ø¨Ø§Ø´Ø±: ÙŠØ±Ù‰ ÙØ±ÙŠÙ‚Ù‡ ÙÙ‚Ø· Ø¹Ø¨Ø± RLS.
--   6) Ø³Ø¬Ù„ ØªØ´ØºÙŠÙ„ ØªÙ‚Ø§Ø±ÙŠØ± PDF Ø´Ù‡Ø±ÙŠØ© ØªÙ„Ù‚Ø§Ø¦ÙŠØ©.
-- =========================================================

begin;

alter table public.attendance_events add column if not exists device_id text;
alter table public.attendance_events add column if not exists user_agent text;
alter table public.attendance_events add column if not exists source text default 'web';

insert into public.permissions (scope, name)
values
  ('executive:presence-map', 'Ø®Ø±ÙŠØ·Ø© Ø§Ù„Ø­Ø¶ÙˆØ± Ø§Ù„Ù„Ø­Ø¸ÙŠØ© Ù„Ù„Ù…Ø¯ÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ'),
  ('attendance:risk', 'Ù…Ø±ÙƒØ² ØªÙ‚ÙŠÙŠÙ… Ø®Ø·Ø± Ø§Ù„Ø¨ØµÙ…Ø©'),
  ('decisions:manage', 'Ø¥Ø¯Ø§Ø±Ø© Ø³Ø¬Ù„ Ø§Ù„Ù‚Ø±Ø§Ø±Ø§Øª Ø§Ù„Ø¥Ø¯Ø§Ø±ÙŠØ©'),
  ('decisions:acknowledge', 'ØªØ£ÙƒÙŠØ¯ Ø§Ù„Ø§Ø·Ù„Ø§Ø¹ Ø¹Ù„Ù‰ Ø§Ù„Ù‚Ø±Ø§Ø±Ø§Øª'),
  ('disputes:minutes', 'Ù…Ø­Ø§Ø¶Ø± Ù„Ø¬Ù†Ø© Ø­Ù„ Ø§Ù„Ù…Ø´Ø§ÙƒÙ„ ÙˆØ§Ù„Ø®Ù„Ø§ÙØ§Øª'),
  ('reports:monthly-pdf-auto', 'ØªÙ‚Ø§Ø±ÙŠØ± PDF Ø´Ù‡Ø±ÙŠØ© ØªÙ„Ù‚Ø§Ø¦ÙŠØ©'),
  ('manager:team-only', 'Ù‚ØµØ± Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„Ù…Ø¨Ø§Ø´Ø± Ø¹Ù„Ù‰ ÙØ±ÙŠÙ‚Ù‡ ÙÙ‚Ø·')
on conflict (scope) do update set name = excluded.name;

update public.roles
set permissions = (
  select array(select distinct unnest(coalesce(public.roles.permissions, '{}'::text[]) || array['executive:presence-map','attendance:risk','decisions:manage','reports:monthly-pdf-auto','disputes:minutes','manager:team-only']))
)
where slug in ('admin', 'executive-secretary');

update public.roles
set permissions = (
  select array(select distinct unnest(coalesce(public.roles.permissions, '{}'::text[]) || array['executive:presence-map','attendance:risk','decisions:manage','reports:monthly-pdf-auto','disputes:minutes']))
)
where slug in ('executive');

update public.roles
set permissions = (
  select array(select distinct unnest(coalesce(public.roles.permissions, '{}'::text[]) || array['attendance:risk','decisions:manage','reports:monthly-pdf-auto','disputes:minutes']))
)
where slug in ('hr-manager');

update public.roles
set permissions = (
  select array(select distinct unnest(coalesce(public.roles.permissions, '{}'::text[]) || array['manager:team-only','decisions:acknowledge']))
)
where slug in ('direct-manager', 'employee');

create table if not exists public.attendance_risk_events (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references public.employees(id) on delete cascade,
  attendance_event_id uuid,
  risk_code text not null,
  risk_label text not null,
  risk_score integer not null default 0,
  severity text not null default 'MEDIUM',
  metadata jsonb not null default '{}'::jsonb,
  resolved boolean not null default false,
  resolved_at timestamptz,
  resolved_by uuid,
  created_at timestamptz not null default now()
);

create index if not exists idx_attendance_risk_events_employee_created on public.attendance_risk_events(employee_id, created_at desc);
create index if not exists idx_attendance_risk_events_unresolved on public.attendance_risk_events(resolved, severity);

create table if not exists public.admin_decisions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null default '',
  category text not null default 'ADMINISTRATIVE',
  priority text not null default 'MEDIUM',
  scope text not null default 'ALL',
  target_employee_ids uuid[] not null default '{}'::uuid[],
  requires_acknowledgement boolean not null default true,
  status text not null default 'PUBLISHED',
  issued_by_user_id uuid,
  issued_by_employee_id uuid references public.employees(id) on delete set null,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_decision_acknowledgements (
  id uuid primary key default gen_random_uuid(),
  decision_id uuid not null references public.admin_decisions(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  user_id uuid,
  acknowledged_at timestamptz not null default now(),
  user_agent text default '',
  ip_hint text default '',
  created_at timestamptz not null default now(),
  unique(decision_id, employee_id)
);

create index if not exists idx_admin_decisions_published on public.admin_decisions(status, published_at desc);
create index if not exists idx_admin_decision_ack_employee on public.admin_decision_acknowledgements(employee_id, acknowledged_at desc);

create table if not exists public.dispute_minutes (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null,
  session_at timestamptz not null default now(),
  members text[] not null default '{}'::text[],
  decision text not null default '',
  notes text not null default '',
  attachments jsonb not null default '[]'::jsonb,
  signed_by_user_id uuid,
  signed_by_name text default '',
  signature_status text not null default 'SIGNED',
  created_at timestamptz not null default now()
);

create index if not exists idx_dispute_minutes_case_session on public.dispute_minutes(case_id, session_at desc);

create table if not exists public.monthly_pdf_report_runs (
  id uuid primary key default gen_random_uuid(),
  month text not null,
  status text not null default 'READY',
  generated_at timestamptz not null default now(),
  generated_by_user_id uuid,
  storage_path text default '',
  counts jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists idx_monthly_pdf_report_runs_month on public.monthly_pdf_report_runs(month, generated_at desc);

create or replace function public.current_profile_employee_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select p.employee_id
  from public.profiles p
  where p.id = auth.uid()
  limit 1;
$$;

create or replace function public.current_has_any_scope(required_scopes text[])
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    left join public.roles r on r.id = p.role_id
    where p.id = auth.uid()
      and (
        coalesce(r.slug, '') in ('admin','executive-secretary')
        or '*' = any(coalesce(r.permissions, '{}'::text[]))
        or coalesce(r.permissions, '{}'::text[]) && required_scopes
      )
  );
$$;

create or replace function public.current_can_see_employee(target_employee_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  with recursive team(id) as (
    select public.current_profile_employee_id()
    union
    select e.id
    from public.employees e
    join team t on e.manager_employee_id = t.id
    where coalesce(e.is_deleted, false) = false
  )
  select
    public.current_has_any_scope(array['employees:write','hr:operations','executive:mobile','executive:presence-map','attendance:manage','kpi:hr'])
    or target_employee_id in (select id from team);
$$;

-- Override the original employee-scope guard so direct managers never read outside their team.
create or replace function public.can_access_employee(emp_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.current_can_see_employee(emp_id);
$$;

create or replace view public.executive_presence_live as
select
  e.id as employee_id,
  e.full_name,
  e.job_title,
  e.phone,
  e.photo_url,
  e.manager_employee_id,
  m.full_name as manager_name,
  latest_event.event_at as last_attendance_at,
  latest_event.type as last_attendance_type,
  latest_event.status as last_attendance_status,
  latest_event.geofence_status,
  latest_event.requires_review,
  latest_location.latitude,
  latest_location.longitude,
  latest_location.accuracy_meters,
  latest_location.captured_at as last_location_at,
  case
    when latest_event.event_at is null then 'ABSENT'
    when coalesce(latest_event.status, '') ilike '%LATE%' then 'LATE'
    when latest_event.type = 'CHECK_OUT' then 'CHECKED_OUT'
    else 'PRESENT'
  end as today_status
from public.employees e
left join public.employees m on m.id = e.manager_employee_id
left join lateral (
  select ae.*
  from public.attendance_events ae
  where ae.employee_id = e.id
    and ae.event_at::date = current_date
  order by ae.event_at desc nulls last, ae.created_at desc nulls last
  limit 1
) latest_event on true
left join lateral (
  select llr.employee_id, llr.latitude, llr.longitude, llr.accuracy_meters, coalesce(llr.captured_at, llr.responded_at, llr.created_at) as captured_at
  from public.live_location_responses llr
  where llr.employee_id = e.id
  order by coalesce(llr.captured_at, llr.responded_at, llr.created_at) desc nulls last
  limit 1
) latest_location on true
where coalesce(e.is_deleted, false) = false;

create or replace view public.attendance_risk_dashboard as
select
  e.id as employee_id,
  e.full_name,
  e.job_title,
  count(ae.id) filter (where ae.requires_review = true or ae.geofence_status in ('outside_branch','location_low_accuracy','permission_denied','location_unavailable','geofence_miss')) as flagged_events,
  count(distinct coalesce(ae.device_id, ae.user_agent, ae.source)) filter (where ae.created_at >= now() - interval '7 days') as device_count,
  count(ae.id) filter (where ae.created_at >= now() - interval '7 days' and ae.latitude is null) as missing_location_events,
  least(100,
    (count(ae.id) filter (where ae.requires_review = true or ae.geofence_status in ('outside_branch','location_low_accuracy','permission_denied','location_unavailable','geofence_miss')) * 15)
    + greatest(0, count(distinct coalesce(ae.device_id, ae.user_agent, ae.source)) - 1) * 20
    + (count(ae.id) filter (where ae.created_at >= now() - interval '7 days' and ae.latitude is null) * 8)
  )::int as risk_score
from public.employees e
left join public.attendance_events ae on ae.employee_id = e.id and ae.created_at >= now() - interval '7 days'
where coalesce(e.is_deleted, false) = false
group by e.id, e.full_name, e.job_title;

alter table public.attendance_risk_events enable row level security;
alter table public.admin_decisions enable row level security;
alter table public.admin_decision_acknowledgements enable row level security;
alter table public.dispute_minutes enable row level security;
alter table public.monthly_pdf_report_runs enable row level security;

-- RLS for manager-team-only and executive/HR access.
drop policy if exists "attendance_risk_events_select_scope" on public.attendance_risk_events;
create policy "attendance_risk_events_select_scope" on public.attendance_risk_events
for select using (public.current_can_see_employee(employee_id));

drop policy if exists "attendance_risk_events_manage_scope" on public.attendance_risk_events;
create policy "attendance_risk_events_manage_scope" on public.attendance_risk_events
for all using (public.current_has_any_scope(array['attendance:risk','attendance:review','attendance:manage','executive:mobile']))
with check (public.current_has_any_scope(array['attendance:risk','attendance:review','attendance:manage','executive:mobile']));

drop policy if exists "admin_decisions_select_visible" on public.admin_decisions;
create policy "admin_decisions_select_visible" on public.admin_decisions
for select using (
  public.current_has_any_scope(array['decisions:manage','notifications:manage','executive:report'])
  or scope in ('ALL','EMPLOYEES')
  or public.current_profile_employee_id() = any(target_employee_ids)
);

drop policy if exists "admin_decisions_manage" on public.admin_decisions;
create policy "admin_decisions_manage" on public.admin_decisions
for all using (public.current_has_any_scope(array['decisions:manage','notifications:manage','executive:report']))
with check (public.current_has_any_scope(array['decisions:manage','notifications:manage','executive:report']));

drop policy if exists "admin_decision_ack_select_scope" on public.admin_decision_acknowledgements;
create policy "admin_decision_ack_select_scope" on public.admin_decision_acknowledgements
for select using (
  employee_id = public.current_profile_employee_id()
  or public.current_has_any_scope(array['decisions:manage','notifications:manage','executive:report'])
);

drop policy if exists "admin_decision_ack_insert_self" on public.admin_decision_acknowledgements;
create policy "admin_decision_ack_insert_self" on public.admin_decision_acknowledgements
for insert with check (employee_id = public.current_profile_employee_id());

drop policy if exists "dispute_minutes_select_scope" on public.dispute_minutes;
create policy "dispute_minutes_select_scope" on public.dispute_minutes
for select using (public.current_has_any_scope(array['disputes:minutes','disputes:committee','disputes:manage','executive:mobile']));

drop policy if exists "dispute_minutes_manage_scope" on public.dispute_minutes;
create policy "dispute_minutes_manage_scope" on public.dispute_minutes
for all using (public.current_has_any_scope(array['disputes:minutes','disputes:committee','disputes:manage','executive:mobile']))
with check (public.current_has_any_scope(array['disputes:minutes','disputes:committee','disputes:manage','executive:mobile']));

drop policy if exists "monthly_pdf_report_runs_select_scope" on public.monthly_pdf_report_runs;
create policy "monthly_pdf_report_runs_select_scope" on public.monthly_pdf_report_runs
for select using (public.current_has_any_scope(array['reports:monthly-pdf-auto','reports:pdf','reports:export','executive:report']));

drop policy if exists "monthly_pdf_report_runs_manage_scope" on public.monthly_pdf_report_runs;
create policy "monthly_pdf_report_runs_manage_scope" on public.monthly_pdf_report_runs
for all using (public.current_has_any_scope(array['reports:monthly-pdf-auto','reports:pdf','reports:export','executive:report']))
with check (public.current_has_any_scope(array['reports:monthly-pdf-auto','reports:pdf','reports:export','executive:report']));

insert into public.settings (key, value, description)
values
  ('executive_presence_live', '{"enabled":true,"map":true,"missingLocationAlert":true}'::jsonb, 'Ù„ÙˆØ­Ø© Ø­Ø¶ÙˆØ± Ù„Ø­Ø¸ÙŠØ© ÙˆØ®Ø±ÙŠØ·Ø© Ù…Ø¨Ø§Ø´Ø±Ø© Ù„Ù„Ù…Ø¯ÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ'),
  ('attendance_risk_scoring', '{"enabled":true,"duplicateWindowMinutes":10,"farDistanceMeters":1000,"newDevicePoints":20}'::jsonb, 'Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª ØªÙ‚ÙŠÙŠÙ… Ø®Ø·Ø± Ø§Ù„Ø¨ØµÙ…Ø©'),
  ('monthly_pdf_reports', '{"enabled":true,"frequency":"monthly","include":["attendance","late","absence","kpi","disputes","requests"],"printToPdf":true}'::jsonb, 'ØªÙ‚Ø§Ø±ÙŠØ± PDF Ø´Ù‡Ø±ÙŠØ© ØªÙ„Ù‚Ø§Ø¦ÙŠØ©')
on conflict (key) do update set value = excluded.value, description = excluded.description, updated_at = now();

commit;


-- END PATCH: 043_executive_presence_risk_decisions_reports.sql



-- Post-043 required security patches are provided separately:
--   patches/044_encrypt_credential_vault.sql
--   patches/045_enable_pg_cron_backup.sql

-- =========================================================
-- END SECTION: 001-043 Base schema + patches
-- =========================================================


-- =========================================================
-- BEGIN SECTION: 044-074 Expanded production patches
-- SOURCE: supabase/sql/PRODUCTION_SQL_EDITOR_PATCHES_044_TO_074_ALL_EXPANDED.sql
-- =========================================================

-- =========================================================
-- EXPANDED SQL EDITOR BUNDLE: PATCHES 044 TO 074
-- Generated for Supabase SQL Editor.
-- Run AFTER base schema and patches 001-043 have already been applied.
-- Requirements before running:
--   1) Set app.vault_key before patch 044.
--   2) Enable pg_cron before patch 045 if backup scheduling is required.
-- =========================================================



-- =========================================================
-- BEGIN PATCH: 044_encrypt_credential_vault.sql
-- =========================================================
-- Patch 044: Encrypt credential_vault.temporary_password
-- Requires: app.vault_key to be set in Supabase Project Settings / Secrets before running.
begin;

create extension if not exists pgcrypto;

alter table if exists public.credential_vault
  add column if not exists encrypted_password bytea;

do $$
declare
  vault_key text;
begin
  vault_key := current_setting('app.vault_key', true);
  if vault_key is null or vault_key = '' then
    raise warning 'app.vault_key is not set; encrypted_password migration skipped. Set the secret and re-run this patch.';
  else
    update public.credential_vault
    set encrypted_password = pgp_sym_encrypt(coalesce(temporary_password, ''), vault_key)
    where temporary_password is not null
      and temporary_password <> ''
      and encrypted_password is null;
  end if;
end $$;

comment on column public.credential_vault.temporary_password is
  'DEPRECATED PLAINTEXT â€” use encrypted_password. Drop this column only after verifying migration.';

create or replace function public.get_my_vault_entry()
returns table (id text, created_at timestamptz, decrypted_password text)
language sql
security definer
stable
set search_path = public
as $$
  select
    cv.id::text,
    cv.created_at,
    pgp_sym_decrypt(cv.encrypted_password, current_setting('app.vault_key', true)) as decrypted_password
  from public.credential_vault cv
  where cv.encrypted_password is not null
    and (public.current_can_view_password_vault())
  order by cv.created_at desc
  limit 1;
$$;

commit;

-- =========================================================
-- END PATCH: 044_encrypt_credential_vault.sql
-- =========================================================


-- =========================================================
-- BEGIN PATCH: 045_enable_pg_cron_backup.sql
-- =========================================================
-- Patch 045: Enable pg_cron backup schedule placeholder
-- Requires enabling pg_cron in Supabase Dashboard before running scheduled jobs.
begin;

create extension if not exists pg_cron;

create table if not exists public.backup_run_log (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'scheduled',
  status text not null default 'PENDING',
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.run_auto_backup()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.backup_run_log(kind, status, details)
  values ('scheduled', 'RECORDED', jsonb_build_object('note', 'External backup runner should export data from Supabase storage/database.'));
end;
$$;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule('ahla-shabab-hr-auto-backup', '0 2 * * *', $$select public.run_auto_backup();$$);
  end if;
exception when duplicate_object then
  null;
end $$;

commit;

-- =========================================================
-- END PATCH: 045_enable_pg_cron_backup.sql
-- =========================================================


-- =========================================================
-- BEGIN PATCH: 046_performance_indexes.sql
-- =========================================================
-- Patch 046: Performance indexes for frequently queried columns
begin;

-- Attendance indexes
create index if not exists idx_attendance_employee_date
  on public.attendance(employee_id, punch_date desc);

create index if not exists idx_attendance_status_date
  on public.attendance(status, punch_date desc);

-- Notifications unread
create index if not exists idx_notifications_user_unread
  on public.notifications(user_id, is_read, created_at desc)
  where is_read = false;

-- KPI evaluations cycle
create index if not exists idx_kpi_evaluations_cycle
  on public.kpi_evaluations(cycle_id, employee_id, status);

-- Audit log ordering by created date
create index if not exists idx_audit_log_created
  on public.audit_log(created_at desc);

-- Pending leave requests
create index if not exists idx_leave_requests_pending
  on public.leave_requests(status, created_at desc)
  where status = 'PENDING';

-- Live location responses by employee and time
create index if not exists idx_live_location_employee_time
  on public.live_location_responses(employee_id, created_at desc);

commit;
-- =========================================================
-- END PATCH: 046_performance_indexes.sql
-- =========================================================


-- =========================================================
-- BEGIN PATCH: 047_mfa_trusted_devices.sql
-- =========================================================
-- Patch 047: MFA trusted devices table
begin;

create table if not exists public.trusted_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  device_fingerprint text not null,
  device_name text default '',
  trusted_at timestamptz not null default now(),
  last_used_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days'),
  created_at timestamptz not null default now()
);

create unique index if not exists idx_trusted_devices_user_fp
  on public.trusted_devices(user_id, device_fingerprint);

alter table public.trusted_devices enable row level security;

create policy "user_own_devices" on public.trusted_devices
  for all using (auth.uid() = user_id);

-- Remove expired trusted devices
create or replace function public.cleanup_expired_trusted_devices()
returns void language sql security definer as $$
  delete from public.trusted_devices where expires_at < now();
$$;

comment on table public.trusted_devices is
  'Ø£Ø¬Ù‡Ø²Ø© Ù…ÙˆØ«ÙˆÙ‚Ø© Ù„ØªØ¬Ø§ÙˆØ² MFA Ù„Ù…Ø¯Ø© 30 ÙŠÙˆÙ… Ù„Ù„Ø£Ø¯ÙˆØ§Ø± Ø§Ù„Ø­Ø³Ø§Ø³Ø©';

commit;
-- =========================================================
-- END PATCH: 047_mfa_trusted_devices.sql
-- =========================================================


-- =========================================================
-- BEGIN PATCH: 048_enhanced_audit_log.sql
-- =========================================================
-- Patch 048: Enhanced audit log for sensitive operations
begin;

alter table if exists public.audit_log
  add column if not exists ip_address text,
  add column if not exists user_agent text,
  add column if not exists session_id text,
  add column if not exists severity text default 'INFO'
    check (severity in ('INFO', 'WARNING', 'CRITICAL'));

-- Promote sensitive actions to CRITICAL severity
update public.audit_log
set severity = 'CRITICAL'
where action in (
  'USER_CREATED', 'USER_DELETED', 'ROLE_CHANGED',
  'PASSWORD_RESET', 'ADMIN_LOGIN', 'BULK_EXPORT'
);

create index if not exists idx_audit_log_severity
  on public.audit_log(severity, created_at desc)
  where severity in ('WARNING', 'CRITICAL');

commit;
-- =========================================================
-- END PATCH: 048_enhanced_audit_log.sql
-- =========================================================


-- =========================================================
-- BEGIN PATCH: 049_cleanup_old_reports.sql
-- =========================================================
-- Patch 049: Auto-cleanup old temporary reports (keep 6 months)
begin;

create or replace function public.cleanup_old_reports()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.report_snapshots
  where created_at < now() - interval '6 months';

  delete from public.kpi_cycle_archives
  where archived_at < now() - interval '12 months';
$$;

-- Schedule weekly cleanup via pg_cron if available
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule(
      'hr-weekly-cleanup',
      '0 2 * * 0',
      $cron$ SELECT public.cleanup_old_reports(); $cron$
    );
  end if;
end;
$$;

commit;
-- =========================================================
-- END PATCH: 049_cleanup_old_reports.sql
-- =========================================================


-- =========================================================
-- BEGIN PATCH: 051_attendance_identity_verification.sql
-- =========================================================
-- Patch 051: Attendance identity verification and anti-shared-device controls
-- Purpose:
--   Bind every employee punch to a trusted passkey/device, live selfie, location, and risk score.
--   High-risk events are marked for HR review instead of silently accepted.

begin;

create extension if not exists pgcrypto;

-- Extend attendance_events without breaking older clients.
alter table if exists public.attendance_events
  add column if not exists trusted_device_id uuid,
  add column if not exists device_fingerprint_hash text,
  add column if not exists identity_check jsonb default '{}'::jsonb,
  add column if not exists risk_score integer default 0 check (risk_score between 0 and 100),
  add column if not exists risk_level text default 'LOW' check (risk_level in ('LOW','MEDIUM','HIGH')),
  add column if not exists risk_flags text[] default '{}';

-- Extend passkey_credentials if the table already exists.
alter table if exists public.passkey_credentials
  add column if not exists employee_id uuid references public.employees(id) on delete cascade,
  add column if not exists device_fingerprint_hash text,
  add column if not exists trusted boolean default true,
  add column if not exists status text default 'DEVICE_TRUSTED',
  add column if not exists last_verified_at timestamptz;

-- Per-punch verification record for review/audit.
create table if not exists public.attendance_identity_checks (
  id uuid primary key default gen_random_uuid(),
  attendance_event_id uuid references public.attendance_events(id) on delete cascade,
  employee_id uuid references public.employees(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  trusted_device_id uuid null,
  device_fingerprint_hash text,
  passkey_credential_id text,
  selfie_url text default '',
  identity_check jsonb default '{}'::jsonb,
  risk_score integer not null default 0 check (risk_score between 0 and 100),
  risk_level text not null default 'LOW' check (risk_level in ('LOW','MEDIUM','HIGH')),
  risk_flags text[] not null default '{}',
  requires_review boolean not null default false,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  review_decision text check (review_decision in ('APPROVED','REJECTED','ESCALATED')),
  review_notes text default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_attendance_identity_checks_event
  on public.attendance_identity_checks(attendance_event_id);

create index if not exists idx_attendance_identity_checks_employee_created
  on public.attendance_identity_checks(employee_id, created_at desc);

create index if not exists idx_attendance_identity_checks_review
  on public.attendance_identity_checks(requires_review, created_at desc)
  where requires_review = true;

create index if not exists idx_attendance_identity_checks_device_time
  on public.attendance_identity_checks(device_fingerprint_hash, created_at desc);

-- Detailed risk events for analytics and alerts.
create table if not exists public.attendance_risk_events (
  id uuid primary key default gen_random_uuid(),
  attendance_event_id uuid references public.attendance_events(id) on delete cascade,
  employee_id uuid references public.employees(id) on delete cascade,
  risk_flag text not null,
  risk_score integer not null default 0 check (risk_score between 0 and 100),
  details jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_attendance_risk_events_flag_time
  on public.attendance_risk_events(risk_flag, created_at desc);

create index if not exists idx_attendance_risk_events_employee_time
  on public.attendance_risk_events(employee_id, created_at desc);

-- Selfie catalog; actual objects stay in Storage bucket punch-selfies.
create table if not exists public.punch_selfies (
  id uuid primary key default gen_random_uuid(),
  attendance_event_id uuid references public.attendance_events(id) on delete cascade,
  employee_id uuid references public.employees(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  selfie_url text not null,
  storage_bucket text default 'punch-selfies',
  storage_path text default '',
  captured_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_punch_selfies_event
  on public.punch_selfies(attendance_event_id);

alter table public.attendance_identity_checks enable row level security;
alter table public.attendance_risk_events enable row level security;
alter table public.punch_selfies enable row level security;

-- Read access for users who can review attendance or manage HR/admin.
drop policy if exists "attendance_identity_reviewers_read" on public.attendance_identity_checks;
create policy "attendance_identity_reviewers_read" on public.attendance_identity_checks
  for select using (
    auth.uid() = user_id
    or public.has_app_permission('attendance:review')
    or public.has_app_permission('attendance:manage')
    or public.has_app_permission('hr:operations')
    or public.has_app_permission('executive:mobile')
  );

drop policy if exists "attendance_risk_reviewers_read" on public.attendance_risk_events;
create policy "attendance_risk_reviewers_read" on public.attendance_risk_events
  for select using (
    public.has_app_permission('attendance:review')
    or public.has_app_permission('attendance:manage')
    or public.has_app_permission('hr:operations')
    or public.has_app_permission('executive:mobile')
  );

drop policy if exists "punch_selfies_reviewers_read" on public.punch_selfies;
create policy "punch_selfies_reviewers_read" on public.punch_selfies
  for select using (
    auth.uid() = user_id
    or public.has_app_permission('attendance:review')
    or public.has_app_permission('attendance:manage')
    or public.has_app_permission('hr:operations')
  );

-- Authenticated users may insert their own verification metadata through the app.
drop policy if exists "attendance_identity_insert_own" on public.attendance_identity_checks;
create policy "attendance_identity_insert_own" on public.attendance_identity_checks
  for insert with check (auth.uid() = user_id);

drop policy if exists "attendance_risk_insert_authenticated" on public.attendance_risk_events;
create policy "attendance_risk_insert_authenticated" on public.attendance_risk_events
  for insert with check (auth.role() = 'authenticated');

drop policy if exists "punch_selfies_insert_own" on public.punch_selfies;
create policy "punch_selfies_insert_own" on public.punch_selfies
  for insert with check (auth.uid() = user_id);

-- Helper view: shared-device punches within 30 minutes.
create or replace view public.attendance_shared_device_alerts as
select
  a.device_fingerprint_hash,
  count(distinct a.employee_id) as distinct_employees,
  min(a.event_at) as first_event_at,
  max(a.event_at) as last_event_at,
  array_agg(distinct e.full_name) as employee_names
from public.attendance_events a
left join public.employees e on e.id = a.employee_id
where a.device_fingerprint_hash is not null
  and a.event_at >= now() - interval '30 minutes'
group by a.device_fingerprint_hash
having count(distinct a.employee_id) > 1;

comment on table public.attendance_identity_checks is
  'Verification metadata for each punch: trusted device, passkey, selfie, location, risk score and review status.';
comment on table public.attendance_risk_events is
  'Atomic risk flags produced by attendance identity verification.';
comment on view public.attendance_shared_device_alerts is
  'Flags devices used by more than one employee within a 30 minute window.';

commit;

-- =========================================================
-- END PATCH: 051_attendance_identity_verification.sql
-- =========================================================


-- =========================================================
-- BEGIN PATCH: 052_attendance_identity_server_review.sql
-- =========================================================
-- Patch 052: Server-side attendance identity review controls
-- Purpose:
--   Add a secure review queue and review RPC for identity-guarded attendance punches.
--   Complements Patch 051 by making shared-device detection and HR decisions auditable.

begin;

-- A review-oriented view for HR/Admin/Executive dashboards.
create or replace view public.attendance_identity_review_queue as
select
  c.id as check_id,
  c.attendance_event_id,
  c.employee_id,
  e.full_name as employee_name,
  c.user_id,
  c.device_fingerprint_hash,
  c.passkey_credential_id,
  c.selfie_url,
  c.risk_score,
  c.risk_level,
  c.risk_flags,
  c.requires_review,
  c.review_decision,
  c.review_notes,
  c.reviewed_at,
  c.created_at,
  ae.type,
  ae.status,
  ae.event_at,
  ae.geofence_status,
  ae.distance_from_branch_meters,
  ae.accuracy_meters,
  ae.notes
from public.attendance_identity_checks c
left join public.attendance_events ae on ae.id = c.attendance_event_id
left join public.employees e on e.id = c.employee_id
where c.requires_review = true
   or c.risk_level in ('MEDIUM','HIGH')
order by c.created_at desc;

-- Security-definer review RPC; keeps review writes out of the public table API.
create or replace function public.review_attendance_identity_check(
  p_check_id uuid,
  p_decision text,
  p_notes text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_check public.attendance_identity_checks%rowtype;
  v_decision text := upper(trim(coalesce(p_decision, '')));
  v_can_review boolean;
begin
  v_can_review := public.has_app_permission('attendance:review')
    or public.has_app_permission('attendance:manage')
    or public.has_app_permission('hr:operations')
    or public.has_app_permission('executive:mobile');

  if not v_can_review then
    raise exception 'NOT_ALLOWED_TO_REVIEW_ATTENDANCE_IDENTITY';
  end if;

  if v_decision not in ('APPROVED','REJECTED','ESCALATED') then
    raise exception 'INVALID_REVIEW_DECISION';
  end if;

  select * into v_check
  from public.attendance_identity_checks
  where id = p_check_id
  for update;

  if not found then
    raise exception 'ATTENDANCE_IDENTITY_CHECK_NOT_FOUND';
  end if;

  update public.attendance_identity_checks
  set reviewed_at = now(),
      reviewed_by = auth.uid(),
      review_decision = v_decision,
      review_notes = coalesce(p_notes, ''),
      requires_review = (v_decision = 'ESCALATED')
  where id = p_check_id;

  update public.attendance_events
  set requires_review = (v_decision = 'ESCALATED'),
      review_decision = v_decision,
      review_note = coalesce(p_notes, ''),
      reviewed_by_user_id = auth.uid(),
      reviewed_at = now(),
      status = case
        when v_decision = 'APPROVED' and status in ('REJECTED','PENDING_REVIEW','MANUAL_CHECK_IN','MANUAL_CHECK_OUT') then 'APPROVED'
        when v_decision = 'REJECTED' then 'REJECTED'
        else status
      end
  where id = v_check.attendance_event_id;

  if to_regclass('public.audit_log') is not null then
    insert into public.audit_log(action, entity_type, entity_id, metadata, created_at)
    values (
      'ATTENDANCE_IDENTITY_REVIEWED',
      'attendance_identity_check',
      p_check_id,
      jsonb_build_object('decision', v_decision, 'notes', coalesce(p_notes, ''), 'attendance_event_id', v_check.attendance_event_id),
      now()
    );
  elsif to_regclass('public.audit_logs') is not null then
    insert into public.audit_logs(action, entity_type, entity_id, actor_user_id, metadata, created_at)
    values (
      'ATTENDANCE_IDENTITY_REVIEWED',
      'attendance_identity_check',
      p_check_id,
      auth.uid(),
      jsonb_build_object('decision', v_decision, 'notes', coalesce(p_notes, ''), 'attendance_event_id', v_check.attendance_event_id),
      now()
    );
  end if;

  return jsonb_build_object('ok', true, 'decision', v_decision, 'check_id', p_check_id);
end;
$$;

comment on view public.attendance_identity_review_queue is
  'HR/Admin queue for reviewing identity-guarded attendance punches with medium/high risk.';
comment on function public.review_attendance_identity_check(uuid, text, text) is
  'Approves, rejects, or escalates an attendance identity check using role-based permissions.';

-- Storage policies for punch-selfies bucket, if Supabase Storage is enabled.
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'storage' and table_name = 'objects') then
    execute 'drop policy if exists "punch_selfies_authenticated_upload" on storage.objects';
    execute 'drop policy if exists "punch_selfies_reviewer_read" on storage.objects';

    execute $pol$
      create policy "punch_selfies_authenticated_upload"
      on storage.objects for insert to authenticated
      with check (bucket_id = 'punch-selfies')
    $pol$;

    execute $pol$
      create policy "punch_selfies_reviewer_read"
      on storage.objects for select to authenticated
      using (
        bucket_id = 'punch-selfies'
        and (
          owner = auth.uid()
          or public.has_app_permission('attendance:review')
          or public.has_app_permission('attendance:manage')
          or public.has_app_permission('hr:operations')
          or public.has_app_permission('executive:mobile')
        )
      )
    $pol$;
  end if;
exception when others then
  raise warning 'Storage policies for punch-selfies were not applied: %', sqlerrm;
end;
$$;

commit;

-- =========================================================
-- END PATCH: 052_attendance_identity_server_review.sql
-- =========================================================


-- =========================================================
-- BEGIN PATCH: 053_trusted_device_approval.sql
-- =========================================================
-- Patch 053: HR approval workflow for trusted attendance devices
-- Requires: patches 051-052
begin;

create extension if not exists pgcrypto;

alter table if exists public.passkey_credentials
  add column if not exists device_fingerprint_hash text,
  add column if not exists approval_status text default 'PENDING'
    check (approval_status in ('PENDING','APPROVED','REJECTED','REVOKED')),
  add column if not exists approved_by uuid references auth.users(id),
  add column if not exists approved_at timestamptz,
  add column if not exists rejected_at timestamptz,
  add column if not exists last_risk_seen_at timestamptz;

create table if not exists public.trusted_device_approval_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references public.employees(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  credential_id text,
  device_fingerprint_hash text not null,
  device_name text default '',
  user_agent text default '',
  selfie_url text default '',
  latitude double precision,
  longitude double precision,
  accuracy_meters numeric,
  status text not null default 'PENDING' check (status in ('PENDING','APPROVED','REJECTED','REVOKED')),
  reason text default '',
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(employee_id, device_fingerprint_hash)
);

alter table public.trusted_device_approval_requests enable row level security;

create policy if not exists "employee_create_own_device_request"
  on public.trusted_device_approval_requests
  for insert
  with check (auth.uid() = user_id);

create policy if not exists "employee_read_own_device_request"
  on public.trusted_device_approval_requests
  for select
  using (auth.uid() = user_id or public.has_app_permission('attendance:review') or public.has_app_permission('users:manage'));

create policy if not exists "reviewers_manage_device_requests"
  on public.trusted_device_approval_requests
  for update
  using (public.has_app_permission('attendance:review') or public.has_app_permission('users:manage'))
  with check (public.has_app_permission('attendance:review') or public.has_app_permission('users:manage'));

create index if not exists idx_device_requests_employee_status
  on public.trusted_device_approval_requests(employee_id, status, created_at desc);

create index if not exists idx_passkey_device_approval
  on public.passkey_credentials(employee_id, approval_status, device_fingerprint_hash);

create or replace view public.trusted_device_review_queue as
select
  r.*,
  e.full_name as employee_name,
  e.phone as employee_phone
from public.trusted_device_approval_requests r
left join public.employees e on e.id = r.employee_id
where r.status = 'PENDING'
order by r.created_at desc;

create or replace function public.request_trusted_device_approval(
  p_employee_id uuid,
  p_device_fingerprint_hash text,
  p_device_name text default '',
  p_user_agent text default '',
  p_selfie_url text default '',
  p_latitude double precision default null,
  p_longitude double precision default null,
  p_accuracy_meters numeric default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.trusted_device_approval_requests (
    employee_id, user_id, device_fingerprint_hash, device_name, user_agent,
    selfie_url, latitude, longitude, accuracy_meters, status
  ) values (
    p_employee_id, auth.uid(), p_device_fingerprint_hash, coalesce(p_device_name,''), coalesce(p_user_agent,''),
    coalesce(p_selfie_url,''), p_latitude, p_longitude, p_accuracy_meters, 'PENDING'
  )
  on conflict (employee_id, device_fingerprint_hash)
  do update set
    user_id = excluded.user_id,
    device_name = excluded.device_name,
    user_agent = excluded.user_agent,
    selfie_url = coalesce(nullif(excluded.selfie_url,''), public.trusted_device_approval_requests.selfie_url),
    latitude = excluded.latitude,
    longitude = excluded.longitude,
    accuracy_meters = excluded.accuracy_meters,
    status = case when public.trusted_device_approval_requests.status = 'REJECTED' then 'PENDING' else public.trusted_device_approval_requests.status end,
    updated_at = now()
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.review_trusted_device_approval(
  p_request_id uuid,
  p_decision text,
  p_reason text default ''
)
returns public.trusted_device_approval_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.trusted_device_approval_requests;
  v_decision text := upper(coalesce(p_decision,''));
begin
  if not (public.has_app_permission('attendance:review') or public.has_app_permission('users:manage')) then
    raise exception 'NOT_AUTHORIZED';
  end if;
  if v_decision not in ('APPROVED','REJECTED','REVOKED') then
    raise exception 'INVALID_DECISION';
  end if;
  update public.trusted_device_approval_requests
  set status = v_decision,
      reason = coalesce(p_reason,''),
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      updated_at = now()
  where id = p_request_id
  returning * into v_row;
  if v_row.id is null then
    raise exception 'REQUEST_NOT_FOUND';
  end if;
  update public.passkey_credentials
  set approval_status = v_decision,
      approved_by = case when v_decision = 'APPROVED' then auth.uid() else approved_by end,
      approved_at = case when v_decision = 'APPROVED' then now() else approved_at end,
      rejected_at = case when v_decision in ('REJECTED','REVOKED') then now() else rejected_at end,
      device_fingerprint_hash = coalesce(device_fingerprint_hash, v_row.device_fingerprint_hash)
  where employee_id = v_row.employee_id
    and (credential_id = v_row.credential_id or device_fingerprint_hash = v_row.device_fingerprint_hash);
  return v_row;
end;
$$;

comment on table public.trusted_device_approval_requests is
  'Ø·Ù„Ø¨Ø§Øª Ø§Ø¹ØªÙ…Ø§Ø¯ Ø£Ø¬Ù‡Ø²Ø© Ø§Ù„Ø­Ø¶ÙˆØ± Ù‚Ø¨Ù„ Ø§Ù„Ø³Ù…Ø§Ø­ Ø¨Ø§Ù„Ø¨ØµÙ…Ø© Ø§Ù„ØªÙ„Ù‚Ø§Ø¦ÙŠØ©. Ø£ÙŠ Ø¬Ù‡Ø§Ø² Ø¬Ø¯ÙŠØ¯ ÙŠØªØ­ÙˆÙ„ Ø¥Ù„Ù‰ Ù…Ø±Ø§Ø¬Ø¹Ø© HR.';

commit;

-- =========================================================
-- END PATCH: 053_trusted_device_approval.sql
-- =========================================================


-- =========================================================
-- BEGIN PATCH: 054_attendance_branch_qr_challenge.sql
-- =========================================================
-- Patch 054: Rotating branch QR challenge for attendance confirmation
begin;

create extension if not exists pgcrypto;

create table if not exists public.branch_qr_challenges (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid,
  challenge_code text not null unique,
  challenge_hash text not null,
  valid_from timestamptz not null default now(),
  valid_until timestamptz not null default (now() + interval '90 seconds'),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.branch_qr_challenges enable row level security;

create policy if not exists "reviewers_manage_branch_qr"
  on public.branch_qr_challenges
  for all
  using (public.has_app_permission('attendance:review') or public.has_app_permission('users:manage'))
  with check (public.has_app_permission('attendance:review') or public.has_app_permission('users:manage'));

create index if not exists idx_branch_qr_valid
  on public.branch_qr_challenges(branch_id, valid_until desc);

create or replace function public.create_branch_qr_challenge(p_branch_id uuid default null)
returns table (id uuid, challenge_code text, valid_until timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
begin
  if not (public.has_app_permission('attendance:review') or public.has_app_permission('users:manage')) then
    raise exception 'NOT_AUTHORIZED';
  end if;
  v_code := upper(substr(encode(gen_random_bytes(9), 'hex'), 1, 12));
  insert into public.branch_qr_challenges(branch_id, challenge_code, challenge_hash, created_by)
  values (p_branch_id, v_code, encode(digest(v_code, 'sha256'), 'hex'), auth.uid())
  returning public.branch_qr_challenges.id, public.branch_qr_challenges.challenge_code, public.branch_qr_challenges.valid_until
  into id, challenge_code, valid_until;
  return next;
end;
$$;

create or replace function public.validate_branch_qr_challenge(
  p_branch_id uuid default null,
  p_challenge_code text default ''
)
returns table (valid boolean, reason text, challenge_id uuid)
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  return query
  select true, 'VALID'::text, c.id
  from public.branch_qr_challenges c
  where c.challenge_hash = encode(digest(upper(trim(coalesce(p_challenge_code,''))), 'sha256'), 'hex')
    and (p_branch_id is null or c.branch_id is null or c.branch_id = p_branch_id)
    and now() between c.valid_from and c.valid_until
  order by c.valid_until desc
  limit 1;
  if not found then
    return query select false, 'INVALID_OR_EXPIRED'::text, null::uuid;
  end if;
end;
$$;

comment on table public.branch_qr_challenges is
  'Ø£ÙƒÙˆØ§Ø¯ QR Ù…ØªØºÙŠØ±Ø© Ø¯Ø§Ø®Ù„ Ø§Ù„ÙØ±Ø¹Ø› Ø§Ù„Ù…ÙˆØ¸Ù ÙŠØ«Ø¨Øª Ø­Ø¶ÙˆØ±Ù‡ ÙØ¹Ù„ÙŠÙ‹Ø§ Ø¯Ø§Ø®Ù„ Ø§Ù„Ù…ÙƒØ§Ù† Ø¨Ù…Ø³Ø­ ÙƒÙˆØ¯ ØµØ§Ù„Ø­ Ù‚ØµÙŠØ± Ø§Ù„Ù…Ø¯Ø©.';

commit;

-- =========================================================
-- END PATCH: 054_attendance_branch_qr_challenge.sql
-- =========================================================


-- =========================================================
-- BEGIN PATCH: 055_attendance_anti_spoofing_risk.sql
-- =========================================================
-- Patch 055: Anti-spoofing, browser install id, liveness, and risk escalation signals
begin;

alter table if exists public.attendance_identity_checks
  add column if not exists browser_install_id text,
  add column if not exists branch_qr_challenge_id uuid,
  add column if not exists branch_qr_status text default 'NOT_REQUIRED',
  add column if not exists liveness_status text default 'NOT_CHECKED',
  add column if not exists location_trust jsonb default '{}'::jsonb,
  add column if not exists anti_spoofing_flags text[] default '{}'::text[];

alter table if exists public.attendance_events
  add column if not exists browser_install_id text,
  add column if not exists branch_qr_status text,
  add column if not exists branch_qr_challenge_id uuid,
  add column if not exists anti_spoofing_flags text[] default '{}'::text[];

create table if not exists public.attendance_risk_escalations (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references public.employees(id) on delete cascade,
  attendance_event_id uuid references public.attendance_events(id) on delete cascade,
  escalation_level text not null check (escalation_level in ('HR_REVIEW','MANAGER_NOTICE','EXECUTIVE_NOTICE')),
  reason text not null,
  risk_score numeric default 0,
  risk_flags text[] default '{}'::text[],
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id)
);

alter table public.attendance_risk_escalations enable row level security;

create policy if not exists "reviewers_read_risk_escalations"
  on public.attendance_risk_escalations
  for select
  using (public.has_app_permission('attendance:review') or public.has_app_permission('users:manage'));

create index if not exists idx_attendance_identity_browser_install
  on public.attendance_identity_checks(browser_install_id, created_at desc);

create index if not exists idx_risk_escalations_employee_date
  on public.attendance_risk_escalations(employee_id, created_at desc);

create or replace function public.create_attendance_risk_escalation(
  p_employee_id uuid,
  p_attendance_event_id uuid,
  p_risk_score numeric,
  p_risk_flags text[] default '{}'::text[]
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_level text := 'HR_REVIEW';
  v_id uuid;
  v_recent_count int;
begin
  select count(*) into v_recent_count
  from public.attendance_risk_escalations
  where employee_id = p_employee_id
    and created_at >= now() - interval '30 days';
  if v_recent_count >= 2 then
    v_level := 'EXECUTIVE_NOTICE';
  elsif v_recent_count >= 1 then
    v_level := 'MANAGER_NOTICE';
  end if;
  insert into public.attendance_risk_escalations(employee_id, attendance_event_id, escalation_level, reason, risk_score, risk_flags)
  values (p_employee_id, p_attendance_event_id, v_level, 'Repeated or high-risk attendance identity signal', p_risk_score, p_risk_flags)
  returning id into v_id;
  return v_id;
end;
$$;

commit;

-- =========================================================
-- END PATCH: 055_attendance_anti_spoofing_risk.sql
-- =========================================================


-- =========================================================
-- BEGIN PATCH: 056_attendance_risk_center.sql
-- =========================================================
-- Patch 056: Attendance risk center, policy acknowledgement, and reporting views
begin;

create table if not exists public.attendance_policy_acknowledgements (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references public.employees(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  policy_version text not null default 'attendance-identity-v3',
  device_fingerprint_hash text,
  browser_install_id text,
  ip_hash text,
  user_agent text,
  acknowledged_at timestamptz not null default now(),
  unique(employee_id, policy_version)
);

alter table public.attendance_policy_acknowledgements enable row level security;

create policy if not exists "employee_ack_own_policy"
  on public.attendance_policy_acknowledgements
  for insert
  with check (auth.uid() = user_id);

create policy if not exists "employee_read_own_policy"
  on public.attendance_policy_acknowledgements
  for select
  using (auth.uid() = user_id or public.has_app_permission('attendance:review') or public.has_app_permission('users:manage'));

create or replace view public.attendance_risk_center as
select
  e.id as attendance_event_id,
  e.employee_id,
  emp.full_name as employee_name,
  e.event_at,
  e.type,
  e.status,
  e.requires_review,
  coalesce(e.risk_score, c.risk_score, 0) as risk_score,
  coalesce(e.risk_level, c.risk_level, 'LOW') as risk_level,
  coalesce(e.risk_flags, c.risk_flags, '{}'::text[]) as risk_flags,
  coalesce(e.anti_spoofing_flags, c.anti_spoofing_flags, '{}'::text[]) as anti_spoofing_flags,
  coalesce(e.selfie_url, c.selfie_url, '') as selfie_url,
  coalesce(e.device_fingerprint_hash, c.device_fingerprint_hash, '') as device_fingerprint_hash,
  coalesce(e.branch_qr_status, c.branch_qr_status, '') as branch_qr_status,
  c.liveness_status,
  c.location_trust,
  c.review_decision,
  c.reviewed_at
from public.attendance_events e
left join public.attendance_identity_checks c on c.attendance_event_id = e.id
left join public.employees emp on emp.id = e.employee_id
where e.requires_review = true
   or coalesce(e.risk_score, c.risk_score, 0) >= 35
   or coalesce(array_length(e.anti_spoofing_flags,1), 0) > 0
   or coalesce(array_length(c.anti_spoofing_flags,1), 0) > 0
order by e.event_at desc;

create or replace view public.attendance_monthly_risk_report as
select
  date_trunc('month', e.event_at)::date as month,
  e.employee_id,
  emp.full_name as employee_name,
  count(*) as total_punches,
  count(*) filter (where e.requires_review = true) as review_count,
  count(*) filter (where coalesce(e.risk_score,0) >= 70) as high_risk_count,
  max(coalesce(e.risk_score,0)) as max_risk_score,
  array_remove(array_agg(distinct flag), null) as risk_flags
from public.attendance_events e
left join public.employees emp on emp.id = e.employee_id
left join lateral unnest(coalesce(e.risk_flags, '{}'::text[])) flag on true
group by 1,2,3
order by month desc, high_risk_count desc, max_risk_score desc;

create or replace function public.acknowledge_attendance_identity_policy(
  p_employee_id uuid,
  p_policy_version text default 'attendance-identity-v3',
  p_device_fingerprint_hash text default '',
  p_browser_install_id text default '',
  p_user_agent text default ''
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.attendance_policy_acknowledgements(
    employee_id, user_id, policy_version, device_fingerprint_hash, browser_install_id, user_agent
  ) values (
    p_employee_id, auth.uid(), coalesce(p_policy_version,'attendance-identity-v3'), p_device_fingerprint_hash, p_browser_install_id, p_user_agent
  )
  on conflict (employee_id, policy_version)
  do update set
    user_id = excluded.user_id,
    device_fingerprint_hash = excluded.device_fingerprint_hash,
    browser_install_id = excluded.browser_install_id,
    user_agent = excluded.user_agent,
    acknowledged_at = now()
  returning id into v_id;
  return v_id;
end;
$$;

comment on view public.attendance_risk_center is
  'Ù…Ø±ÙƒØ² Ù…ÙƒØ§ÙØ­Ø© Ø§Ù„ØªÙ„Ø§Ø¹Ø¨: ÙŠØ¹Ø±Ø¶ ÙƒÙ„ Ø¨ØµÙ…Ø© ØªØ­ØªØ§Ø¬ Ù…Ø±Ø§Ø¬Ø¹Ø© Ø£Ùˆ ØªØ­Ù…Ù„ Ø¥Ø´Ø§Ø±Ø§Øª Ø®Ø·Ø± Ø£Ùˆ Anti-spoofing.';

commit;

-- =========================================================
-- END PATCH: 056_attendance_risk_center.sql
-- =========================================================


-- =========================================================
-- BEGIN PATCH: 057_employee_requests_two_stage_workflow.sql
-- =========================================================
-- Patch 057: Two-stage approval workflow for leaves and missions
begin;

-- workflow statuses include: pending_manager_review, pending_hr_review, manager_rejected, hr_approved, hr_rejected

alter table if exists public.leave_requests
  add column if not exists workflow_status text default 'pending_manager_review',
  add column if not exists direct_manager_id uuid,
  add column if not exists manager_reviewed_at timestamptz,
  add column if not exists manager_decision text,
  add column if not exists manager_note text,
  add column if not exists hr_reviewed_at timestamptz,
  add column if not exists hr_decision text,
  add column if not exists hr_note text,
  add column if not exists final_status text;

alter table if exists public.missions
  add column if not exists workflow_status text default 'pending_manager_review',
  add column if not exists direct_manager_id uuid,
  add column if not exists manager_reviewed_at timestamptz,
  add column if not exists manager_decision text,
  add column if not exists manager_note text,
  add column if not exists hr_reviewed_at timestamptz,
  add column if not exists hr_decision text,
  add column if not exists hr_note text,
  add column if not exists final_status text;

create index if not exists idx_leave_requests_workflow_status on public.leave_requests(workflow_status, created_at desc);
create index if not exists idx_missions_workflow_status on public.missions(workflow_status, created_at desc);

commit;

-- =========================================================
-- END PATCH: 057_employee_requests_two_stage_workflow.sql
-- =========================================================


-- =========================================================
-- BEGIN PATCH: 058_kpi_advanced_workflow_percentages.sql
-- =========================================================
-- Patch 058: Advanced KPI workflow with percentage sliders and staged approvals
begin;

create table if not exists public.kpi_cycles (
  id uuid primary key default gen_random_uuid(),
  cycle_name text not null,
  month_key text not null unique,
  status text not null default 'closed',
  employee_opened_at timestamptz,
  employee_closes_at timestamptz,
  hr_opened_at timestamptz,
  manager_opened_at timestamptz,
  manager_deadline_at timestamptz,
  secretary_reviewed_at timestamptz,
  executive_approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.kpi_evaluations
  add column if not exists cycle_id uuid references public.kpi_cycles(id),
  add column if not exists cycle_name text,
  add column if not exists target_percent numeric default 0,
  add column if not exists efficiency_percent numeric default 0,
  add column if not exists conduct_percent numeric default 0,
  add column if not exists initiatives_percent numeric default 0,
  add column if not exists attendance_percent numeric default 0,
  add column if not exists quran_percent numeric default 0,
  add column if not exists prayer_percent numeric default 0,
  add column if not exists weighted_total numeric default 0,
  add column if not exists hr_notes text,
  add column if not exists manager_notes text,
  add column if not exists secretary_notes text,
  add column if not exists manager_deadline_at timestamptz,
  add column if not exists pdf_exported_at timestamptz;

create or replace function public.calculate_kpi_weighted_total(
  p_target numeric,
  p_efficiency numeric,
  p_conduct numeric,
  p_initiatives numeric,
  p_attendance numeric,
  p_quran numeric,
  p_prayer numeric
) returns numeric language sql immutable as $$
  select round((coalesce(p_target,0) * 40 + coalesce(p_efficiency,0) * 20 + coalesce(p_conduct,0) * 5 + coalesce(p_initiatives,0) * 5 + coalesce(p_attendance,0) * 20 + coalesce(p_quran,0) * 5 + coalesce(p_prayer,0) * 5) / 100, 2);
$$;

create index if not exists idx_kpi_evaluations_status_cycle on public.kpi_evaluations(status, cycle_id, employee_id);

commit;

-- =========================================================
-- END PATCH: 058_kpi_advanced_workflow_percentages.sql
-- =========================================================


-- =========================================================
-- BEGIN PATCH: 059_dispute_committee_privacy_workflow.sql
-- =========================================================
-- Patch 059: Dispute committee privacy workflow
begin;

alter table if exists public.dispute_cases
  add column if not exists related_employee_id uuid,
  add column if not exists has_related_employee boolean default false,
  add column if not exists repeated_before boolean default false,
  add column if not exists repeated_with_same_person boolean default false,
  add column if not exists privacy_level text default 'committee_only',
  add column if not exists public_update text default 'Ù‚ÙŠØ¯ Ù…Ø±Ø§Ø¬Ø¹Ø© Ø§Ù„Ù„Ø¬Ù†Ø©',
  add column if not exists escalated_to_secretary_at timestamptz,
  add column if not exists secretary_extended_until timestamptz,
  add column if not exists escalated_to_executive_at timestamptz,
  add column if not exists due_at timestamptz default (now() + interval '48 hours');

create table if not exists public.dispute_committee_minutes (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.dispute_cases(id) on delete cascade,
  meeting_at timestamptz default now(),
  attendees text[] default '{}',
  summary text default '',
  decision text default '',
  notes text default '',
  created_by uuid,
  created_at timestamptz not null default now()
);

create index if not exists idx_dispute_cases_committee_due on public.dispute_cases(status, due_at);
create index if not exists idx_dispute_cases_related_employee on public.dispute_cases(related_employee_id);

commit;

-- =========================================================
-- END PATCH: 059_dispute_committee_privacy_workflow.sql
-- =========================================================


-- =========================================================
-- BEGIN PATCH: 060_location_readable_labels_and_policy_ack.sql
-- =========================================================
-- Patch 060: Readable location labels and policy acknowledgements metadata
begin;

alter table if exists public.attendance_events
  add column if not exists address_label text,
  add column if not exists location_status text,
  add column if not exists distance_from_branch numeric,
  add column if not exists employee_note text;

alter table if exists public.employee_locations
  add column if not exists address_label text,
  add column if not exists location_status text,
  add column if not exists distance_from_branch numeric;

alter table if exists public.policy_acknowledgements
  add column if not exists device_id text,
  add column if not exists browser_install_id text,
  add column if not exists ip_hash text;

create index if not exists idx_attendance_events_location_status on public.attendance_events(location_status, event_at desc);
commit;

-- =========================================================
-- END PATCH: 060_location_readable_labels_and_policy_ack.sql
-- =========================================================


-- =========================================================
-- BEGIN PATCH: 061_trusted_device_policy_enforcement.sql
-- =========================================================
-- Patch 057: Trusted device policy enforcement and state RPC
-- Purpose: enforce HR-approved devices, maximum devices per employee, and a clear device state for the punch flow.
begin;

create table if not exists public.attendance_device_policy (
  employee_id uuid primary key references public.employees(id) on delete cascade,
  max_trusted_devices integer not null default 2 check (max_trusted_devices between 1 and 5),
  require_hr_approval boolean not null default true,
  allow_temporary_review boolean not null default true,
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.attendance_device_policy enable row level security;

drop policy if exists attendance_device_policy_employee_read on public.attendance_device_policy;
create policy attendance_device_policy_employee_read on public.attendance_device_policy
  for select using (
    employee_id in (select p.employee_id from public.profiles p where p.id = auth.uid())
    or public.has_app_permission('attendance:review')
    or public.has_app_permission('attendance:manage')
    or public.has_app_permission('users:manage')
  );

drop policy if exists attendance_device_policy_admin_write on public.attendance_device_policy;
create policy attendance_device_policy_admin_write on public.attendance_device_policy
  for all using (
    public.has_app_permission('attendance:manage')
    or public.has_app_permission('users:manage')
  ) with check (
    public.has_app_permission('attendance:manage')
    or public.has_app_permission('users:manage')
  );

create or replace function public.get_attendance_device_policy_state(
  p_employee_id uuid,
  p_device_fingerprint_hash text default ''
)
returns table (
  employee_id uuid,
  device_fingerprint_hash text,
  trusted_count integer,
  max_trusted_devices integer,
  has_approved_device boolean,
  has_pending_request boolean,
  pending_request_id uuid,
  requires_approval boolean,
  status text,
  risk_flags text[]
)
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_policy public.attendance_device_policy%rowtype;
  v_pending uuid;
  v_trusted_count integer := 0;
  v_approved boolean := false;
  v_flags text[] := '{}'::text[];
begin
  if p_employee_id is null then
    return;
  end if;

  select * into v_policy
  from public.attendance_device_policy p
  where p.employee_id = p_employee_id;

  if not found then
    v_policy.employee_id := p_employee_id;
    v_policy.max_trusted_devices := 2;
    v_policy.require_hr_approval := true;
    v_policy.allow_temporary_review := true;
  end if;

  select count(*)::integer into v_trusted_count
  from public.passkey_credentials pc
  where pc.employee_id = p_employee_id
    and coalesce(pc.trusted, true) = true
    and coalesce(pc.status, 'DEVICE_TRUSTED') in ('DEVICE_TRUSTED','APPROVED','ACTIVE');

  select exists(
    select 1 from public.passkey_credentials pc
    where pc.employee_id = p_employee_id
      and coalesce(pc.device_fingerprint_hash, '') = coalesce(p_device_fingerprint_hash, '')
      and coalesce(pc.trusted, true) = true
      and coalesce(pc.status, 'DEVICE_TRUSTED') in ('DEVICE_TRUSTED','APPROVED','ACTIVE')
  ) into v_approved;

  select r.id into v_pending
  from public.trusted_device_approval_requests r
  where r.employee_id = p_employee_id
    and coalesce(r.device_fingerprint_hash, '') = coalesce(p_device_fingerprint_hash, '')
    and coalesce(r.status, 'PENDING') = 'PENDING'
  order by r.created_at desc
  limit 1;

  if v_policy.require_hr_approval and not v_approved then
    v_flags := array_append(v_flags, 'DEVICE_APPROVAL_REQUIRED');
  end if;

  if v_trusted_count >= v_policy.max_trusted_devices and not v_approved then
    v_flags := array_append(v_flags, 'DEVICE_LIMIT_REACHED');
  end if;

  return query select
    p_employee_id,
    coalesce(p_device_fingerprint_hash, ''),
    coalesce(v_trusted_count, 0),
    coalesce(v_policy.max_trusted_devices, 2),
    coalesce(v_approved, false),
    v_pending is not null,
    v_pending,
    (array_length(v_flags, 1) is not null),
    case
      when v_approved then 'APPROVED'
      when v_pending is not null then 'PENDING_REVIEW'
      else 'REQUIRES_APPROVAL'
    end,
    coalesce(v_flags, '{}'::text[]);
end;
$$;

comment on function public.get_attendance_device_policy_state(uuid, text) is
  'Returns the HR approval and trusted-device policy state for the employee punch flow.';

commit;

-- =========================================================
-- END PATCH: 061_trusted_device_policy_enforcement.sql
-- =========================================================


-- =========================================================
-- BEGIN PATCH: 062_branch_qr_station_rotation.sql
-- =========================================================
-- Patch 058: Branch QR station rotation settings and admin station view
-- Purpose: make the branch QR challenge operational for an on-site screen/tablet.
begin;

create table if not exists public.branch_qr_station_settings (
  branch_id uuid primary key references public.branches(id) on delete cascade,
  rotate_seconds integer not null default 60 check (rotate_seconds between 30 and 300),
  require_qr_for_punch boolean not null default true,
  station_label text not null default 'Ø´Ø§Ø´Ø© QR Ø§Ù„ÙØ±Ø¹',
  is_active boolean not null default true,
  last_challenge_id uuid,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

alter table public.branch_qr_station_settings enable row level security;

drop policy if exists branch_qr_station_settings_read on public.branch_qr_station_settings;
create policy branch_qr_station_settings_read on public.branch_qr_station_settings
  for select using (auth.uid() is not null);

drop policy if exists branch_qr_station_settings_admin_write on public.branch_qr_station_settings;
create policy branch_qr_station_settings_admin_write on public.branch_qr_station_settings
  for all using (
    public.has_app_permission('attendance:manage')
    or public.has_app_permission('settings:manage')
    or public.has_app_permission('users:manage')
  ) with check (
    public.has_app_permission('attendance:manage')
    or public.has_app_permission('settings:manage')
    or public.has_app_permission('users:manage')
  );

create or replace view public.branch_qr_station_board as
select
  b.id as branch_id,
  b.name as branch_name,
  coalesce(s.rotate_seconds, 60) as rotate_seconds,
  coalesce(s.require_qr_for_punch, true) as require_qr_for_punch,
  coalesce(s.station_label, 'Ø´Ø§Ø´Ø© QR Ø§Ù„ÙØ±Ø¹') as station_label,
  coalesce(s.is_active, true) as is_active,
  c.id as challenge_id,
  c.challenge_code,
  c.valid_until,
  c.created_at as challenge_created_at
from public.branches b
left join public.branch_qr_station_settings s on s.branch_id = b.id
left join lateral (
  select * from public.branch_qr_challenges c
  where c.branch_id = b.id
    and c.valid_until > now()
  order by c.created_at desc
  limit 1
) c on true;

create or replace function public.ensure_branch_qr_station_challenge(p_branch_id uuid)
returns table (
  branch_id uuid,
  challenge_id uuid,
  challenge_code text,
  valid_until timestamptz,
  rotate_seconds integer,
  require_qr_for_punch boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_setting public.branch_qr_station_settings%rowtype;
  v_row record;
begin
  if not (public.has_app_permission('attendance:manage') or public.has_app_permission('settings:manage') or public.has_app_permission('executive:report')) then
    raise exception 'not authorized';
  end if;

  select * into v_setting from public.branch_qr_station_settings where branch_id = p_branch_id;
  if not found then
    insert into public.branch_qr_station_settings(branch_id, updated_by)
    values (p_branch_id, auth.uid())
    on conflict (branch_id) do nothing;
    select * into v_setting from public.branch_qr_station_settings where branch_id = p_branch_id;
  end if;

  select * into v_row
  from public.branch_qr_challenges
  where branch_id = p_branch_id and valid_until > now() + interval '10 seconds'
  order by created_at desc
  limit 1;

  if not found then
    select * into v_row
    from public.create_branch_qr_challenge(p_branch_id)
    limit 1;
    update public.branch_qr_station_settings
      set last_challenge_id = v_row.challenge_id,
          updated_at = now(),
          updated_by = auth.uid()
    where branch_id = p_branch_id;
  end if;

  return query select
    p_branch_id,
    v_row.challenge_id,
    v_row.challenge_code,
    v_row.valid_until,
    coalesce(v_setting.rotate_seconds, 60),
    coalesce(v_setting.require_qr_for_punch, true);
end;
$$;

comment on view public.branch_qr_station_board is
  'Operational screen data for rotating branch QR punch challenges.';

commit;

-- =========================================================
-- END PATCH: 062_branch_qr_station_rotation.sql
-- =========================================================


-- =========================================================
-- BEGIN PATCH: 063_attendance_fraud_ops_snapshot.sql
-- =========================================================
-- Patch 059: Attendance fraud operations snapshot and abuse summaries
-- Purpose: provide executive/HR views for repeated device, browser, GPS, and QR issues.
begin;

create or replace view public.attendance_device_abuse_summary as
select
  coalesce(e.device_fingerprint_hash, c.device_fingerprint_hash, '') as device_fingerprint_hash,
  count(*) as total_punches,
  count(distinct e.employee_id) as distinct_employees,
  max(e.event_at) as last_seen_at,
  array_remove(array_agg(distinct emp.full_name), null) as employee_names,
  max(coalesce(e.risk_score, c.risk_score, 0)) as max_risk_score,
  array_remove(array_agg(distinct flag), null) as risk_flags
from public.attendance_events e
left join public.attendance_identity_checks c on c.attendance_event_id = e.id
left join public.employees emp on emp.id = e.employee_id
left join lateral unnest(coalesce(e.risk_flags, '{}'::text[]) || coalesce(c.risk_flags, '{}'::text[])) flag on true
where coalesce(e.device_fingerprint_hash, c.device_fingerprint_hash, '') <> ''
  and e.event_at >= now() - interval '30 days'
group by 1
having count(distinct e.employee_id) > 1 or max(coalesce(e.risk_score, c.risk_score, 0)) >= 50
order by distinct_employees desc, max_risk_score desc, last_seen_at desc;

create or replace view public.attendance_browser_abuse_summary as
select
  coalesce(e.browser_install_id, c.browser_install_id, '') as browser_install_id,
  count(*) as total_punches,
  count(distinct e.employee_id) as distinct_employees,
  max(e.event_at) as last_seen_at,
  array_remove(array_agg(distinct emp.full_name), null) as employee_names,
  max(coalesce(e.risk_score, c.risk_score, 0)) as max_risk_score
from public.attendance_events e
left join public.attendance_identity_checks c on c.attendance_event_id = e.id
left join public.employees emp on emp.id = e.employee_id
where coalesce(e.browser_install_id, c.browser_install_id, '') <> ''
  and e.event_at >= now() - interval '30 days'
group by 1
having count(distinct e.employee_id) > 1 or max(coalesce(e.risk_score, c.risk_score, 0)) >= 50
order by distinct_employees desc, max_risk_score desc, last_seen_at desc;

create or replace function public.attendance_fraud_ops_snapshot(p_days integer default 30)
returns jsonb
language sql
security definer
stable
set search_path = public
as $$
  select jsonb_build_object(
    'generated_at', now(),
    'days', greatest(1, least(coalesce(p_days,30), 90)),
    'risk_counts', (
      select jsonb_object_agg(risk_level, total)
      from (
        select coalesce(risk_level, 'LOW') as risk_level, count(*) as total
        from public.attendance_events
        where event_at >= now() - (greatest(1, least(coalesce(p_days,30), 90)) || ' days')::interval
        group by 1
      ) x
    ),
    'device_abuse', coalesce((select jsonb_agg(to_jsonb(d)) from (select * from public.attendance_device_abuse_summary limit 50) d), '[]'::jsonb),
    'browser_abuse', coalesce((select jsonb_agg(to_jsonb(b)) from (select * from public.attendance_browser_abuse_summary limit 50) b), '[]'::jsonb),
    'pending_reviews', (
      select count(*) from public.attendance_events
      where requires_review = true
        and event_at >= now() - (greatest(1, least(coalesce(p_days,30), 90)) || ' days')::interval
    ),
    'high_risk', (
      select count(*) from public.attendance_events
      where coalesce(risk_score,0) >= 70
        and event_at >= now() - (greatest(1, least(coalesce(p_days,30), 90)) || ' days')::interval
    )
  );
$$;

comment on function public.attendance_fraud_ops_snapshot(integer) is
  'Executive/HR snapshot of identity fraud indicators over the selected period.';

commit;

-- =========================================================
-- END PATCH: 063_attendance_fraud_ops_snapshot.sql
-- =========================================================


-- =========================================================
-- BEGIN PATCH: 064_attendance_fallback_workflow.sql
-- =========================================================
-- Patch 060: Formal fallback attendance workflow and post-deploy verification
-- Purpose: convert camera/GPS/QR failures into reviewable fallback requests instead of silent failure.
begin;

create table if not exists public.attendance_fallback_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references public.employees(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  action text not null check (action in ('checkIn','checkOut','CHECK_IN','CHECK_OUT')),
  reason text not null default '',
  device_fingerprint_hash text default '',
  browser_install_id text default '',
  latitude double precision,
  longitude double precision,
  accuracy_meters numeric,
  selfie_url text default '',
  status text not null default 'PENDING' check (status in ('PENDING','APPROVED','REJECTED','ESCALATED')),
  review_notes text default '',
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.attendance_fallback_requests enable row level security;

drop policy if exists attendance_fallback_employee_insert on public.attendance_fallback_requests;
create policy attendance_fallback_employee_insert on public.attendance_fallback_requests
  for insert with check (auth.uid() = user_id);

drop policy if exists attendance_fallback_employee_read on public.attendance_fallback_requests;
create policy attendance_fallback_employee_read on public.attendance_fallback_requests
  for select using (
    auth.uid() = user_id
    or public.has_app_permission('attendance:review')
    or public.has_app_permission('attendance:manage')
    or public.has_app_permission('users:manage')
  );

drop policy if exists attendance_fallback_admin_update on public.attendance_fallback_requests;
create policy attendance_fallback_admin_update on public.attendance_fallback_requests
  for update using (
    public.has_app_permission('attendance:review')
    or public.has_app_permission('attendance:manage')
    or public.has_app_permission('users:manage')
  ) with check (
    public.has_app_permission('attendance:review')
    or public.has_app_permission('attendance:manage')
    or public.has_app_permission('users:manage')
  );

create or replace view public.attendance_fallback_review_queue as
select
  r.*,
  e.full_name as employee_name,
  e.job_title,
  e.phone
from public.attendance_fallback_requests r
left join public.employees e on e.id = r.employee_id
where r.status in ('PENDING','ESCALATED')
order by r.created_at desc;

create or replace function public.review_attendance_fallback_request(
  p_request_id uuid,
  p_decision text,
  p_notes text default ''
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.attendance_fallback_requests%rowtype;
begin
  if not (public.has_app_permission('attendance:review') or public.has_app_permission('attendance:manage') or public.has_app_permission('users:manage')) then
    raise exception 'not authorized';
  end if;

  select * into v_request from public.attendance_fallback_requests where id = p_request_id for update;
  if not found then
    raise exception 'fallback request not found';
  end if;

  update public.attendance_fallback_requests
  set status = case when upper(coalesce(p_decision,'')) = 'APPROVED' then 'APPROVED' else 'REJECTED' end,
      review_notes = coalesce(p_notes, ''),
      reviewed_by = auth.uid(),
      reviewed_at = now()
  where id = p_request_id;

  return p_request_id;
end;
$$;

create or replace function public.attendance_identity_post_deploy_check()
returns table(check_name text, ok boolean, detail text)
language sql
security definer
stable
set search_path = public
as $$
  select 'attendance_identity_checks', to_regclass('public.attendance_identity_checks') is not null, 'Patch 051 table' union all
  select 'attendance_identity_review_queue', to_regclass('public.attendance_identity_review_queue') is not null, 'Patch 052 view' union all
  select 'trusted_device_approval_requests', to_regclass('public.trusted_device_approval_requests') is not null, 'Patch 053 table' union all
  select 'branch_qr_challenges', to_regclass('public.branch_qr_challenges') is not null, 'Patch 054 table' union all
  select 'attendance_risk_escalations', to_regclass('public.attendance_risk_escalations') is not null, 'Patch 055 table' union all
  select 'attendance_risk_center', to_regclass('public.attendance_risk_center') is not null, 'Patch 056 view' union all
  select 'attendance_device_policy', to_regclass('public.attendance_device_policy') is not null, 'Patch 057 table' union all
  select 'branch_qr_station_settings', to_regclass('public.branch_qr_station_settings') is not null, 'Patch 058 table' union all
  select 'attendance_device_abuse_summary', to_regclass('public.attendance_device_abuse_summary') is not null, 'Patch 059 view' union all
  select 'attendance_fallback_requests', to_regclass('public.attendance_fallback_requests') is not null, 'Patch 060 table';
$$;

comment on function public.attendance_identity_post_deploy_check() is
  'Post-deploy checklist for Identity Guard patches 051â€“060.';

commit;

-- =========================================================
-- END PATCH: 064_attendance_fallback_workflow.sql
-- =========================================================


-- =========================================================
-- BEGIN PATCH: 065_live_operations_center.sql
-- =========================================================
-- Patch 065: Live Operations Center views and summaries
begin;

create or replace view public.live_operations_center as
select
  now() as generated_at,
  (select count(*) from public.employees where coalesce(is_active, true) = true) as active_employees,
  (select count(*) from public.attendance_events where created_at::date = current_date) as today_attendance_events,
  (select count(*) from public.attendance_identity_checks where requires_review = true and coalesce(review_status,'PENDING') = 'PENDING') as pending_identity_reviews,
  (select count(*) from public.leave_requests where status in ('pending_manager_review','pending_hr_review','PENDING')) as pending_leave_requests,
  (select count(*) from public.mission_requests where status in ('pending_manager_review','pending_hr_review','PENDING')) as pending_mission_requests;

comment on view public.live_operations_center is 'Live command center counters for HR/admin/executive dashboards.';
commit;

-- =========================================================
-- END PATCH: 065_live_operations_center.sql
-- =========================================================


-- =========================================================
-- BEGIN PATCH: 066_face_match_optional_metadata.sql
-- =========================================================
-- Patch 066: Optional face-match metadata for punch selfies
begin;

alter table if exists public.attendance_identity_checks
  add column if not exists face_match_score numeric,
  add column if not exists face_match_status text default 'NOT_RUN'
    check (face_match_status in ('NOT_RUN','MATCH','WEAK_MATCH','NO_MATCH','MANUAL_REVIEW','ERROR')),
  add column if not exists liveness_status text default 'NOT_RUN'
    check (liveness_status in ('NOT_RUN','PASS','FAIL','MANUAL_REVIEW','ERROR'));

create index if not exists idx_attendance_identity_face_status
  on public.attendance_identity_checks(face_match_status, created_at desc);

commit;

-- =========================================================
-- END PATCH: 066_face_match_optional_metadata.sql
-- =========================================================


-- =========================================================
-- BEGIN PATCH: 067_smart_alerts_engine.sql
-- =========================================================
-- Patch 067: Smart alerts engine rules and event queue
begin;

create table if not exists public.smart_alert_rules (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  title text not null,
  description text default '',
  target_role text default 'hr',
  is_active boolean not null default true,
  severity text not null default 'INFO' check (severity in ('INFO','WARNING','CRITICAL')),
  schedule_hint text default '',
  created_at timestamptz not null default now()
);

create table if not exists public.smart_alert_events (
  id uuid primary key default gen_random_uuid(),
  rule_code text not null,
  employee_id uuid null,
  title text not null,
  body text not null,
  severity text not null default 'INFO' check (severity in ('INFO','WARNING','CRITICAL')),
  status text not null default 'PENDING' check (status in ('PENDING','SENT','FAILED','DISMISSED')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  sent_at timestamptz null
);

insert into public.smart_alert_rules(code,title,description,target_role,severity,schedule_hint)
values
('MISSING_PUNCH_0930','ØªØ°ÙƒÙŠØ± Ø¨ØµÙ…Ø© 9:30','ØªÙ†Ø¨ÙŠÙ‡ Ù„Ù„Ù…ÙˆØ¸ÙÙŠÙ† Ø§Ù„Ø°ÙŠÙ† Ù„Ù… ÙŠØ³Ø¬Ù„ÙˆØ§ Ø­Ø¶ÙˆØ±Ù‡Ù… Ø­ØªÙ‰ 9:30','employee','WARNING','daily 09:30'),
('HIGH_RISK_ATTENDANCE','Ø¨ØµÙ…Ø© Ø¹Ø§Ù„ÙŠØ© Ø§Ù„Ø®Ø·ÙˆØ±Ø©','ØªØµØ¹ÙŠØ¯ Ø¨ØµÙ…Ø§Øª Ø§Ù„Ø­Ø¶ÙˆØ± Ø°Ø§Øª Ø¯Ø±Ø¬Ø© Ø®Ø·Ø± Ø¹Ø§Ù„ÙŠØ©','hr','CRITICAL','realtime'),
('PENDING_MANAGER_APPROVAL','Ù…ÙˆØ§ÙÙ‚Ø§Øª Ù…Ø¯ÙŠØ± Ù…Ø¹Ù„Ù‚Ø©','ØªÙ†Ø¨ÙŠÙ‡ Ø§Ù„Ù…Ø¯ÙŠØ± Ø¨Ø·Ù„Ø¨Ø§Øª ÙØ±ÙŠÙ‚Ù‡ Ø§Ù„Ù…Ø¹Ù„Ù‚Ø©','direct_manager','WARNING','hourly')
on conflict (code) do update set title=excluded.title, description=excluded.description, target_role=excluded.target_role, severity=excluded.severity, schedule_hint=excluded.schedule_hint;

commit;

-- =========================================================
-- END PATCH: 067_smart_alerts_engine.sql
-- =========================================================


-- =========================================================
-- BEGIN PATCH: 068_monthly_reports_exports.sql
-- =========================================================
-- Patch 068: Monthly HR report snapshots and export log
begin;

create table if not exists public.monthly_report_exports (
  id uuid primary key default gen_random_uuid(),
  report_month date not null,
  report_type text not null default 'FULL_HR_MONTHLY',
  generated_by uuid null references auth.users(id),
  status text not null default 'PENDING' check (status in ('PENDING','GENERATED','FAILED')),
  file_url text default '',
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  generated_at timestamptz null
);

create index if not exists idx_monthly_report_exports_month
  on public.monthly_report_exports(report_month desc, report_type);

commit;

-- =========================================================
-- END PATCH: 068_monthly_reports_exports.sql
-- =========================================================


-- =========================================================
-- BEGIN PATCH: 069_visual_permissions_matrix.sql
-- =========================================================
-- Patch 069: Visual permissions matrix support
begin;

create table if not exists public.permission_catalog (
  permission_key text primary key,
  title_ar text not null,
  category text not null default 'general',
  description text default '',
  is_sensitive boolean not null default false,
  created_at timestamptz not null default now()
);

insert into public.permission_catalog(permission_key,title_ar,category,is_sensitive)
values
('employees:read','Ø¹Ø±Ø¶ Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ†','employees',false),
('employees:manage','Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ†','employees',true),
('attendance:review','Ù…Ø±Ø§Ø¬Ø¹Ø© Ø§Ù„Ø­Ø¶ÙˆØ±','attendance',true),
('reports:export','ØªØµØ¯ÙŠØ± Ø§Ù„ØªÙ‚Ø§Ø±ÙŠØ±','reports',true),
('settings:manage','Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª','settings',true),
('disputes:committee','Ù„Ø¬Ù†Ø© Ø§Ù„Ø®Ù„Ø§ÙØ§Øª','disputes',true)
on conflict (permission_key) do update set title_ar=excluded.title_ar, category=excluded.category, is_sensitive=excluded.is_sensitive;

commit;

-- =========================================================
-- END PATCH: 069_visual_permissions_matrix.sql
-- =========================================================


-- =========================================================
-- BEGIN PATCH: 070_backup_restore_status_center.sql
-- =========================================================
-- Patch 070: Backup and restore status center
begin;

create table if not exists public.backup_restore_jobs (
  id uuid primary key default gen_random_uuid(),
  job_type text not null check (job_type in ('BACKUP','RESTORE','VERIFY')),
  status text not null default 'PENDING' check (status in ('PENDING','RUNNING','SUCCESS','FAILED','CANCELLED')),
  started_by uuid null references auth.users(id),
  file_url text default '',
  size_bytes bigint default 0,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  finished_at timestamptz null
);

create index if not exists idx_backup_restore_jobs_status
  on public.backup_restore_jobs(status, created_at desc);

commit;

-- =========================================================
-- END PATCH: 070_backup_restore_status_center.sql
-- =========================================================


-- =========================================================
-- BEGIN PATCH: 071_internal_tasks_enhanced.sql
-- =========================================================
-- Patch 071: Enhanced internal tasks system
begin;

create table if not exists public.internal_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text default '',
  assigned_to uuid null,
  assigned_by uuid null,
  due_date date null,
  priority text not null default 'NORMAL' check (priority in ('LOW','NORMAL','HIGH','URGENT')),
  status text not null default 'PENDING' check (status in ('PENDING','IN_PROGRESS','COMPLETED','CANCELLED')),
  source text default 'manual',
  metadata jsonb not null default '{}'::jsonb,
  completed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_internal_tasks_assignee_status
  on public.internal_tasks(assigned_to, status, due_date);

commit;

-- =========================================================
-- END PATCH: 071_internal_tasks_enhanced.sql
-- =========================================================


-- =========================================================
-- BEGIN PATCH: 072_official_messages_read_receipts.sql
-- =========================================================
-- Patch 072: Official internal messages and read receipts
begin;

create table if not exists public.official_messages (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  audience text not null default 'all',
  created_by uuid null references auth.users(id),
  is_formal_decision boolean not null default false,
  requires_ack boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.official_message_receipts (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.official_messages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  read_at timestamptz null,
  acknowledged_at timestamptz null,
  device_id text default '',
  unique(message_id, user_id)
);

create index if not exists idx_official_message_receipts_user
  on public.official_message_receipts(user_id, read_at desc);

commit;

-- =========================================================
-- END PATCH: 072_official_messages_read_receipts.sql
-- =========================================================


-- =========================================================
-- BEGIN PATCH: 073_offline_attendance_sync_queue.sql
-- =========================================================
-- Patch 073: Offline attendance sync queue
begin;

create table if not exists public.offline_attendance_sync_queue (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid null,
  user_id uuid null references auth.users(id),
  client_attempt_id text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'PENDING_REVIEW' check (status in ('PENDING_REVIEW','SYNCED','REJECTED','DUPLICATE')),
  review_note text default '',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz null,
  unique(client_attempt_id)
);

create index if not exists idx_offline_attendance_sync_status
  on public.offline_attendance_sync_queue(status, created_at desc);

commit;

-- =========================================================
-- END PATCH: 073_offline_attendance_sync_queue.sql
-- =========================================================


-- =========================================================
-- BEGIN PATCH: 074_e2e_and_health_tracking.sql
-- =========================================================
-- Patch 074: E2E smoke test and health tracking log
begin;

create table if not exists public.system_health_checks (
  id uuid primary key default gen_random_uuid(),
  check_code text not null,
  status text not null check (status in ('PASS','WARN','FAIL')),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_system_health_checks_code_time
  on public.system_health_checks(check_code, created_at desc);

commit;

-- =========================================================
-- END PATCH: 074_e2e_and_health_tracking.sql
-- =========================================================


-- =========================================================
-- 077 V24 Location Request + Push/CORS Runtime Alignment
-- Safe/idempotent: fixes notification 400s and push subscription shape used by Edge Functions.
-- =========================================================

begin;

alter table if exists public.notifications
  add column if not exists route text default '',
  add column if not exists push_sent_at timestamptz,
  add column if not exists push_status text default '',
  add column if not exists push_error text default '';

alter table if exists public.push_subscriptions
  add column if not exists employee_id uuid references public.employees(id) on delete cascade,
  add column if not exists payload jsonb not null default '{}'::jsonb,
  add column if not exists keys jsonb not null default '{}'::jsonb,
  add column if not exists p256dh text default '',
  add column if not exists auth text default '',
  add column if not exists endpoint_hash text default '',
  add column if not exists user_agent text default '',
  add column if not exists platform text default '',
  add column if not exists permission text default 'granted',
  add column if not exists is_active boolean not null default true,
  add column if not exists status text not null default 'ACTIVE',
  add column if not exists last_seen_at timestamptz,
  add column if not exists last_sent_at timestamptz,
  add column if not exists last_error text default '',
  add column if not exists updated_at timestamptz not null default now();

update public.push_subscriptions
set keys = coalesce(nullif(keys, '{}'::jsonb), payload -> 'keys', '{}'::jsonb),
    p256dh = coalesce(nullif(p256dh, ''), payload #>> '{keys,p256dh}', keys ->> 'p256dh', ''),
    auth = coalesce(nullif(auth, ''), payload #>> '{keys,auth}', keys ->> 'auth', ''),
    endpoint_hash = coalesce(nullif(endpoint_hash, ''), md5(endpoint)),
    status = coalesce(nullif(status, ''), case when is_active then 'ACTIVE' else 'EXPIRED' end),
    last_seen_at = coalesce(last_seen_at, created_at),
    updated_at = now()
where endpoint is not null;

create unique index if not exists push_subscriptions_endpoint_hash_idx
  on public.push_subscriptions(endpoint_hash)
  where endpoint_hash <> '';
create index if not exists idx_push_subscriptions_employee_active
  on public.push_subscriptions(employee_id, is_active, status);
create index if not exists idx_push_subscriptions_user_active
  on public.push_subscriptions(user_id, is_active, status);
create index if not exists idx_notifications_employee_created
  on public.notifications(employee_id, created_at desc);

alter table public.notifications enable row level security;
alter table public.push_subscriptions enable row level security;

drop policy if exists "notifications_live_location_insert_scope" on public.notifications;
create policy "notifications_live_location_insert_scope"
  on public.notifications
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    or employee_id = public.current_employee_id()
    or public.current_is_full_access()
    or public.has_any_permission(array['notifications:manage','alerts:manage','live-location:request','executive:report'])
  );

drop policy if exists "notifications_live_location_read_scope" on public.notifications;
create policy "notifications_live_location_read_scope"
  on public.notifications
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or employee_id = public.current_employee_id()
    or public.current_is_full_access()
    or public.has_any_permission(array['notifications:manage','alerts:manage','executive:report'])
  );

drop policy if exists "notifications_live_location_update_scope" on public.notifications;
create policy "notifications_live_location_update_scope"
  on public.notifications
  for update
  to authenticated
  using (
    user_id = auth.uid()
    or employee_id = public.current_employee_id()
    or public.current_is_full_access()
    or public.has_any_permission(array['notifications:manage','alerts:manage','executive:report'])
  )
  with check (
    user_id = auth.uid()
    or employee_id = public.current_employee_id()
    or public.current_is_full_access()
    or public.has_any_permission(array['notifications:manage','alerts:manage','executive:report'])
  );

drop policy if exists "push_subscriptions_runtime_scope" on public.push_subscriptions;
create policy "push_subscriptions_runtime_scope"
  on public.push_subscriptions
  for all
  to authenticated
  using (
    user_id = auth.uid()
    or employee_id = public.current_employee_id()
    or public.current_is_full_access()
    or public.has_any_permission(array['notifications:manage','alerts:manage','live-location:request','executive:report'])
  )
  with check (
    user_id = auth.uid()
    or employee_id = public.current_employee_id()
    or public.current_is_full_access()
    or public.has_any_permission(array['notifications:manage','alerts:manage','live-location:request','executive:report'])
  );

insert into public.database_migration_status (name, status, notes)
values ('077_v24_location_push_cors', 'APPLIED', 'Aligned notifications, push subscriptions, and live location request policies for v24')
on conflict (name) do update set status = excluded.status, notes = excluded.notes, applied_at = now();

commit;

-- =========================================================
-- END SECTION: 044-074 Expanded production patches
-- =========================================================


-- =========================================================
-- BEGIN SECTION: 075 QR disabled + attendance reminders
-- SOURCE: supabase/sql/patches/075_qr_disabled_and_attendance_reminder_runner.sql
-- =========================================================

-- Patch 075: Disable branch QR operationally + prepare real 09:30 attendance reminders
-- Safe/idempotent patch. It keeps old QR tables/columns for compatibility but turns QR off.

begin;

-- 1) Keep branch QR schema for historical data, but never require QR for punches.
do $$
begin
  if to_regclass('public.branch_qr_station_settings') is not null then
    update public.branch_qr_station_settings
       set require_qr_for_punch = false,
           station_label = coalesce(nullif(station_label, ''), 'QR Ù…ØªÙˆÙ‚Ù'),
           updated_at = now()
     where coalesce(require_qr_for_punch, true) = true;
  end if;
end $$;

-- 2) Store runtime attendance policy in system_settings when available.
do $$
begin
  if to_regclass('public.system_settings') is not null then
    insert into public.system_settings(key, value, description)
    values
      ('attendance.qr_required', 'false'::jsonb, 'QR disabled by Patch 075; attendance uses passkey + GPS + selfie.'),
      ('attendance.reminder_push_time', '"09:30"'::jsonb, 'Daily missing-punch push reminder target time, Africa/Cairo.'),
      ('attendance.reminder_page_time', '"10:00"'::jsonb, 'In-page reminder target time, Africa/Cairo.'),
      ('attendance.gps_policy', '{"samples":12,"sampleWindowMs":22000,"targetAccuracyMeters":25,"maxAcceptableAccuracyMeters":180,"safetyBufferMeters":220,"uncertainReviewOnly":true}'::jsonb, 'GPS policy: avoid catastrophic outside judgement when GPS is uncertain.')
    on conflict (key) do update
      set value = excluded.value,
          description = excluded.description,
          updated_at = now();
  end if;
end $$;

-- 3) Idempotent queue function for SQL/manual runners. The Edge Function sends Web Push.
create or replace function public.queue_missing_punch_reminders(p_for_date date default (now() at time zone 'Africa/Cairo')::date)
returns table(created_count integer, target_count integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_created integer := 0;
  v_target integer := 0;
begin
  with active_employees as (
    select e.id, e.user_id
    from public.employees e
    where coalesce(e.is_active, true) = true
      and coalesce(e.status, 'ACTIVE') not in ('INACTIVE','SUSPENDED','ARCHIVED')
  ), attended as (
    select distinct ae.employee_id
    from public.attendance_events ae
    where ae.employee_id is not null
      and ((ae.event_at at time zone 'Africa/Cairo')::date = p_for_date
           or (ae.created_at at time zone 'Africa/Cairo')::date = p_for_date)
  ), existing as (
    select distinct n.employee_id
    from public.notifications n
    where n.employee_id is not null
      and n.type = 'MISSING_PUNCH'
      and (n.created_at at time zone 'Africa/Cairo')::date = p_for_date
  ), targets as (
    select a.*
    from active_employees a
    left join attended t on t.employee_id = a.id
    left join existing x on x.employee_id = a.id
    where t.employee_id is null and x.employee_id is null
  ), inserted as (
    insert into public.notifications(user_id, employee_id, title, body, type, status, is_read, route)
    select user_id, id,
           'ØªØ°ÙƒÙŠØ± Ø¨ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¨ØµÙ…Ø©',
           'Ù„Ù… ÙŠØªÙ… ØªØ³Ø¬ÙŠÙ„ Ø¨ØµÙ…Ø© Ø­Ø¶ÙˆØ± Ø§Ù„ÙŠÙˆÙ… Ø­ØªÙ‰ Ø§Ù„Ø¢Ù†. Ø§ÙØªØ­ ØµÙØ­Ø© Ø§Ù„Ø¨ØµÙ…Ø© ÙˆØ³Ø¬Ù„ Ø­Ø¶ÙˆØ±Ùƒ Ø¹Ù†Ø¯ Ø§Ù„ÙˆØµÙˆÙ„ Ù„Ù„Ù…Ø¬Ù…Ø¹.',
           'MISSING_PUNCH', 'UNREAD', false, 'punch'
    from targets
    returning id
  )
  select (select count(*) from inserted), (select count(*) from targets)
    into v_created, v_target;

  if to_regclass('public.smart_alert_events') is not null then
    insert into public.smart_alert_events(rule_code, title, body, severity, status, payload, sent_at)
    values ('MISSING_PUNCH_0930', 'ØªØ´ØºÙŠÙ„ ØªØ°ÙƒÙŠØ± Ø¨ØµÙ…Ø© 9:30',
            'ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ ' || v_created || ' Ø¥Ø´Ø¹Ø§Ø± Ø¯Ø§Ø®Ù„ÙŠ. Ø¥Ø±Ø³Ø§Ù„ Push ÙŠØªÙ… Ø¹Ø¨Ø± Edge Function send-attendance-reminders.',
            'WARNING', 'SENT', jsonb_build_object('date', p_for_date, 'created', v_created, 'targets', v_target), now());
  end if;

  return query select v_created, v_target;
end;
$$;

comment on function public.queue_missing_punch_reminders(date) is
  'Queues missing-punch notifications for employees without attendance on a date. Use Edge Function send-attendance-reminders for real Web Push delivery.';

-- 4) Optional pg_cron SQL queue. Web Push still needs the Edge Function scheduled/called.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule('ahla-shabab-missing-punch-queue-0930');
    perform cron.schedule('ahla-shabab-missing-punch-queue-0930', '30 9 * * 0-4,6', $q$select * from public.queue_missing_punch_reminders((now() at time zone 'Africa/Cairo')::date);$q$);
  end if;
exception when undefined_function or invalid_schema_name then
  null;
when others then
  -- Keep patch idempotent even if pg_cron is unavailable in this Supabase project.
  null;
end $$;

commit;

-- =========================================================
-- END SECTION: 075 QR disabled + attendance reminders
-- =========================================================


-- =========================================================
-- BEGIN SECTION: 076 Phone login + organization permissions polish
-- SOURCE: supabase/sql/PRODUCTION_SQL_EDITOR_PATCHES_076_V13.sql
-- =========================================================

-- =========================================================
-- 076 V13 Phone Login + Org Permissions + Production Polish
-- Safe patch: keeps existing secrets/files untouched. Apply after 075.
-- =========================================================

-- 1) Normalize Egyptian phone numbers consistently.
create or replace function public.normalize_egypt_phone(input_phone text)
returns text
language plpgsql
immutable
as $$
declare
  digits text;
begin
  if input_phone is null then return null; end if;
  digits := translate(input_phone, 'Ù Ù¡Ù¢Ù£Ù¤Ù¥Ù¦Ù§Ù¨Ù©Û°Û±Û²Û³Û´ÛµÛ¶Û·Û¸Û¹', '01234567890123456789');
  digits := regexp_replace(digits, '\D', '', 'g');
  if digits = '' then return null; end if;
  if left(digits, 4) = '0020' then digits := substring(digits from 3); end if;
  if left(digits, 2) = '20' and length(digits) >= 12 then digits := '0' || substring(digits from 3); end if;
  if length(digits) = 10 and left(digits, 1) = '1' then digits := '0' || digits; end if;
  return digits;
end;
$$;

alter table if exists public.employees add column if not exists phone_normalized text;
alter table if exists public.profiles add column if not exists phone_normalized text;
alter table if exists public.profiles add column if not exists must_change_password boolean default false;
alter table if exists public.profiles add column if not exists temporary_password boolean default false;
alter table if exists public.profiles add column if not exists password_changed_at timestamptz;

update public.employees set phone_normalized = public.normalize_egypt_phone(phone) where phone is not null;
update public.profiles set phone_normalized = public.normalize_egypt_phone(phone) where phone is not null;

create or replace function public.set_phone_normalized()
returns trigger
language plpgsql
as $$
begin
  new.phone_normalized := public.normalize_egypt_phone(new.phone);
  return new;
end;
$$;

drop trigger if exists trg_employees_phone_normalized on public.employees;
create trigger trg_employees_phone_normalized
before insert or update of phone on public.employees
for each row execute function public.set_phone_normalized();

drop trigger if exists trg_profiles_phone_normalized on public.profiles;
create trigger trg_profiles_phone_normalized
before insert or update of phone on public.profiles
for each row execute function public.set_phone_normalized();

-- 2) Resolve login phone to Auth email. Browser still uses signInWithPassword(email,password).
create or replace function public.resolve_login_identifier(login_identifier text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized text := public.normalize_egypt_phone(login_identifier);
  resolved_email text;
begin
  if normalized is null then return null; end if;

  select lower(p.email) into resolved_email
  from public.profiles p
  where coalesce(p.status, 'ACTIVE') in ('ACTIVE','INVITED')
    and public.normalize_egypt_phone(coalesce(p.phone_normalized, p.phone)) = normalized
    and p.email is not null
  order by p.updated_at desc nulls last
  limit 1;

  if resolved_email is not null then return resolved_email; end if;

  select lower(coalesce(p.email, e.email)) into resolved_email
  from public.employees e
  left join public.profiles p on p.employee_id = e.id or p.id = e.user_id
  where coalesce(e.is_deleted, false) = false
    and coalesce(e.status, 'ACTIVE') in ('ACTIVE','INVITED')
    and public.normalize_egypt_phone(coalesce(e.phone_normalized, e.phone)) = normalized
  order by e.updated_at desc nulls last
  limit 1;

  return resolved_email;
end;
$$;

grant execute on function public.resolve_login_identifier(text) to anon, authenticated;

-- 3) Prevent future duplicate phone assignments among active employees/profiles.
create or replace function public.prevent_duplicate_active_phone()
returns trigger
language plpgsql
as $$
declare
  normalized text := public.normalize_egypt_phone(new.phone);
  conflict_name text;
begin
  if normalized is null then return new; end if;

  if tg_table_name = 'employees' then
    select full_name into conflict_name
    from public.employees
    where id <> new.id
      and coalesce(is_deleted, false) = false
      and coalesce(status, 'ACTIVE') in ('ACTIVE','INVITED')
      and public.normalize_egypt_phone(coalesce(phone_normalized, phone)) = normalized
    limit 1;
  else
    select full_name into conflict_name
    from public.profiles
    where id <> new.id
      and coalesce(status, 'ACTIVE') in ('ACTIVE','INVITED')
      and public.normalize_egypt_phone(coalesce(phone_normalized, phone)) = normalized
    limit 1;
  end if;

  if conflict_name is not null then
    raise exception 'DUPLICATE_PHONE: Ø±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ Ù…Ø³ØªØ®Ø¯Ù… Ø¨Ø§Ù„ÙØ¹Ù„ Ù„Ø¯Ù‰ %', conflict_name;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_employees_prevent_duplicate_phone on public.employees;
create trigger trg_employees_prevent_duplicate_phone
before insert or update of phone on public.employees
for each row execute function public.prevent_duplicate_active_phone();

drop trigger if exists trg_profiles_prevent_duplicate_phone on public.profiles;
create trigger trg_profiles_prevent_duplicate_phone
before insert or update of phone on public.profiles
for each row execute function public.prevent_duplicate_active_phone();

-- 4) Official hierarchy alignment for existing known names.
do $$
declare
  exec_id uuid;
  secretary_id uuid;
  manager_id uuid;
begin
  select id into exec_id from public.employees where full_name ilike '%Ù…Ø­Ù…Ø¯ ÙŠÙˆØ³Ù%' or full_name ilike '%Ø§Ù„Ø´ÙŠØ® Ù…Ø­Ù…Ø¯%' order by created_at limit 1;
  select id into secretary_id from public.employees where full_name ilike '%ÙŠØ­ÙŠ%Ø¬Ù…Ø§Ù„%Ø§Ù„Ø³Ø¨Ø¹%' or full_name ilike '%Ø§Ù„Ø³ÙƒØ±ØªÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ%' order by created_at limit 1;

  if exec_id is not null then
    update public.employees set manager_employee_id = null where id = exec_id;
    if secretary_id is not null then update public.employees set manager_employee_id = exec_id where id = secretary_id; end if;
    update public.employees set manager_employee_id = exec_id where full_name in ('Ø£Ø­Ù…Ø¯ Ù…Ø­Ø¬ÙˆØ¨','Ø¨Ù„Ø§Ù„ Ù…Ø­Ù…Ø¯ Ø§Ù„Ø´Ø§ÙƒØ±','ÙŠØ§Ø³Ø± ÙØªØ­ÙŠ Ù†ÙˆØ± Ø§Ù„Ø¯ÙŠÙ†','Ù…Ø­Ù…Ø¯ Ø¹Ø¨Ø¯ Ø§Ù„Ø¨Ø§Ø³Ø·','Ù…Ø­Ù…Ø¯ Ø¹Ø¨Ø¯ Ø§Ù„Ø¨Ø§Ø³Ø· (Ø£Ø¨Ùˆ Ø¹Ù…Ø§Ø±)','Ù…ØµØ·ÙÙŠ ÙØ§ÙŠØ¯','Ù…ØµØ·ÙÙ‰ ÙØ§ÙŠØ¯','Ù…ØµØ·ÙÙ‰ Ø£Ø­Ù…Ø¯','ÙŠÙˆØ³Ù Ø±Ø³Ù…ÙŠ Ø´Ø¹Ø¨Ø§Ù†') and id <> exec_id;
  end if;

  select id into manager_id from public.employees where full_name in ('Ù…Ø­Ù…Ø¯ Ø¹Ø¨Ø¯ Ø§Ù„Ø¨Ø§Ø³Ø·','Ù…Ø­Ù…Ø¯ Ø¹Ø¨Ø¯ Ø§Ù„Ø¨Ø§Ø³Ø· (Ø£Ø¨Ùˆ Ø¹Ù…Ø§Ø±)') order by created_at limit 1;
  if manager_id is not null then
    update public.employees set manager_employee_id = manager_id where full_name in ('Ù…Ø­Ù…Ø¯ Ø¹Ø¨Ø¯ Ø§Ù„Ø¹Ø¸ÙŠÙ…','Ù‡Ø§Ù†ÙŠ Ø§Ø­Ù…Ø¯ Ù†ØµÙŠØ±','Ù‡Ø§Ù†ÙŠ Ø£Ø­Ù…Ø¯ Ù†ØµÙŠØ±','Ø­Ø§Ù…Ø¯ Ù…Ø­Ù…ÙˆØ¯ Ø§Ù„Ø¹Ù…Ø¯Ø©');
    update public.employees set manager_employee_id = (select id from public.employees where full_name = 'Ø­Ø§Ù…Ø¯ Ù…Ø­Ù…ÙˆØ¯ Ø§Ù„Ø¹Ù…Ø¯Ø©' limit 1) where full_name = 'Ø¹Ø¨Ø¯ Ø§Ù„Ø±Ø­Ù…Ù† Ø­Ø³ÙŠÙ†' and exists (select 1 from public.employees where full_name = 'Ø­Ø§Ù…Ø¯ Ù…Ø­Ù…ÙˆØ¯ Ø§Ù„Ø¹Ù…Ø¯Ø©');
  end if;

  select id into manager_id from public.employees where full_name = 'Ø£Ø­Ù…Ø¯ Ù…Ø­Ø¬ÙˆØ¨' order by created_at limit 1;
  if manager_id is not null then update public.employees set manager_employee_id = manager_id where full_name in ('Ø¹Ø¨Ø¯Ø§Ù„Ù„Ù‡ Ø­Ø³ÙŠÙ† Ø­Ø§ÙØ¸','Ø¹Ø¨Ø¯ Ø§Ù„Ù„Ù‡ Ø­Ø³ÙŠÙ† Ø­Ø§ÙØ¸','Ø¹Ø¨Ø¯ Ø§Ù„Ù‚Ø§Ø¯Ø± Ø¬Ù…Ø§Ù„'); end if;

  select id into manager_id from public.employees where full_name = 'ÙŠÙˆØ³Ù Ø±Ø³Ù…ÙŠ Ø´Ø¹Ø¨Ø§Ù†' order by created_at limit 1;
  if manager_id is not null then update public.employees set manager_employee_id = manager_id where full_name in ('Ø¥Ø³Ù…Ø§Ø¹ÙŠÙ„ Ø¹Ø¨Ø¯Ø§Ù„Ù„Ù‡','Ø§Ø³Ù…Ø§Ø¹ÙŠÙ„ Ø¹Ø¨Ø¯Ø§Ù„Ù„Ù‡','Ø­Ø³Ø§Ù… Ø¹ÙÙŠÙÙŠ','Ù…Ø­Ù…Ø¯ Ø¹Ø¨Ø¯Ù‡ Ù…Ø²Ø§Ø±'); end if;

  select id into manager_id from public.employees where full_name = 'Ø¨Ù„Ø§Ù„ Ù…Ø­Ù…Ø¯ Ø§Ù„Ø´Ø§ÙƒØ±' order by created_at limit 1;
  if manager_id is not null then update public.employees set manager_employee_id = manager_id where full_name = 'Ø¹Ù…Ø§Ø± Ù…Ø­Ù…Ø¯'; end if;

  select id into manager_id from public.employees where full_name = 'Ù…ØµØ·ÙÙ‰ Ø£Ø­Ù…Ø¯' or full_name = 'Ù…ØµØ·ÙÙŠ Ø£Ø­Ù…Ø¯' order by created_at limit 1;
  if manager_id is not null then update public.employees set manager_employee_id = manager_id where full_name in ('Ù…Ø­Ù…Ø¯ Ø³ÙŠØ¯','Ø±Ø¨ÙŠØ¹ Ù…Ø­Ù…Ø¯','Ø­Ø§ØªÙ… Ù…Ø­Ù…Ø¯ Ø³Ø§Ù„Ù…','Ø·Ø§Ø±Ù‚ Ø³ÙŠØ¯ Ø¥Ø¨Ø±Ø§Ù‡ÙŠÙ…'); end if;
end $$;

-- 5) Attendance / GPS production setting marker.
insert into public.system_settings(key, value, description)
values (
  'v13_production_polish',
  '{"phoneLogin":true,"temporaryPasswordIsPhone":true,"qrDisabled":true,"gpsReviewInsteadOfHardReject":true,"orgChartFromExecutive":true,"employeeProfileEditable":true}'::jsonb,
  'V13 production polish: phone login, profile edits, org chart, GPS review and QR disabled.'
)
on conflict (key) do update set value = excluded.value, description = excluded.description, updated_at = now();

notify pgrst, 'reload schema';

-- =========================================================
-- END SECTION: 076 Phone login + organization permissions polish
-- =========================================================


-- =========================================================
-- BEGIN SECTION: 077 Location push CORS alignment
-- SECTION: merged v24 location push CORS fixes
-- =========================================================

-- =========================================================
-- 077 V24 Location Request + Push/CORS Runtime Alignment
-- Safe/idempotent: fixes notification 400s and push subscription shape used by Edge Functions.
-- =========================================================

begin;

alter table if exists public.notifications
  add column if not exists route text default '',
  add column if not exists push_sent_at timestamptz,
  add column if not exists push_status text default '',
  add column if not exists push_error text default '';

alter table if exists public.push_subscriptions
  add column if not exists employee_id uuid references public.employees(id) on delete cascade,
  add column if not exists payload jsonb not null default '{}'::jsonb,
  add column if not exists keys jsonb not null default '{}'::jsonb,
  add column if not exists p256dh text default '',
  add column if not exists auth text default '',
  add column if not exists endpoint_hash text default '',
  add column if not exists user_agent text default '',
  add column if not exists platform text default '',
  add column if not exists permission text default 'granted',
  add column if not exists is_active boolean not null default true,
  add column if not exists status text not null default 'ACTIVE',
  add column if not exists last_seen_at timestamptz,
  add column if not exists last_sent_at timestamptz,
  add column if not exists last_error text default '',
  add column if not exists updated_at timestamptz not null default now();

update public.push_subscriptions
set keys = coalesce(nullif(keys, '{}'::jsonb), payload -> 'keys', '{}'::jsonb),
    p256dh = coalesce(nullif(p256dh, ''), payload #>> '{keys,p256dh}', keys ->> 'p256dh', ''),
    auth = coalesce(nullif(auth, ''), payload #>> '{keys,auth}', keys ->> 'auth', ''),
    endpoint_hash = coalesce(nullif(endpoint_hash, ''), md5(endpoint)),
    status = coalesce(nullif(status, ''), case when is_active then 'ACTIVE' else 'EXPIRED' end),
    last_seen_at = coalesce(last_seen_at, created_at),
    updated_at = now()
where endpoint is not null;

create unique index if not exists push_subscriptions_endpoint_hash_idx
  on public.push_subscriptions(endpoint_hash)
  where endpoint_hash <> '';
create index if not exists idx_push_subscriptions_employee_active
  on public.push_subscriptions(employee_id, is_active, status);
create index if not exists idx_push_subscriptions_user_active
  on public.push_subscriptions(user_id, is_active, status);
create index if not exists idx_notifications_employee_created
  on public.notifications(employee_id, created_at desc);

alter table public.notifications enable row level security;
alter table public.push_subscriptions enable row level security;

drop policy if exists "notifications_live_location_insert_scope" on public.notifications;
create policy "notifications_live_location_insert_scope"
  on public.notifications
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    or employee_id = public.current_employee_id()
    or public.current_is_full_access()
    or public.has_any_permission(array['notifications:manage','alerts:manage','live-location:request','executive:report'])
  );

drop policy if exists "notifications_live_location_read_scope" on public.notifications;
create policy "notifications_live_location_read_scope"
  on public.notifications
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or employee_id = public.current_employee_id()
    or public.current_is_full_access()
    or public.has_any_permission(array['notifications:manage','alerts:manage','executive:report'])
  );

drop policy if exists "notifications_live_location_update_scope" on public.notifications;
create policy "notifications_live_location_update_scope"
  on public.notifications
  for update
  to authenticated
  using (
    user_id = auth.uid()
    or employee_id = public.current_employee_id()
    or public.current_is_full_access()
    or public.has_any_permission(array['notifications:manage','alerts:manage','executive:report'])
  )
  with check (
    user_id = auth.uid()
    or employee_id = public.current_employee_id()
    or public.current_is_full_access()
    or public.has_any_permission(array['notifications:manage','alerts:manage','executive:report'])
  );

drop policy if exists "push_subscriptions_runtime_scope" on public.push_subscriptions;
create policy "push_subscriptions_runtime_scope"
  on public.push_subscriptions
  for all
  to authenticated
  using (
    user_id = auth.uid()
    or employee_id = public.current_employee_id()
    or public.current_is_full_access()
    or public.has_any_permission(array['notifications:manage','alerts:manage','live-location:request','executive:report'])
  )
  with check (
    user_id = auth.uid()
    or employee_id = public.current_employee_id()
    or public.current_is_full_access()
    or public.has_any_permission(array['notifications:manage','alerts:manage','live-location:request','executive:report'])
  );

insert into public.database_migration_status (name, status, notes)
values ('077_v24_location_push_cors', 'APPLIED', 'Aligned notifications, push subscriptions, and live location request policies for v24')
on conflict (name) do update set status = excluded.status, notes = excluded.notes, applied_at = now();

commit;

-- =========================================================
-- END SECTION: 077 Location push CORS alignment
-- =========================================================


-- =========================================================
-- BEGIN SECTION: 078 Safe notification RPC + live location push execution
-- SECTION: merged v25 live-location execution fixes
-- =========================================================

-- =========================================================
-- 078 V25 Execution: safe internal notifications + push runtime hardening
-- Safe/idempotent. Run after patch 077.
-- =========================================================

begin;

alter table if exists public.notifications
  add column if not exists route text default '',
  add column if not exists data jsonb not null default '{}'::jsonb,
  add column if not exists push_sent_at timestamptz,
  add column if not exists push_status text default '',
  add column if not exists push_error text default '';

alter table if exists public.push_subscriptions
  add column if not exists employee_id uuid references public.employees(id) on delete cascade,
  add column if not exists payload jsonb not null default '{}'::jsonb,
  add column if not exists keys jsonb not null default '{}'::jsonb,
  add column if not exists p256dh text default '',
  add column if not exists auth text default '',
  add column if not exists endpoint_hash text default '',
  add column if not exists user_agent text default '',
  add column if not exists platform text default '',
  add column if not exists permission text default 'granted',
  add column if not exists is_active boolean not null default true,
  add column if not exists status text not null default 'ACTIVE',
  add column if not exists last_seen_at timestamptz,
  add column if not exists last_sent_at timestamptz,
  add column if not exists last_error text default '',
  add column if not exists updated_at timestamptz not null default now();

update public.push_subscriptions
set keys = coalesce(nullif(keys, '{}'::jsonb), payload -> 'keys', '{}'::jsonb),
    p256dh = coalesce(nullif(p256dh, ''), payload #>> '{keys,p256dh}', keys ->> 'p256dh', ''),
    auth = coalesce(nullif(auth, ''), payload #>> '{keys,auth}', keys ->> 'auth', ''),
    endpoint_hash = coalesce(nullif(endpoint_hash, ''), md5(endpoint)),
    status = coalesce(nullif(status, ''), case when is_active then 'ACTIVE' else 'EXPIRED' end),
    last_seen_at = coalesce(last_seen_at, created_at),
    updated_at = now()
where endpoint is not null;

create table if not exists public.notification_delivery_log (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid references public.notifications(id) on delete set null,
  push_subscription_id uuid references public.push_subscriptions(id) on delete set null,
  target_user_id uuid references auth.users(id) on delete set null,
  status text not null default 'PENDING',
  provider_response jsonb not null default '{}'::jsonb,
  error text default '',
  created_at timestamptz not null default now()
);

create unique index if not exists push_subscriptions_endpoint_hash_idx
  on public.push_subscriptions(endpoint_hash)
  where endpoint_hash <> '';
create index if not exists idx_push_subscriptions_employee_active
  on public.push_subscriptions(employee_id, is_active, status);
create index if not exists idx_push_subscriptions_user_active
  on public.push_subscriptions(user_id, is_active, status);
create index if not exists idx_notifications_employee_created
  on public.notifications(employee_id, created_at desc);
create index if not exists idx_notifications_user_created
  on public.notifications(user_id, created_at desc);

create or replace function public.safe_create_notification(
  p_user_id uuid default null,
  p_employee_id uuid default null,
  p_title text default 'ØªÙ†Ø¨ÙŠÙ‡',
  p_body text default '',
  p_type text default 'INFO',
  p_route text default '',
  p_data jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
  v_allowed boolean := false;
begin
  if auth.uid() is null then
    raise exception 'UNAUTHENTICATED';
  end if;

  v_allowed := coalesce(public.current_is_full_access(), false)
    or coalesce(public.has_any_permission(array['notifications:manage','alerts:manage','live-location:request','executive:report']), false)
    or (p_user_id is not null and p_user_id = auth.uid())
    or (p_employee_id is not null and p_employee_id = public.current_employee_id());

  if not v_allowed then
    raise exception 'FORBIDDEN_NOTIFICATION_CREATE';
  end if;

  insert into public.notifications(user_id, employee_id, title, body, type, status, is_read, route, data, created_at)
  values (p_user_id, p_employee_id, nullif(p_title, ''), coalesce(p_body, ''), coalesce(nullif(p_type, ''), 'INFO'), 'UNREAD', false, coalesce(p_route, ''), coalesce(p_data, '{}'::jsonb), now())
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.safe_create_notification(uuid, uuid, text, text, text, text, jsonb) to authenticated;

alter table public.notifications enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.notification_delivery_log enable row level security;

drop policy if exists "notifications_v25_read_scope" on public.notifications;
create policy "notifications_v25_read_scope"
  on public.notifications
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or employee_id = public.current_employee_id()
    or public.current_is_full_access()
    or public.has_any_permission(array['notifications:manage','alerts:manage','executive:report'])
  );

drop policy if exists "notifications_v25_update_scope" on public.notifications;
create policy "notifications_v25_update_scope"
  on public.notifications
  for update
  to authenticated
  using (
    user_id = auth.uid()
    or employee_id = public.current_employee_id()
    or public.current_is_full_access()
    or public.has_any_permission(array['notifications:manage','alerts:manage','executive:report'])
  )
  with check (
    user_id = auth.uid()
    or employee_id = public.current_employee_id()
    or public.current_is_full_access()
    or public.has_any_permission(array['notifications:manage','alerts:manage','executive:report'])
  );

drop policy if exists "notifications_v25_insert_scope" on public.notifications;
create policy "notifications_v25_insert_scope"
  on public.notifications
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    or employee_id = public.current_employee_id()
    or public.current_is_full_access()
    or public.has_any_permission(array['notifications:manage','alerts:manage','live-location:request','executive:report'])
  );

drop policy if exists "push_subscriptions_v25_scope" on public.push_subscriptions;
create policy "push_subscriptions_v25_scope"
  on public.push_subscriptions
  for all
  to authenticated
  using (
    user_id = auth.uid()
    or employee_id = public.current_employee_id()
    or public.current_is_full_access()
    or public.has_any_permission(array['notifications:manage','alerts:manage','live-location:request','executive:report'])
  )
  with check (
    user_id = auth.uid()
    or employee_id = public.current_employee_id()
    or public.current_is_full_access()
    or public.has_any_permission(array['notifications:manage','alerts:manage','live-location:request','executive:report'])
  );

drop policy if exists "notification_delivery_log_v25_admin_read" on public.notification_delivery_log;
create policy "notification_delivery_log_v25_admin_read"
  on public.notification_delivery_log
  for select
  to authenticated
  using (public.current_is_full_access() or public.has_any_permission(array['notifications:manage','alerts:manage','executive:report']));

insert into public.database_migration_status (name, status, notes)
values ('078_v25_execution_live_location_push', 'APPLIED', 'Safe notification RPC and push runtime columns aligned for v25')
on conflict (name) do update set status = excluded.status, notes = excluded.notes, applied_at = now();

commit;

-- =========================================================
-- END SECTION: 078 Safe notification RPC + live location push execution
-- =========================================================


-- =========================================================
-- BEGIN SECTION: 079 Bulk notification reliability
-- SECTION: merged v26 notification reliability fixes
-- =========================================================

-- =========================================================
-- 079 V26 Notification reliability: bulk safe notifications RPC
-- Safe/idempotent. Run after patches 077 and 078.
-- =========================================================

begin;

alter table if exists public.notifications
  add column if not exists route text default '',
  add column if not exists data jsonb not null default '{}'::jsonb,
  add column if not exists push_sent_at timestamptz,
  add column if not exists push_status text default '',
  add column if not exists push_error text default '';

create or replace function public.safe_create_notifications_bulk(
  p_rows jsonb default '[]'::jsonb
)
returns table(id uuid)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_item jsonb;
  v_id uuid;
  v_user_id uuid;
  v_employee_id uuid;
  v_allowed boolean;
  v_admin_allowed boolean;
begin
  if auth.uid() is null then
    raise exception 'UNAUTHENTICATED';
  end if;

  v_admin_allowed := coalesce(public.current_is_full_access(), false)
    or coalesce(public.has_any_permission(array[
      'notifications:manage',
      'alerts:manage',
      'live-location:request',
      'decisions:manage',
      'announcements:send',
      'team:dashboard',
      'executive:report'
    ]), false);

  for v_item in select * from jsonb_array_elements(coalesce(p_rows, '[]'::jsonb)) loop
    v_user_id := null;
    v_employee_id := null;

    begin
      if coalesce(v_item ->> 'user_id', '') <> '' then
        v_user_id := (v_item ->> 'user_id')::uuid;
      end if;
    exception when others then
      v_user_id := null;
    end;

    begin
      if coalesce(v_item ->> 'employee_id', '') <> '' then
        v_employee_id := (v_item ->> 'employee_id')::uuid;
      end if;
    exception when others then
      v_employee_id := null;
    end;

    v_allowed := v_admin_allowed
      or (v_user_id is not null and v_user_id = auth.uid())
      or (v_employee_id is not null and v_employee_id = public.current_employee_id());

    if not v_allowed then
      raise exception 'FORBIDDEN_NOTIFICATION_CREATE';
    end if;

    insert into public.notifications(
      user_id,
      employee_id,
      title,
      body,
      type,
      status,
      is_read,
      route,
      data,
      created_at
    ) values (
      v_user_id,
      v_employee_id,
      nullif(coalesce(v_item ->> 'title', 'ØªÙ†Ø¨ÙŠÙ‡'), ''),
      coalesce(v_item ->> 'body', ''),
      coalesce(nullif(v_item ->> 'type', ''), 'INFO'),
      coalesce(nullif(v_item ->> 'status', ''), 'UNREAD'),
      coalesce((v_item ->> 'is_read')::boolean, false),
      coalesce(v_item ->> 'route', ''),
      coalesce(v_item -> 'data', '{}'::jsonb),
      coalesce(nullif(v_item ->> 'created_at', '')::timestamptz, now())
    ) returning notifications.id into v_id;

    id := v_id;
    return next;
  end loop;

  return;
end;
$$;

grant execute on function public.safe_create_notifications_bulk(jsonb) to authenticated;

insert into public.database_migration_status (name, status, notes)
values ('079_v26_notification_reliability', 'APPLIED', 'Bulk safe notification RPC and client fallback alignment for v26')
on conflict (name) do update set status = excluded.status, notes = excluded.notes, applied_at = now();

commit;

-- =========================================================
-- END SECTION: 079 Bulk notification reliability
-- =========================================================


-- =========================================================
-- V27 cleanup marker
-- =========================================================
begin;
insert into public.database_migration_status (name, status, notes)
values ('080_v27_cleanup_final_sql_bundle', 'APPLIED', 'V27: unified SQL Editor bundle and production deploy cleanup')
on conflict (name) do update set status = excluded.status, notes = excluded.notes, applied_at = now();
commit;
notify pgrst, 'reload schema';


-- =========================================================
-- V28 cleanup marker
-- =========================================================
begin;
insert into public.database_migration_status (name, status, notes)
values ('081_v28_clean_single_push_function', 'APPLIED', 'V28: one SQL Editor file, one canonical push Edge Function, clean deploy scripts')
on conflict (name) do update set status = excluded.status, notes = excluded.notes, applied_at = now();
commit;
notify pgrst, 'reload schema';


-- =========================================================
-- V29 audit-safe marker: cache alignment + passkey disabled-by-default until full WebAuthn verification
-- =========================================================
insert into public.database_migration_status (patch_name, status, details)
values ('083_V31_final_verified_no_local_errors', 'APPLIED', 'V31: final local verification cleanup, translated attendance chart labels, SQL/deploy guidance cleanup')
on conflict (patch_name) do update set status = excluded.status, details = excluded.details, applied_at = now();

-- =========================================================
-- v31 production deploy ready marker
-- =========================================================
insert into public.database_migration_status (patch_name, status, details)
values ('084_v31_production_deploy_ready_keep_dev_files', 'APPLIED', 'v31-production-deploy-ready-keep-dev-files')
on conflict (patch_name) do update
  set status = excluded.status,
      details = excluded.details,
      applied_at = now();

notify pgrst, 'reload schema';
