import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const required = [
  'index.html',
  'admin-login.html',
  'admin/index.html',
  'employee/index.html',
  'executive/index.html',
  'shared/js/api.js',
  'shared/js/app-admin.js',
  'shared/js/employee-app.js',
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
];

const failures = [];
for (const file of required) if (!existsSync(join(root, file))) failures.push(`Missing required file: ${file}`);

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
}

if (failures.length) {
  console.error('Smoke check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log('Smoke check passed: required files and packaging safety checks are OK.');
process.exit(0);
