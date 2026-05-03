-- =========================================================
<<<<<<< HEAD
-- 029 Employee Photos
-- Links local static employee images to Supabase employee/profile rows.
-- Images live under /shared/images/employees/.
-- =========================================================

with photo_map(employee_code, photo_url) as (
  values
    ('EMP-001', '/shared/images/employees/demo-employee-001.png'),
    ('EMP-002', '/shared/images/employees/demo-employee-002.png'),
    ('EMP-003', '/shared/images/employees/demo-employee-003.png'),
    ('EMP-004', '/shared/images/employees/demo-employee-004.png'),
    ('EMP-005', '/shared/images/employees/demo-employee-005.png'),
    ('EMP-006', '/shared/images/employees/demo-employee-006.png'),
    ('EMP-007', '/shared/images/employees/demo-employee-007.png'),
    ('EMP-008', '/shared/images/employees/demo-employee-008.png'),
    ('EMP-010', '/shared/images/employees/demo-employee-009.png'),
    ('EMP-011', '/shared/images/employees/demo-employee-010.png'),
    ('EMP-012', '/shared/images/employees/demo-employee-011.png'),
    ('EMP-013', '/shared/images/employees/demo-employee-012.png'),
    ('EMP-014', '/shared/images/employees/demo-employee-013.png'),
    ('EMP-015', '/shared/images/employees/demo-employee-014.png'),
    ('EMP-016', '/shared/images/employees/demo-employee-015.png'),
    ('EMP-020', '/shared/images/employees/demo-employee-016.png'),
    ('EMP-022', '/shared/images/employees/demo-employee-017.png'),
    ('EMP-023', '/shared/images/employees/demo-employee-018.png'),

    -- Active imported demo duplicates.
    ('EMP-7284C925', '/shared/images/employees/demo-employee-006.png'),
    ('EMP-2A860C8B', '/shared/images/employees/demo-employee-009.png'),
    ('EMP-2650657E', '/shared/images/employees/demo-employee-010.png'),
    ('EMP-E90B5576', '/shared/images/employees/demo-employee-011.png'),
    ('EMP-E73B707B', '/shared/images/employees/demo-employee-012.png'),
    ('EMP-293B7D54', '/shared/images/employees/demo-employee-015.png'),
    ('EMP-2CBD5C45', '/shared/images/employees/demo-employee-008.png')
)
update public.employees e
set photo_url = m.photo_url,
    updated_at = now()
from photo_map m
where e.employee_code = m.employee_code;

update public.profiles p
set avatar_url = e.photo_url,
    updated_at = now()
from public.employees e
where p.employee_id = e.id
  and nullif(e.photo_url, '') is not null;

-- Kept as static assets only because no active employee rows currently match them:
-- /shared/images/employees/demo-employee-019.png
-- /shared/images/employees/demo-employee-020.png
=======
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
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
