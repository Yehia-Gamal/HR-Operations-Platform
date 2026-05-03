import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const failures = [];
const read = (file) => readFileSync(join(root, file), 'utf8');
const assert = (condition, message) => { if (!condition) failures.push(message); };

assert(existsSync(join(root, 'supabase/sql/patches/036_role_kpi_workflow_access.sql')), 'Patch 036 must exist.');
const api = read('shared/js/api.js');
const employee = read('shared/js/employee-app.js');
const admin = read('shared/js/app-admin.js');
const db = read('shared/js/database.js');
const patch = read('supabase/sql/patches/036_role_kpi_workflow_access.sql');
const supabaseApi = read('shared/js/supabase-api.js');

assert(api.includes('employeeRegister'), 'API must expose employee self-registration.');
assert(supabaseApi.includes('employee-register') && supabaseApi.includes('functions.invoke'), 'Supabase API must call employee-register function for live self-registration.');
assert(existsSync(join(root, 'supabase/functions/employee-register/index.ts')), 'Employee registration Edge Function must exist.');
assert(api.includes('SELF_SUBMITTED') && api.includes('MANAGER_APPROVED') && api.includes('HR_REVIEWED') && api.includes('SECRETARY_REVIEWED') && api.includes('EXECUTIVE_APPROVED'), 'API must include KPI approval stages.');
assert(api.includes('"hr-manager": [') && !api.includes('"hr-manager": ["*"]'), 'HR manager must not be a full-access role.');
assert(api.includes('"executive-secretary": ["*"]'), 'Executive secretary/technical role must have full access.');
assert(employee.includes('data-register-mode') && employee.includes('endpoints.employeeRegister'), 'Employee app must show registration and call employeeRegister.');
assert(employee.includes('["kpi", "تقييمي"') && employee.includes('renderKpi'), 'Employee app must include KPI self-evaluation page.');
assert(admin.includes('role-executive-secretary') && !admin.includes('"hr-manager",\n  "role-hr"'), 'Admin full-access set must not treat HR as full technical access.');
assert(db.includes('emp-hr-manager') && db.includes('مدير الموارد البشرية'), 'Seed data must include HR manager role/person for workflow testing.');
assert(patch.includes('employee_self_registration_log') && patch.includes('kpi:hr') && patch.includes('executive-secretary'), 'Patch 036 must include registration, KPI HR, and secretary permissions.');
assert(api.includes('expectedPatch: "043_executive_presence_risk_decisions_reports.sql"'), 'Expected database patch must be 043.');

if (failures.length) {
  console.error('Role/KPI workflow check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log('Role/KPI workflow check passed.');
