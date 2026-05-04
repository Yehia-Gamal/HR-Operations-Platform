import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const failures = [];
const read = (file) => readFileSync(join(root, file), 'utf8');
const has = (file) => existsSync(join(root, file));
const assert = (condition, message) => { if (!condition) failures.push(message); };

// User notes implementation files
for (const file of [
  'shared/js/employee-app.js',
  'shared/js/supabase-api.js',
  'shared/js/api.js',
  'shared/css/neon-admin-theme.css',
  'supabase/sql/PRODUCTION_SQL_EDITOR_PATCHES_051_TO_064_ALL.sql',
  'supabase/sql/PRODUCTION_SQL_EDITOR_PATCHES_057_TO_060.sql',
  'supabase/sql/PRODUCTION_SQL_EDITOR_PATCHES_061_TO_064_FINAL_QA.sql'
]) assert(has(file), `${file} must exist.`);

for (let n = 51; n <= 64; n += 1) {
  const files = readdirSync(join(root, 'supabase/sql/patches')).filter((f) => f.startsWith(String(n).padStart(3, '0')) && f.endsWith('.sql'));
  assert(files.length >= 1, `Patch ${String(n).padStart(3, '0')} must exist.`);
  assert(files.length === 1, `Patch number ${String(n).padStart(3, '0')} must not be duplicated; found: ${files.join(', ')}`);
}

const employee = read('shared/js/employee-app.js');
for (const token of [
  'مجمع أحلى شباب',
  'منيل شيحة - الجيزة',
  'addressLabel',
  'employeeNote',
  'inside_branch',
  'outside_branch',
  'ensureAttendancePolicyAcknowledged',
  'toast',
  'فريقي',
  'pending_manager_review',
  'pending_manager_review',
  'kpi',
  'dispute'
]) assert(employee.includes(token), `employee-app.js must include ${token}.`);

const supabaseApi = read('shared/js/supabase-api.js');
for (const token of [
  'submitLeaveRequest',
  'submitMissionRequest',
  'submitDisputeCase',
  'acknowledgeAttendanceIdentityPolicy',
  'workflow_status',
  'pending_hr_review',
  'attendance_identity_checks'
]) assert(supabaseApi.includes(token), `supabase-api.js must include ${token}.`);

for (const [file, tokens] of Object.entries({
  'supabase/sql/patches/057_employee_requests_two_stage_workflow.sql': ['pending_manager_review', 'pending_hr_review', 'direct_manager_id'],
  'supabase/sql/patches/058_kpi_advanced_workflow_percentages.sql': ['kpi_cycles', 'employee_opened_at', 'manager_deadline_at', 'percentage'],
  'supabase/sql/patches/059_dispute_committee_privacy_workflow.sql': ['dispute_committee_minutes', 'escalated_to_secretary_at', 'repeated_with_same_person'],
  'supabase/sql/patches/060_location_readable_labels_and_policy_ack.sql': ['address_label', 'location_status', 'employee_note'],
  'supabase/sql/patches/061_trusted_device_policy_enforcement.sql': ['attendance_device_policy', 'max_trusted_devices'],
  'supabase/sql/patches/062_branch_qr_station_rotation.sql': ['branch_qr_station_settings', 'rotate_seconds'],
  'supabase/sql/patches/063_attendance_fraud_ops_snapshot.sql': ['attendance_device_abuse_summary', 'distinct_employees'],
  'supabase/sql/patches/064_attendance_fallback_workflow.sql': ['attendance_fallback_requests', 'PENDING']
})) {
  const body = read(file);
  for (const token of tokens) assert(body.includes(token), `${file} must include ${token}.`);
}

const allSql = read('supabase/sql/PRODUCTION_SQL_EDITOR_PATCHES_051_TO_064_ALL.sql');
for (let n = 51; n <= 64; n += 1) assert(allSql.includes(`patches/${String(n).padStart(3, '0')}`), `All SQL bundle must include patch ${n}.`);

// Basic leakage and conflict marker checks
const allTextFiles = [];
function walk(dir) {
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, name.name);
    if (name.isDirectory()) {
      if (['node_modules', '.git', 'PRIVATE_SECRETS'].includes(name.name)) continue;
      walk(path);
    } else if (/\.(js|mjs|html|css|json|md|sql|toml|txt|yml|yaml)$/i.test(name.name)) allTextFiles.push(path);
  }
}
walk(root);
for (const file of allTextFiles) {
  const rel = file.slice(root.length + 1);
  const text = readFileSync(file, 'utf8');
  assert(!text.includes('<'.repeat(7)) && !text.includes('>'.repeat(7)), `Conflict marker found in ${rel}`);
  assert(!/ghp_[A-Za-z0-9_]+/.test(text), `GitHub token pattern found in ${rel}`);
  assert(!/sb_secret_[A-Za-z0-9_]+/.test(text), `Supabase secret key pattern found in ${rel}`);
}

if (failures.length) {
  console.error('Full workflow notes check failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Full workflow notes check passed.');
