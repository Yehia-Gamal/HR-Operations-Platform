<<<<<<< HEAD
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
=======
import { existsSync, readFileSync } from 'node:fs';
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
import { join } from 'node:path';

const root = process.cwd();
const required = [
  'index.html',
  'admin-login.html',
<<<<<<< HEAD
  'operations-gate/index.html',
=======
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
  'admin/index.html',
  'employee/index.html',
  'executive/index.html',
  'shared/js/api.js',
  'shared/js/app-admin.js',
  'shared/js/employee-app.js',
<<<<<<< HEAD
  'shared/js/supabase-api.js',
  'shared/js/supabase-config.js',
  'shared/js/supabase-config.production.example.js',
  'shared/css/styles.css',
  'shared/css/employee.css',
  'supabase/sql/001_schema_rls_seed.sql',
  'supabase/sql/patches/025_smart_attendance_executive_archive_backup.sql',
  'supabase/sql/patches/026_missing_functions_fix.sql',
  'supabase/sql/patches/027_fix_executive_hierarchy_accounts.sql',
  'supabase/sql/patches/028_primary_admin_and_runtime_fixes.sql',
  'supabase/sql/patches/029_employee_photos.sql',
  'supabase/sql/patches/030_update_employee_roster_from_excel.sql',
  'supabase/sql/patches/031_supabase_password_vault.sql',
  'supabase/sql/patches/033_limit_password_vault_to_yahia.sql',
=======
  'shared/js/executive-app.js',
  'shared/js/supabase-api.js',
  'shared/js/push.js',
  'shared/js/supabase-config.js',
  'shared/css/styles.css',
  'shared/css/employee.css',
  'supabase/sql/001_schema_rls_seed.sql',
  'supabase/functions/send-push-notification/index.ts',
  'supabase/functions/employee-register/index.ts',
  'supabase/sql/patches/020_full_operations_pack.sql',
  'supabase/sql/patches/021_quality_workflow_policy_center.sql',
  'supabase/sql/patches/022_control_room_data_center_daily_reports.sql',
  'supabase/sql/patches/030_executive_role_separation_ui_polish.sql',
  'supabase/sql/patches/031_web_guard_mobile_polish.sql',
  'supabase/sql/patches/032_pre_publish_role_portal_consistency.sql',
  'supabase/sql/patches/033_final_web_production_hardening.sql',
  'supabase/sql/patches/034_final_lockdown_cleanup.sql',
  'supabase/sql/patches/035_final_sanitization_live_readiness.sql',
  'supabase/sql/patches/036_role_kpi_workflow_access.sql',
  'supabase/sql/patches/037_kpi_policy_window_hr_scoring.sql',
  'supabase/sql/patches/039_management_hr_reports_workflow.sql',
  'supabase/sql/patches/040_runtime_alignment_fix.sql',
  'tools/check-prepublish-consistency.mjs',
  'tools/check-final-lockdown.mjs',
  'tools/check-final-sanitization.mjs',
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
];

const failures = [];
for (const file of required) if (!existsSync(join(root, file))) failures.push(`Missing required file: ${file}`);

<<<<<<< HEAD
const sensitiveNames = ['.git', '.temp'];
const allowedDevelopmentRootNames = new Set(['.git']);
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const rel = path.slice(root.length + 1);
    const isAllowedDevelopmentRoot = dir === root && allowedDevelopmentRootNames.has(name);
    if (sensitiveNames.includes(name) && !isAllowedDevelopmentRoot) failures.push(`Sensitive folder/file must not be shipped: ${rel}`);
    if (statSync(path).isDirectory() && !sensitiveNames.includes(name)) walk(path);
  }
}
walk(root);

