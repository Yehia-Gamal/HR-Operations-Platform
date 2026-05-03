import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const failures = [];
const read = (file) => readFileSync(join(root, file), 'utf8');
const assert = (condition, message) => { if (!condition) failures.push(message); };

assert(existsSync(join(root, 'supabase/sql/patches/033_final_web_production_hardening.sql')), 'Patch 033 must exist.');
assert(existsSync(join(root, 'supabase/sql/patches/034_final_lockdown_cleanup.sql')), 'Patch 034 must exist.');
assert(existsSync(join(root, 'supabase/sql/patches/035_final_sanitization_live_readiness.sql')), 'Patch 035 must exist.');
assert(!existsSync(join(root, 'shared/images/employees')), 'Bundled personal employee images must not be shipped.');

const config = read('shared/js/supabase-config.js');
assert(config.includes('allowLocalFallback: false'), 'Production config must disable local fallback.');
assert(config.includes('management-suite-20260502-01'), 'Production cache/config version must be updated.');
assert(!config.includes('sb_publishable_'), 'Production config template must not contain a real Supabase publishable key.');
assert(!config.includes('yemradvxmwadlldnxtpz'), 'Production config template must not contain the exposed Supabase project ref.');
const gitignore = read('.gitignore');
assert(gitignore.includes('shared/js/supabase-config.js'), 'Runtime Supabase config must be ignored.');
assert(gitignore.includes('server.*.log'), 'Server logs must be ignored.');
assert(gitignore.includes('supabase/VAPID_SECRETS_TO_SET.env'), 'VAPID secret env file must be ignored.');

const gate = read('operations-gate/index.html');
assert(!gate.includes('HR-OPS'), 'Default HR-OPS gate code must be removed.');
assert(!gate.includes('AS-HR-PROD-2026!'), 'Exposed production operations gate code must be removed.');
assert(!gate.includes('.hint code') && !gate.includes('class="hint"'), 'Operations gate must not ship hint/code disclosure styles or elements.');
assert(/const CODE = '[^']{10,}';/.test(gate), 'Operations gate must define a non-empty code; change it before deployment.');
assert(gate.includes('hr.opsGatewayUnlockedTarget'), 'Operations gate must remain scoped by target.');

for (const file of ['shared/js/app-admin.js', 'shared/js/employee-app.js', 'shared/js/executive-app.js']) {
  const text = read(file);
  assert(!/\b(prompt|confirm|alert)\s*\(/.test(text), `${file} must not use native prompt/confirm/alert dialogs.`);
  assert(!text.includes('../shared/images/employees/'), `${file} must not reference bundled employee photos.`);
}

for (const file of ['supabase/functions/admin-create-user/index.ts', 'supabase/functions/admin-update-user/index.ts']) {
  const text = read(file);
  assert(!/executive-secretary|['\"]executive['\"]/.test(text), `${file} must not grant user-management function access to executive roles.`);
  assert(text.includes("permissions.includes('users:manage')"), `${file} must allow explicit users:manage permission.`);
}

const api = read('shared/js/api.js');
assert(api.includes('033_final_web_production_hardening.sql'), 'API migration list must include Patch 033.');
assert(api.includes('034_final_lockdown_cleanup.sql'), 'API migration list must include Patch 034.');
assert(api.includes('035_final_sanitization_live_readiness.sql'), 'API migration list must include Patch 035.');
assert(api.includes('تسجيل الدخول المحلي معطّل'), 'Local fallback must be locked when Supabase is not configured.');

const sw = read('sw.js');
const reg = read('shared/js/register-sw.js');
assert(sw.includes('hr-attendance-management-suite-20260502-01'), 'Service Worker must use production hardening cache name.');
assert(reg.includes('hr-attendance-management-suite-20260502-01'), 'Service Worker registration must use production hardening cache name.');

if (failures.length) {
  console.error('Production hardening check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log('Production hardening check passed.');
