import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Script } from 'node:vm';
const root = process.cwd();
const failures = [];
const read = (file) => readFileSync(join(root, file), 'utf8');
const assert = (condition, message) => { if (!condition) failures.push(message); };
function moduleToScript(source) {
  return source.replace(/^\s*import\s+[^;]+;\s*$/gm, '').replace(/^\s*export\s+default\s+/gm, '').replace(/^\s*export\s+(async\s+function|function|class)\s+/gm, '$1 ').replace(/^\s*export\s+(const|let|var)\s+/gm, '$1 ').replace(/^\s*export\s*\{[^}]*\};?\s*$/gm, '');
}
for (const file of ['shared/js/api.js','shared/js/app-admin.js','shared/js/employee-app.js','shared/js/executive-app.js','shared/js/supabase-api.js','shared/js/register-sw.js','sw.js']) {
  try { new Script(moduleToScript(read(file)), { filename: file }); } catch (error) { failures.push(`${file}: ${error.message}`); }
}
for (const file of ['index.html','admin-login.html','operations-gate/index.html','admin/index.html','employee/index.html','executive/index.html','tools/reset-cache.html'].filter((f) => existsSync(join(root, f)))) {
  const html = read(file);
  [...html.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].forEach((match, index) => {
    const code = match[1].trim();
    if (!code) return;
    try { new Script(code, { filename: `${file} inline script #${index + 1}` }); } catch (error) { failures.push(`${file} inline script #${index + 1}: ${error.message}`); }
  });
}
const api = read('shared/js/api.js');
const app = read('shared/js/app-admin.js');
const db = read('shared/js/database.js');
const sw = read('sw.js');
const reg = read('shared/js/register-sw.js');
const supabaseApi = read('shared/js/supabase-api.js');
assert(read('package.json').includes('1.4.0-full-workflow-live-20260504'), 'Package version must be 1.4.0-full-workflow-live-20260504.');
assert(api.includes('expectedPatch: "064_attendance_fallback_workflow.sql"'), 'Expected patch must be 043.');
for (const patch of ['037_kpi_policy_window_hr_scoring.sql','038_kpi_cycle_control_reports.sql','039_management_hr_reports_workflow.sql','040_runtime_alignment_fix.sql','041_audit_v7_security_mobile_alignment.sql','042_authorized_roster_phone_login_internal_channel.sql','064_attendance_fallback_workflow.sql']) assert(api.includes(patch) && existsSync(join(root, 'supabase/sql/patches', patch)), `${patch} must exist and be listed.`);
for (const route of ['management-structure','team-dashboard','hr-operations','dispute-workflow','report-center','presence-map','attendance-risk','admin-decisions','monthly-auto-pdf']) assert(app.includes(route), `Missing route ${route}.`);
for (const fn of ['managementStructure','assignManager','teamDashboard','hrOperations','disputeWorkflow','reportCenter','exportManagementReport','executivePresenceDashboard','attendanceRiskCenter','adminDecisions','monthlyAutoPdfReports']) assert(api.includes(`${fn}: async`), `Missing local endpoint ${fn}.`);
for (const fn of ['managementStructure','assignManager','teamDashboard','hrOperations','disputeWorkflow','reportCenter','exportManagementReport','monthlyEvaluations','runSmartAttendance','databaseMigrationsStatus','myActionCenter','executivePresenceDashboard','attendanceRiskCenter','adminDecisions','monthlyAutoPdfReports']) assert(supabaseApi.includes(`${fn}: async`), `Missing Supabase endpoint ${fn}.`);
for (const scope of ['organization:manage','team:dashboard','hr:operations','disputes:escalate','reports:pdf','reports:excel','attendance:risk','decisions:manage','reports:monthly-pdf-auto']) assert(api.includes(scope) && db.includes(scope), `Missing permission ${scope}.`);
assert(app.includes('حضور حلقة الشيخ وليد يوسف الأسبوعية') && app.includes('خاص بـ HR'), 'KPI HR-only fields must remain clear.');
assert(sw.includes('hr-attendance-full-workflow-live-20260504') && reg.includes('hr-attendance-full-workflow-live-20260504'), 'Service worker cache must be management-suite version.');
assert(read('operations-gate/index.html').includes('hr.opsGatewayUnlockedTarget'), 'Operations gate must keep scoped target unlock.');
assert(read('admin/index.html').includes("unlockedTarget === 'admin'"), 'Admin gate must require admin target.');
assert(read('executive/index.html').includes("unlockedTarget === 'executive'"), 'Executive gate must require executive target.');
if (failures.length) {
  console.error('All web checks failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log('JS syntax check passed.');
console.log('HTML inline script check passed.');
console.log('Web guard check passed.');
console.log('KPI checks passed.');
console.log('Management/HR/reports suite check passed.');
console.log('Smoke check passed.');
console.log('All web checks passed.');
process.exit(0);
