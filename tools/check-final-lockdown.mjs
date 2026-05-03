import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const failures = [];
const read = (file) => readFileSync(join(root, file), 'utf8');
const assert = (condition, message) => { if (!condition) failures.push(message); };

assert(read('package.json').includes('1.3.4-executive-presence-risk-decisions-pdf'), 'package version must be 1.3.4-executive-presence-risk-decisions-pdf.');
assert(existsSync(join(root, 'supabase/sql/patches/034_final_lockdown_cleanup.sql')), 'Patch 034 must exist.');
assert(existsSync(join(root, 'supabase/sql/patches/035_final_sanitization_live_readiness.sql')), 'Patch 035 must exist.');
assert(read('shared/js/supabase-config.js').includes('management-suite-20260502-01'), 'Supabase config cache version must be final lockdown.');
assert(read('sw.js').includes('hr-attendance-management-suite-20260502-01'), 'Service Worker cache must be final lockdown.');
assert(read('shared/js/register-sw.js').includes('hr-attendance-management-suite-20260502-01'), 'Service Worker registration cache must match final lockdown.');
assert(read('shared/js/api.js').includes('034_final_lockdown_cleanup.sql'), 'API migration list must include Patch 034.');
assert(read('shared/js/api.js').includes('035_final_sanitization_live_readiness.sql'), 'API migration list must include Patch 035.');
assert(read('shared/js/api.js').includes('expectedPatch: "043_executive_presence_risk_decisions_reports.sql"'), 'Expected patch must be 043.');
assert(!read('shared/js/app-admin.js').includes('["demo-mode", "وضع التدريب"]'), 'Demo mode must not appear in admin nav.');
assert(!read('shared/js/app-admin.js').includes('localStorage.getItem("hr.demoMode") === "true"'), 'Admin shell must not show demo banner in production.');
assert(!read('shared/js/employee-app.js').includes('localStorage.getItem("hr.demoMode") === "true"'), 'Employee shell must not show demo banner in production.');
assert(read('docs/FINAL_DEPLOY_NOW.md').includes('040_runtime_alignment_fix.sql'), 'Final deploy doc must reference Patch 040.');
assert(read('docs/FINAL_DEPLOY_NOW.md').includes('041_audit_v7_security_mobile_alignment.sql'), 'Final deploy doc must reference Patch 041.');
assert(read('docs/FINAL_ACCEPTANCE_TEST.md').includes('المدير التنفيذي'), 'Final acceptance test doc must exist and include role tests.');

for (const file of ['shared/js/app-admin.js', 'shared/js/employee-app.js', 'shared/js/executive-app.js']) {
  const text = read(file);
  assert(!/\b(prompt|confirm|alert)\s*\(/.test(text), `${file} must not use native dialogs.`);
  assert(!text.includes('../shared/images/employees/'), `${file} must not reference bundled employee photos.`);
}

if (failures.length) {
  console.error('Final lockdown check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log('Final lockdown check passed.');

process.exit(0);
