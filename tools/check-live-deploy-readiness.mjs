import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const required = [
  'docs/LIVE_DEPLOY_RUNBOOK_20260504.md',
  'docs/LIVE_SMOKE_TEST_MATRIX_20260504.md',
  'supabase/sql/PRODUCTION_SQL_EDITOR_PATCHES_051_TO_064_ALL.sql',
  'tools/check-attendance-identity.mjs',
  'tools/check-theme.mjs',
  'shared/js/attendance-identity.js',
  'shared/js/attendance-v3-security.js',
  'shared/css/neon-admin-theme.css',
  'shared/offline.html',
];

const missing = required.filter((file) => !fs.existsSync(path.join(root, file)));
if (missing.length) {
  console.error('Missing live deploy readiness files:');
  missing.forEach((file) => console.error(`- ${file}`));
  process.exit(1);
}

const forbiddenPatterns = [
  /ghp_[A-Za-z0-9_]+/,
  /sb_secret_[A-Za-z0-9_]+/,
  /SUPABASE_SERVICE_ROLE_KEY[ \t]*=[ \t]*[^\r\n]+/,
  /VAPID_PRIVATE_KEY[ \t]*=[ \t]*[^\r\n]+/,
  new RegExp(["<".repeat(7), "=".repeat(7), ">".repeat(7)].join("|")),
];

const scanFiles = [
  '.gitignore',
  '.env.example',
  'package.json',
  'shared/js/supabase-config.js',
  'docs/LIVE_DEPLOY_RUNBOOK_20260504.md',
  'docs/LIVE_SMOKE_TEST_MATRIX_20260504.md',
];

for (const file of scanFiles) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) continue;
  const content = fs.readFileSync(full, 'utf8');
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(content)) {
      console.error(`Forbidden pattern found in ${file}: ${pattern}`);
      process.exit(1);
    }
  }
}

console.log('Live deploy readiness checks passed.');
