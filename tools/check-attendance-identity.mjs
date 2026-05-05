import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const failures = [];
const read = (file) => readFileSync(join(root, file), 'utf8');
const assert = (condition, message) => { if (!condition) failures.push(message); };

assert(existsSync(join(root, 'shared/js/attendance-identity.js')), 'attendance identity helper must exist.');
assert(existsSync(join(root, 'supabase/sql/patches/051_attendance_identity_verification.sql')), 'Patch 051 must exist.');
assert(existsSync(join(root, 'supabase/sql/patches/052_attendance_identity_server_review.sql')), 'Patch 052 server review must exist.');
assert(existsSync(join(root, 'supabase/sql/patches/053_trusted_device_approval.sql')), 'Patch 053 trusted device approval must exist.');
assert(existsSync(join(root, 'supabase/sql/patches/054_attendance_branch_qr_challenge.sql')), 'Patch 054 branch QR challenge must exist.');
assert(existsSync(join(root, 'supabase/sql/patches/055_attendance_anti_spoofing_risk.sql')), 'Patch 055 anti-spoofing risk must exist.');
assert(existsSync(join(root, 'supabase/sql/patches/056_attendance_risk_center.sql')), 'Patch 056 risk center must exist.');
assert(existsSync(join(root, 'shared/js/attendance-v3-security.js')), 'Attendance V3 security helper must exist.');

const employeeApp = read('shared/js/employee-app.js');
const faceSelfieTemporarilyDisabled = employeeApp.includes('FACE_SELFIE_TEMP_DISABLED = true');
assert(employeeApp.includes('requestEmployeePasskey'), 'Employee app must request employee-specific passkey.');
assert(faceSelfieTemporarilyDisabled || employeeApp.includes('capturePunchSelfie'), 'Employee app must capture punch selfie.');
assert(employeeApp.includes('calculateAttendanceRisk'), 'Employee app must calculate identity risk.');
assert(faceSelfieTemporarilyDisabled || employeeApp.includes('uploadPunchSelfie'), 'Employee app must upload punch selfie.');
assert(employeeApp.includes('rememberDevicePunch'), 'Employee app must remember recent device usage to detect shared device abuse.');
assert(employeeApp.includes('ensureAttendancePolicyAcknowledged'), 'Employee app must require attendance policy acknowledgement.');
assert(employeeApp.includes('requestBranchQrChallenge'), 'Employee app must require/check branch QR challenge.');
assert(employeeApp.includes('ensureTrustedDeviceApproval'), 'Employee app must request HR device approval for new devices.');
assert(employeeApp.includes('submitFallbackAttendanceRequest'), 'Employee app must create fallback attendance request on identity failures.');
assert(!/navigator\.credentials\.get\(\{\s*publicKey:\s*\{\s*challenge:[\s\S]{0,200}userVerification:\s*"required"[\s\S]{0,80}\}\s*\}\s*\)/.test(employeeApp), 'Employee app must not request an unrestricted passkey list.');

const identity = read('shared/js/attendance-identity.js');
for (const token of ['allowCredentials', 'deviceFingerprintHash', 'SHARED_DEVICE_RECENT', 'MISSING_SELFIE', 'OUTSIDE_GEOFENCE']) {
  assert(identity.includes(token), `Attendance identity helper must include ${token}.`);
}

const v3 = read('shared/js/attendance-v3-security.js');
for (const token of ['ensureAttendancePolicyAcknowledged', 'ensureTrustedDeviceApproval', 'requestBranchQrChallenge', 'analyzeLocationTrust', 'submitFallbackAttendanceRequest', 'BRANCH_QR_MISSING', 'DEVICE_APPROVAL_REQUIRED']) {
  assert(v3.includes(token), `Attendance V3 helper must include ${token}.`);
}

const supabaseApi = read('shared/js/supabase-api.js');
for (const token of ['attendance_identity_checks', 'attendance_risk_events', 'device_fingerprint_hash', 'risk_score', 'uploadPunchSelfie', 'SERVER_SHARED_DEVICE_RECENT', 'review_attendance_identity_check', 'request_trusted_device_approval', 'validate_branch_qr_challenge', 'attendance_risk_center', 'acknowledge_attendance_identity_policy']) {
  assert(supabaseApi.includes(token), `Supabase API must persist ${token}.`);
}
const lines = supabaseApi.split(/\r?\n/).map((line) => line.trim());
for (let i = 1; i < lines.length; i += 1) {
  assert(!(lines[i] && lines[i] === lines[i - 1] && lines[i].includes('employee_locations')), 'Supabase API must not duplicate attendance location writes.');
}

const api = read('shared/js/api.js');
assert(api.includes('uploadPunchSelfie'), 'Local API must provide uploadPunchSelfie fallback.');
assert(api.includes('riskScore'), 'Local API must keep punch risk score.');

const admin = read('shared/js/app-admin.js');
assert(admin.includes('عرض السيلفي'), 'Admin review must expose selfie link.');
assert(admin.includes('riskScore'), 'Admin review must show risk score.');

const patch = read('supabase/sql/patches/051_attendance_identity_verification.sql');
for (const token of ['attendance_identity_checks', 'attendance_risk_events', 'punch_selfies', 'attendance_shared_device_alerts']) {
  assert(patch.includes(token), `Patch 051 must create ${token}.`);
}

const patch52 = read('supabase/sql/patches/052_attendance_identity_server_review.sql');
for (const token of ['attendance_identity_review_queue', 'review_attendance_identity_check', 'punch_selfies_authenticated_upload', 'punch_selfies_reviewer_read']) {
  assert(patch52.includes(token), `Patch 052 must include ${token}.`);
}

const patch53 = read('supabase/sql/patches/053_trusted_device_approval.sql');
for (const token of ['trusted_device_approval_requests', 'request_trusted_device_approval', 'review_trusted_device_approval']) assert(patch53.includes(token), `Patch 053 must include ${token}.`);
const patch54 = read('supabase/sql/patches/054_attendance_branch_qr_challenge.sql');
for (const token of ['branch_qr_challenges', 'create_branch_qr_challenge', 'validate_branch_qr_challenge']) assert(patch54.includes(token), `Patch 054 must include ${token}.`);
const patch55 = read('supabase/sql/patches/055_attendance_anti_spoofing_risk.sql');
for (const token of ['anti_spoofing_flags', 'browser_install_id', 'attendance_risk_escalations']) assert(patch55.includes(token), `Patch 055 must include ${token}.`);
const patch56 = read('supabase/sql/patches/056_attendance_risk_center.sql');
for (const token of ['attendance_risk_center', 'attendance_policy_acknowledgements', 'attendance_monthly_risk_report']) assert(patch56.includes(token), `Patch 056 must include ${token}.`);

if (failures.length) {
  console.error('Attendance identity verification check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log('Attendance identity verification check passed.');
