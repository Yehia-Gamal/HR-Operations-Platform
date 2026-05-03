-- =========================================================
-- 018 Ahla Shabab Organization Hierarchy
-- الهيكل الإداري حسب وصف الجمعية.
-- لا ينشئ حسابات Auth ولا كلمات مرور. الحسابات تنشأ من لوحة الإدارة/Edge Function.
-- =========================================================

create extension if not exists pgcrypto;

alter table if exists public.employees
  add column if not exists manager_employee_id uuid references public.employees(id) on delete set null;

alter table if exists public.departments
  add column if not exists manager_employee_id uuid references public.employees(id) on delete set null;

insert into public.departments (code, name, branch_id, manager_employee_id)
select d.code, d.name, b.id, null
from (values
  ('EXEC', 'الإدارة التنفيذية'),
  ('MGT', 'الإشراف والمديرون المباشرون'),
  ('OPS', 'فرق التشغيل والخدمات'),
  ('HR', 'الموارد البشرية')
) as d(code, name)
cross join public.branches b
where b.code = 'MAIN'
on conflict (code) do update set name = excluded.name, branch_id = excluded.branch_id;

with roster(employee_code, full_name, phone, email, job_title, role_slug, department_code, manager_code, hire_date) as (
  values
  ('EMP-001', 'المدير التنفيذي', '01020000001', 'executive.director@organization.local', 'المدير التنفيذي', 'executive', 'EXEC', '', '2020-01-01'),
  ('EMP-002', 'السكرتير التنفيذي', '01020000002', 'executive.secretary@organization.local', 'السكرتير التنفيذي', 'executive-secretary', 'EXEC', 'EMP-001', '2021-01-01'),
  ('EMP-003', 'مدير مباشر رابع', '01020000003', 'direct.manager.04@organization.local', 'مدير مباشر', 'manager', 'MGT', 'EMP-001', '2021-02-01'),
  ('EMP-004', 'مدير مباشر أول', '01020000004', 'direct.manager.01@organization.local', 'مدير مباشر', 'manager', 'MGT', 'EMP-001', '2021-02-01'),
  ('EMP-005', 'مدير مباشر ثانٍ', '01020000005', 'direct.manager.02@organization.local', 'مدير مباشر', 'manager', 'MGT', 'EMP-001', '2021-02-01'),
  ('EMP-006', 'مدير مباشر ثالث', '01020000006', 'direct.manager.03@organization.local', 'مدير مباشر', 'manager', 'MGT', 'EMP-001', '2021-02-01'),
  ('EMP-007', 'موظف تشغيلي 01', '01020000007', 'employee.001@organization.local', 'مدير مباشر', 'manager', 'MGT', 'EMP-001', '2021-02-01'),
  ('EMP-008', 'موظف تشغيلي 18', '01020000008', 'employee.017@organization.local', 'مدير مباشر', 'manager', 'MGT', 'EMP-001', '2021-02-01'),
  ('EMP-009', 'موظف تشغيلي 14', '01020000009', 'direct.manager.07@organization.local', 'مدير مباشر', 'manager', 'MGT', 'EMP-001', '2021-02-01'),
  ('EMP-010', 'موظف تشغيلي 07', '01020000010', 'employee.006@organization.local', 'موظف فريق مدير مباشر ثالث', 'employee', 'OPS', 'EMP-006', '2022-01-01'),
  ('EMP-011', 'موظف تشغيلي 08', '01020000011', 'employee.007@organization.local', 'موظف فريق مدير مباشر ثالث', 'employee', 'OPS', 'EMP-006', '2022-01-01'),
  ('EMP-012', 'موظف تشغيلي 04', '01020000012', 'direct.manager.08@organization.local', 'مشرف مباشر', 'manager', 'MGT', 'EMP-006', '2022-01-01'),
  ('EMP-013', 'موظف تشغيلي 05', '01020000013', 'employee.004@organization.local', 'موظف تحت إشراف مباشر', 'employee', 'OPS', 'EMP-012', '2022-01-01'),
  ('EMP-014', 'موظف تشغيلي 13', '01020000014', 'abdullah.hussein@ahla-shabab.local', 'موظف فريق مدير مباشر رابع', 'employee', 'OPS', 'EMP-003', '2022-01-01'),
  ('EMP-015', 'موظف تشغيلي 06', '01020000015', 'employee.005@organization.local', 'موظف فريق مدير مباشر رابع', 'employee', 'OPS', 'EMP-003', '2022-01-01'),
  ('EMP-016', 'موظف تشغيلي 16', '01020000016', 'employee.015@organization.local', 'موظف فريق المدير المباشر السابع', 'employee', 'OPS', 'EMP-009', '2022-01-01'),
  ('EMP-017', 'موظف تشغيلي 10', '01020000017', 'employee.009@organization.local', 'موظف فريق المدير المباشر السابع', 'employee', 'OPS', 'EMP-009', '2022-01-01'),
  ('EMP-018', 'موظف تشغيلي 15', '01020000018', 'employee.014@organization.local', 'موظف فريق المدير المباشر السابع', 'employee', 'OPS', 'EMP-009', '2022-01-01'),
  ('EMP-019', 'موظف تشغيلي 17', '01020000019', 'employee.016@organization.local', 'موظف فريق المدير المباشر الأول', 'employee', 'OPS', 'EMP-004', '2022-01-01'),
  ('EMP-020', 'موظف تشغيلي 11', '01020000020', 'employee.010@organization.local', 'موظف فريق موظف تشغيلي 18', 'employee', 'OPS', 'EMP-008', '2022-01-01'),
  ('EMP-021', 'موظف تشغيلي 12', '01020000021', 'employee.011@organization.local', 'موظف فريق موظف تشغيلي 18', 'employee', 'OPS', 'EMP-008', '2022-01-01'),
  ('EMP-022', 'موظف تشغيلي 03', '01020000022', 'employee.002@organization.local', 'موظف فريق موظف تشغيلي 18', 'employee', 'OPS', 'EMP-008', '2022-01-01'),
  ('EMP-023', 'موظف تشغيلي 09', '01020000023', 'tarek.ibrahim@ahla-shabab.local', 'موظف فريق موظف تشغيلي 18', 'employee', 'OPS', 'EMP-008', '2022-01-01')
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

comment on function public.can_access_employee(uuid) is 'يعطي المدير صلاحية قراءة فريقه الكامل عبر كل المستويات الإدارية.';
