import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const required = [
  'shared/js/live-ops-v5.js',
  'supabase/sql/PRODUCTION_SQL_EDITOR_PATCHES_065_TO_074_V5.sql',
  'docs/V5_OPERATIONS_ENHANCEMENTS_GUIDE.md',
  'docs/V5_LIVE_ACCEPTANCE_TESTS.md',
  'FINAL_V5_OPERATIONS_ENHANCEMENTS_REPORT.md',
];
for (let n = 65; n <= 74; n += 1) {
  const file = fs.readdirSync(path.join(root, 'supabase/sql/patches')).find((f) => f.startsWith(String(n).padStart(3, '0')) && f.endsWith('.sql'));
  if (!file) throw new Error(`Missing SQL patch ${n}`);
}
for (const rel of required) {
  if (!fs.existsSync(path.join(root, rel))) throw new Error(`Missing required V5 file: ${rel}`);
}
for (const rel of ['index.html','admin/index.html','employee/index.html','executive/index.html','operations-gate/index.html','admin-login.html']) {
  const txt = fs.readFileSync(path.join(root, rel), 'utf8');
  if (!txt.includes('live-ops-v5.js')) throw new Error(`V5 script not linked in ${rel}`);
}
for (const rel of ['sw.js','sw-admin.js','sw-employee.js','sw-executive.js']) {
  const txt = fs.readFileSync(path.join(root, rel), 'utf8');
  if (!txt.includes('shared/js/live-ops-v5.js')) throw new Error(`V5 script not cached in ${rel}`);
}
const allText = required.map((rel) => fs.readFileSync(path.join(root, rel), 'utf8')).join('\n');
for (const needle of ['Live Operations Center','Smart Alerts','Official Messages','Offline Attendance']) {
  if (!allText.includes(needle)) throw new Error(`Missing V5 documentation section: ${needle}`);
}
console.log('V5 operations checks passed.');
