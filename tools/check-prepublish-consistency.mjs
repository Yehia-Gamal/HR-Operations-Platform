import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const failures = [];
const read = (file) => readFileSync(join(root, file), 'utf8');
const assert = (condition, message) => { if (!condition) failures.push(message); };

const patch032 = 'supabase/sql/patches/032_pre_publish_role_portal_consistency.sql';
const patch033 = 'supabase/sql/patches/033_final_web_production_hardening.sql';
const patch034 = 'supabase/sql/patches/034_final_lockdown_cleanup.sql';
const patch035 = 'supabase/sql/patches/035_final_sanitization_live_readiness.sql';
assert(existsSync(join(root, patch032)), 'Missing Patch 032 pre-publish role/portal consistency SQL.');
assert(existsSync(join(root, patch033)), 'Missing Patch 033 final production hardening SQL.');
assert(existsSync(join(root, patch034)), 'Missing Patch 034 final lockdown cleanup SQL.');
assert(existsSync(join(root, patch035)), 'Missing Patch 035 final sanitization/live readiness SQL.');

const seed = read('supabase/sql/001_schema_rls_seed.sql');
assert(!/\('executive','EXECUTIVE','المدير التنفيذي',\s*array\['\*'\]\)/.test(seed), 'Base SQL seed must not give executive role * permissions.');
assert(!/\('executive-secretary','EXECUTIVE_SECRETARY','السكرتير التنفيذي',\s*array\['\*'\]\)/.test(seed), 'Base SQL seed must not give executive-secretary role * permissions.');
assert(seed.includes("('executive:mobile','المتابعة التنفيذية المختصرة')"), 'Base SQL seed must include executive portal permissions.');

const api = read('shared/js/api.js');
assert(api.includes('031_web_guard_mobile_polish.sql'), 'Database updates list must keep Patch 031.');
assert(api.includes('032_pre_publish_role_portal_consistency.sql'), 'Database updates list must include Patch 032.');
assert(api.includes('033_final_web_production_hardening.sql'), 'Database updates list must include Patch 033.');
assert(api.includes('034_final_lockdown_cleanup.sql'), 'Database updates list must include Patch 034.');
assert(api.includes('035_final_sanitization_live_readiness.sql'), 'Database updates list must include Patch 035.');
assert(api.includes('expectedPatch: "043_executive_presence_risk_decisions_reports.sql"'), 'Expected patch must be 043.');

const admin = read('shared/js/app-admin.js');
const technicalAdmin = admin.match(/function isTechnicalAdmin[\s\S]*?\n}\r?\n/)?.[0] || '';
assert(!/email/.test(technicalAdmin), 'Technical admin detection must not depend on email text.');
assert(!/normalized\.includes\("admin"\)/.test(technicalAdmin), 'Technical admin detection must not use broad text includes("admin").');

const employee = read('shared/js/employee-app.js');
const fullAccessLine = employee.match(/const fullAccessRoles = new Set\(\[[^\n]+\]\);/)?.[0] || '';
assert(!/("executive"|"role-executive"|المدير التنفيذي)/.test(fullAccessLine), 'Employee portal fullAccessRoles must not include executive-director-only roles.');
assert(employee.includes('const executiveOnlyRoles'), 'Employee portal must explicitly recognize executive-only roles.');
assert(employee.includes('if (executiveOnlyRoles.has(role)) return false;'), 'Employee portal admin-like check must reject executive-only roles.');

const sw = read('sw.js');
const reg = read('shared/js/register-sw.js');
assert(sw.includes('hr-attendance-management-suite-20260502-01'), 'Service Worker cache version must be updated.');
assert(reg.includes('hr-attendance-management-suite-20260502-01'), 'Register SW cache name must match service worker.');
assert(read('package.json').includes('check:prepublish'), 'package.json must expose check:prepublish.');

if (failures.length) {
  console.error('Pre-publish consistency check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log('Pre-publish consistency check passed: roles, patches, guards, and cache versions are aligned.');
process.exit(0);
