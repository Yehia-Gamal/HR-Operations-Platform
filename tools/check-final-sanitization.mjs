import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const failures = [];
const read = (file) => readFileSync(join(root, file), 'utf8');
const assert = (condition, message) => { if (!condition) failures.push(message); };

assert(existsSync(join(root, 'supabase/sql/patches/035_final_sanitization_live_readiness.sql')), 'Patch 035 must exist.');
assert(existsSync(join(root, 'shared/js/push.js')), 'Web Push helper must exist.');
assert(existsSync(join(root, 'supabase/functions/send-push-notification/index.ts')), 'Send push notification Edge Function must exist.');
assert(existsSync(join(root, 'shared/js/supabase-config.production.example.js')), 'Production config example must exist.');
assert(existsSync(join(root, 'shared/js/supabase-config.development.example.js')), 'Development config example must exist.');

const config = read('shared/js/supabase-config.js');
assert(config.includes('allowLocalFallback: false'), 'Production config must use allowLocalFallback: false.');
assert(config.includes('vapidPublicKey'), 'Production config must expose public VAPID key field for Web Push.');
assert(!config.includes('allowLocalDemo'), 'Production config must not use allowLocalDemo.');

const admin = read('shared/js/app-admin.js');
assert(!admin.includes('renderDemoMode'), 'Admin production bundle must not include renderDemoMode.');
assert(!admin.includes('demo-mode'), 'Admin production bundle must not include demo-mode route.');
assert(admin.includes('enableWebPushSubscription'), 'Admin notifications must use real Web Push subscription helper.');

const employee = read('shared/js/employee-app.js');
assert(employee.includes('data-enable-push'), 'Employee app must expose mobile push activation.');
assert(employee.includes('enableWebPushSubscription'), 'Employee app must use real Web Push helper.');

const api = read('shared/js/api.js');
assert(!api.includes('demo:manage'), 'Local API seed must not expose demo:manage permission.');
assert(api.includes('035_final_sanitization_live_readiness.sql'), 'API migration list must include Patch 035.');
assert(api.includes('expectedPatch: "064_attendance_fallback_workflow.sql"'), 'Expected patch must be 043.');

const forbiddenNames = /(أبو عمار|بلال|ياسر|يحيى|يحيي|جمال السبع|يوسف رسمي|حامد محمود|هبة مصطفى|yahia|yehia|bilal|yasser|mostafa|hossam|ismail|ammar|hany|hatem|abdelrahman)/i;
const officialRosterEnabled = read('package.json').includes('1.4.0-full-workflow-live-20260504') && read('shared/js/database.js').includes('rosterSource');
for (const file of ['shared/js/database.js', 'shared/js/app-admin.js', 'shared/js/employee-app.js', 'docs/ORGANIZATION_HIERARCHY.md', 'README.md', 'docs/FINAL_DEPLOY_NOW.md', 'docs/PRODUCTION_CHECKLIST.md']) {
  if (officialRosterEnabled && file === 'shared/js/database.js') continue;
  assert(!forbiddenNames.test(read(file)), `${file} still contains personal/demo names.`);
}

const patch035 = read('supabase/sql/patches/035_final_sanitization_live_readiness.sql');
assert(patch035.includes('push_subscriptions'), 'Patch 035 must create push_subscriptions table.');
assert(read('supabase/config.toml').includes('[functions.send-push-notification]'), 'Supabase config must include send-push-notification function.');
assert(patch035.includes("delete from public.permissions where scope = 'demo:manage'"), 'Patch 035 must remove demo:manage permission.');

if (failures.length) {
  console.error('Final sanitization check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log('Final sanitization check passed.');
process.exit(0);
