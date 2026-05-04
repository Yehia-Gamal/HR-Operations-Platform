import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const failures=[];
const exists=(p)=>fs.existsSync(path.join(root,p));
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
const assert=(cond,msg)=>{if(!cond) failures.push(msg)};
assert(!exists('supabase/.temp'), 'supabase/.temp must not be shipped');
assert(exists('supabase/sql/patches/044_encrypt_credential_vault.sql'), 'Patch 044 must exist');
assert(exists('supabase/sql/patches/045_enable_pg_cron_backup.sql'), 'Patch 045 must exist');
assert(read('tools/issue-supabase-passwords.mjs').includes('makeSecurePassword'), 'Secure password generator must exist');
assert(!read('tools/issue-supabase-passwords.mjs').includes('Ahla@${suffix}'), 'Phone suffix password formula must be removed');
assert(read('supabase/functions/admin-update-user/index.ts').includes('function strongEnough'), 'admin-update-user must validate password strength');
const patchDir=path.join(root,'supabase/sql/patches');
for (const n of ['030','031','032','033','034']) {
  const files=fs.readdirSync(patchDir).filter(f=>f.startsWith(n)&&f.endsWith('.sql'));
  const hasA=files.some(f=>f.startsWith(n+'a_'));
  const hasB=files.some(f=>f.startsWith(n+'b_'));
  assert(hasA && hasB, `Patch ${n} must use a/b suffixes; found ${files.join(', ')}`);
  assert(!files.some(f=>new RegExp(`^${n}_[^ab]`).test(f)), `Patch ${n} has unsuffixed duplicate: ${files.join(', ')}`);
}
assert(read('.gitignore').includes('supabase/.temp/'), '.gitignore must ignore supabase/.temp');
assert(read('.gitignore').includes('shared/js/supabase-config.js'), '.gitignore must ignore runtime config');
assert(!read('.gitignore').includes('safe for frontend deployment'), '.gitignore must not imply runtime config is safe to commit');
assert(exists('shared/js/v9-hardening.js'), 'V9 frontend hardening helper must exist');
const v9=read('shared/js/v9-hardening.js');
for (const token of ['shouldShowOnboarding','showPushPermissionExplainer','createVisibilityAwarePolling','compressImage']) assert(v9.includes(token), `V9 helper missing ${token}`);
for (const sw of ['sw.js','sw-admin.js','sw-employee.js','sw-executive.js']) assert(read(sw).includes('shared/js/v9-hardening.js'), `${sw} must cache v9-hardening.js`);
if (failures.length) { console.error('V9 audit fixes check failed:'); failures.forEach(f=>console.error('- '+f)); process.exit(1); }
console.log('V9 audit fixes check passed.');