const index = readFileSync(join(root, 'index.html'), 'utf8');
if (/href=["']\.\/admin\/|href=["']\.\/executive\//i.test(index)) failures.push('Public index.html must not expose admin or executive links.');

const gate = readFileSync(join(root, 'operations-gate/index.html'), 'utf8');
if (/http-equiv=["']refresh/i.test(gate) || !/HR_ADMIN_GATE_PASSED/.test(gate)) failures.push('operations-gate must be a real gate, not a direct redirect.');

const cfg = readFileSync(join(root, 'shared/js/supabase-config.js'), 'utf8');
if (!/enabled:\s*true/.test(cfg)) failures.push('Production supabase-config.js must enable Supabase.');
if (!/strict:\s*true/.test(cfg)) failures.push('Production supabase-config.js must keep strict=true.');
if (!/allowLocalDemo:\s*false/.test(cfg)) failures.push('Production supabase-config.js must not allow local demo fallback.');
if (!/https:\/\/yemradvxmwadlldnxtpz\.supabase\.co/.test(cfg)) failures.push('Production Supabase URL is not configured.');
if (!/sb_publishable_zd51Cc4KSDbUzrQ53maaOw_NbjHC__T/.test(cfg)) failures.push('Production publishable key is not configured.');
const patchNames = readdirSync(join(root, 'supabase/sql/patches')).filter((name) => /^\d+_.+\.sql$/.test(name)).sort();
const latestPatch = patchNames.at(-1);
const expectedPatch = cfg.match(/expectedPatch:\s*"([^"]+)"/)?.[1] || '';
if (expectedPatch !== latestPatch) failures.push(`Supabase config expectedPatch must match latest patch (${latestPatch}), found: ${expectedPatch || 'missing'}.`);
if (/accessCode:\s*"HR-OPS"/.test(cfg)) failures.push('Default admin gateway code HR-OPS must not be shipped.');

const api = readFileSync(join(root, 'shared/js/api.js'), 'utf8');
if (!latestPatch || !api.includes(latestPatch)) failures.push(`Database update center must reference latest patch ${latestPatch}.`);

const patch028 = readFileSync(join(root, 'supabase/sql/patches/028_primary_admin_and_runtime_fixes.sql'), 'utf8');
if (!/Refusing to run patch 028/.test(patch028)) failures.push('Patch 028 must refuse to run with placeholder password.');

const productionSurface = [
  'shared/js/database.js',
  'shared/js/api.js',
  'shared/js/app-admin.js',
  'shared/js/employee-app.js',
  'shared/js/supabase-api.js',
  'shared/js/supabase-config.js',
  'supabase/sql/001_schema_rls_seed.sql',
  ...patchNames.map((name) => `supabase/sql/patches/${name}`),
];

if (!existsSync(join(root, 'supabase/functions/send-push-notifications/index.ts'))) failures.push('Missing send-push-notifications Edge Function.');
if (!existsSync(join(root, 'supabase/sql/patches/034_server_runtime_push_endpoint_completion.sql'))) failures.push('Missing patch 034 server runtime completion.');

const forbiddenLiterals = [
  'Demo@2026!',
  'HR-OPS',
  '010040455849',
  '01154869616',
  '01092701744',
  '01028403239',
  '01008214530',
  '01099505229',
  '01015398047',
  '01096842589',
  '01008083891',
  '01033447012',
  '01024962522',
  '01012141949',
  '01000719835',
  '01093976980',
  '01004466039',
  '010023827201',
  'yahia.elspaa@gmail.com',
  'yehia.gamal.idh@gmail.com',
  'yahia.secretary@ahla.local',
  'yahia.gamal@ahla-shabab.local',
  'emp-mohamed-youssef',
  'emp-yahia',
  'emp-bilal',
  'emp-yasser-fathy',
  'emp-mostafa',
  'emp-abdel',
  'emp-hany',
  'emp-hamed',
  'emp-tarek',
  'emp-ismail',
  'mohamed-youssef.png',
  'yahia-gamal.png',
  'ahmed-mahgoub.png',
  'bilal-elshaker.png',
];

for (const file of productionSurface) {
  const text = readFileSync(join(root, file), 'utf8');
  for (const literal of forbiddenLiterals) {
    if (text.includes(literal)) failures.push(`Forbidden production/demo sensitive literal found in ${file}: ${literal}`);
  }
}

const employeeImageNames = readdirSync(join(root, 'shared/images/employees')).filter((name) => name.endsWith('.png'));
for (const name of employeeImageNames) {
  if (!/^demo-employee-\d{3}\.png$/.test(name)) failures.push(`Employee demo image filename must be anonymized: ${name}`);
=======
const forbidden = ['.temp', 'tmp', 'node_modules/.cache', 'supabase/.temp'];
for (const rel of forbidden) if (existsSync(join(root, rel))) failures.push(`Sensitive folder/file must not be shipped: ${rel}`);

const contentChecks = [
  ['shared/js/supabase-config.js', /strict:\s*true/, 'supabase-config.js must ship strict by default'],
  ['shared/js/supabase-config.js', /url:\s*"https:\/\/[^"]+\.supabase\.co"[\s\S]*anonKey:\s*"[^"]*"/, 'supabase-config.js must include safe Supabase URL/anonKey placeholders; fill real values before deployment'],
  ['supabase/sql/patches/016_import_employee_roster_from_excel.sql', /NO REAL EMPLOYEE DATA|template|placeholder/i, 'Import patch must not contain real employee roster data'],
  ['supabase/sql/patches/021_quality_workflow_policy_center.sql', /employee_policies/i, 'Patch 021 must define policy center tables'],
  ['supabase/sql/patches/022_control_room_data_center_daily_reports.sql', /daily_reports/i, 'Patch 022 must define daily reports tables'],
];

for (const [file, pattern, message] of contentChecks) {
  const full = join(root, file);
  if (existsSync(full) && !pattern.test(readFileSync(full, 'utf8'))) failures.push(message);
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
}

if (failures.length) {
  console.error('Smoke check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
<<<<<<< HEAD
console.log('Smoke check passed: final deployment packaging checks are OK.');
=======
console.log('Smoke check passed: required files and packaging safety checks are OK.');
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
process.exit(0);
