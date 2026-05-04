import fs from 'node:fs';

function read(file) { return fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8'); }
function assert(condition, message) { if (!condition) { console.error(`❌ ${message}`); process.exitCode = 1; } }

const employee = read('shared/js/employee-app.js');
const css = read('shared/css/employee.css');
const supa = read('shared/js/supabase-api.js');
const createFn = read('supabase/functions/admin-create-user/index.ts');
const updateFn = read('supabase/functions/admin-update-user/index.ts');
const patch = read('supabase/sql/patches/076_v13_phone_login_org_permissions_polish.sql');

assert(employee.includes('كلمة المرور المؤقتة = رقم الهاتف'), 'Employee login must clearly support temporary phone password.');
assert(!employee.includes('يتم إنشاء الحسابات من لوحة HR فقط. ادخل برقم هاتفك المسجل'), 'Old long HR-only login paragraph must be removed.');
assert(employee.includes('renderEmployeeOrgTree') && employee.includes('الهيكل الوظيفي'), 'Employee team page must render connected org hierarchy.');
assert(employee.includes('disputes-polished-page') && employee.includes('compact-workflow'), 'Disputes page must use polished workflow UI.');
assert(employee.includes('validEgyptPhone') && employee.includes('data-avatar-preview'), 'Profile page must validate phone and preview avatar.');
assert(employee.includes('must-change-card'), 'Temporary password users must see change-password banner.');
assert(css.includes('V13 production polish batch') && css.includes('segmented-field') && css.includes('employee-bottom-nav'), 'V13 CSS polish must be present.');
assert(supa.includes('compressImageFile') && supa.includes('حجم الصورة أكبر من 2MB حتى بعد الضغط'), 'Supabase avatar upload must compress before upload.');
assert(createFn.includes('temporary_password: true') && createFn.includes('must_change_password: true'), 'Admin create user must mark temporary phone password accounts.');
assert(updateFn.includes('مطابقة لرقم هاتف الموظف') && updateFn.includes('must_change_password: body.password ? true : undefined'), 'Admin update user must allow phone temporary password and force change.');
assert(patch.includes('normalize_egypt_phone') && patch.includes('resolve_login_identifier') && patch.includes('v13_production_polish'), 'V13 SQL patch must include phone resolver, normalization, and marker.');

if (process.exitCode) process.exit(1);
console.log('✅ V13 production polish checks passed.');
