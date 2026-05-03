import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const failures = [];
const read = (file) => readFileSync(join(root, file), 'utf8');
const assert = (condition, message) => { if (!condition) failures.push(message); };
const patchDir = join(root, 'supabase/sql/patches');
const patches = readdirSync(patchDir).filter((name) => /^\d{3}_.+\.sql$/.test(name)).sort();
const allSql = [read('supabase/sql/001_schema_rls_seed.sql'), ...patches.map((name) => read(`supabase/sql/patches/${name}`))].join('\n');

assert(patches.includes('040_runtime_alignment_fix.sql'), 'Patch 040_runtime_alignment_fix.sql is required.');
assert(patches.includes('041_audit_v7_security_mobile_alignment.sql'), 'Patch 041_audit_v7_security_mobile_alignment.sql is required.');
assert(patches.includes('043_executive_presence_risk_decisions_reports.sql'), 'Patch 043_executive_presence_risk_decisions_reports.sql is required.');
assert(existsSync(join(root, 'supabase/migrations/20260502074005_040_runtime_alignment_fix.sql')), 'Migration 040 mirror is required.');
assert(existsSync(join(root, 'supabase/migrations/20260502074006_041_audit_v7_security_mobile_alignment.sql')), 'Migration 041 mirror is required.');
assert(existsSync(join(root, 'supabase/migrations/20260502074008_043_executive_presence_risk_decisions_reports.sql')), 'Migration 043 mirror is required.');
assert(read('supabase/sql/patches/035_final_sanitization_live_readiness.sql').includes("to_regclass('public.role_permissions')"), 'Patch 035 must guard legacy role_permissions.');
assert(read('supabase/sql/patches/035_final_sanitization_live_readiness.sql').includes('join public.roles r on r.id = p.role_id'), 'Patch 035 policies must use profiles.role_id + roles.slug.');
assert(read('supabase/sql/patches/040_runtime_alignment_fix.sql').includes('create table if not exists public.system_settings'), 'Patch 040 must create system_settings.');
assert(read('supabase/sql/patches/040_runtime_alignment_fix.sql').includes('add column if not exists keys jsonb'), 'Patch 040 must upgrade push_subscriptions keys.');
assert(read('supabase/sql/patches/040_runtime_alignment_fix.sql').includes('database_migration_status'), 'Patch 040 must align migration status table.');
assert(!/p\.role\s+in\s*\(/.test(allSql), 'SQL must not reference non-existent profiles.role.');
assert(!/id\s*=\s*'role-[^']+'/.test(allSql), 'SQL must not compare uuid role ids with role-* string ids.');
assert(!read('run-patches.mjs').includes('postgresql://postgres:'), 'run-patches.mjs must not contain hardcoded database credentials.');
assert(!read('tools/apply-supabase-sql.mjs').includes("from 'postgres'"), 'apply-supabase-sql.mjs must use installed pg dependency, not missing postgres package.');
assert(read('shared/js/supabase-api.js').includes('send-push-notification'), 'Supabase runtime must invoke send-push-notification for real push dispatch.');

if (failures.length) {
  console.error('SQL/runtime alignment check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log('SQL/runtime alignment check passed.');

assert(read('supabase/sql/patches/041_audit_v7_security_mobile_alignment.sql').includes('current_can_view_password_vault'), 'Patch 041 must define role-based password vault guard.');
assert(read('supabase/sql/patches/041_audit_v7_security_mobile_alignment.sql').includes('encrypted_temporary_password'), 'Patch 041 must encrypt legacy credential vault fields.');

assert(read('supabase/sql/patches/043_executive_presence_risk_decisions_reports.sql').includes('current_can_see_employee'), 'Patch 043 must define manager-team visibility guard.');
assert(read('supabase/sql/patches/043_executive_presence_risk_decisions_reports.sql').includes('admin_decision_acknowledgements'), 'Patch 043 must add decision acknowledgement table.');
