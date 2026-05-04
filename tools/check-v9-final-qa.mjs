import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const fail = (msg) => {
  console.error(`V9 final QA failed: ${msg}`);
  process.exit(1);
};
const exists = (p) => fs.existsSync(path.join(root, p));
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

const required = [
  'supabase/sql/PRODUCTION_SQL_EDITOR_PATCHES_044_TO_074_ALL_EXPANDED.sql',
  'docs/V9_FINAL_DEPLOYMENT_CHECKLIST_20260504.md',
  'docs/V9_FINAL_LIVE_ACCEPTANCE_TESTS_20260504.md',
  'FINAL_V9_FINAL_QA_REPORT_20260504.md',
  'tools/check-v9-audit-fixes.mjs',
];
for (const file of required) if (!exists(file)) fail(`missing ${file}`);

if (exists('supabase/.temp')) fail('supabase/.temp must not be shipped');
if (exists('PRIVATE_SECRETS')) fail('PRIVATE_SECRETS must not be shipped');
if (exists('node_modules')) fail('node_modules must not be shipped');
if (exists('shared/data/authorized-employees.json')) fail('authorized-employees.json must not be shipped');

const bundle = read('supabase/sql/PRODUCTION_SQL_EDITOR_PATCHES_044_TO_074_ALL_EXPANDED.sql');
for (const marker of ['044_encrypt_credential_vault.sql', '045_enable_pg_cron_backup.sql', '074_e2e_and_health_tracking.sql']) {
  if (!bundle.includes(marker)) fail(`expanded SQL bundle missing ${marker}`);
}
if (/^\\i\s+/m.test(bundle)) fail('expanded SQL bundle must not use psql \\i includes');

const pkg = JSON.parse(read('package.json'));
for (const script of ['check:v9-audit-fixes', 'check:v9-final-qa', 'check:live-deploy-readiness']) {
  if (!pkg.scripts?.[script]) fail(`missing npm script ${script}`);
}

const ignore = read('.gitignore');
for (const rule of ['supabase/.temp/', 'shared/js/supabase-config.js', 'shared/data/authorized-employees.json', 'node_modules/']) {
  if (!ignore.includes(rule)) fail(`.gitignore missing ${rule}`);
}
const ignoreConflictMarkers = ['<'.repeat(7), '>'.repeat(7)];
if (ignoreConflictMarkers.some((marker) => ignore.includes(marker))) fail('.gitignore contains merge conflict markers');

const scanTargets = ['.', 'shared', 'supabase', 'tools', 'docs'];
const secretPatterns = [
  /ghp_[A-Za-z0-9_]{20,}/,
  /sbp_[A-Za-z0-9_]{20,}/,
  /sb_secret_[A-Za-z0-9_]{20,}/,
  /VAPID_PRIVATE_KEY\s*=\s*[^\n]+[A-Za-z0-9_-]{20,}/,
];
function walk(dir, acc=[]) {
  for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    if (['.git', 'node_modules'].includes(entry.name)) continue;
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(rel, acc);
    else acc.push(rel);
  }
  return acc;
}
for (const file of walk('.')) {
  if (!/\.(js|mjs|ts|json|html|css|md|sql|toml|yml|yaml|txt|env|example)$/i.test(file)) continue;
  const text = fs.readFileSync(path.join(root, file), 'utf8');
  const conflictMarkers = ['<'.repeat(7), '='.repeat(7), '>'.repeat(7)];
  if (conflictMarkers.some((marker) => text.split(/\r?\n/).some((line) => line.trim() === marker))) fail(`conflict marker in ${file}`);
  for (const pattern of secretPatterns) if (pattern.test(text)) fail(`secret-like pattern in ${file}`);
}

console.log('V9 final QA check passed.');
