import { mkdirSync, rmSync, cpSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const out = join(root, 'dist_public_pages');
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
const include = [
  'index.html',
  'admin-login.html',
  'health.html',
  'admin',
  'employee',
  'executive',
  'operations-gate',
  'shared',
  'sw.js',
  'sw-admin.js',
  'sw-employee.js',
  'sw-executive.js',
  '_headers',
  'vercel.json',
];
for (const rel of include) {
  const src = join(root, rel);
  if (existsSync(src)) cpSync(src, join(out, rel), { recursive: true });
}
writeFileSync(join(out, 'PUBLIC_UPLOAD_README.txt'), `هذه حزمة رفع GitHub Pages فقط.\nلا تحتوي على .env أو .git أو supabase/.temp.\nارفع محتويات هذا المجلد إلى GitHub Pages بعد تشغيل RUN_IN_SUPABASE_SQL_EDITOR.sql ونشر Supabase Functions.\n`, 'utf8');
try {
  execFileSync('zip', ['-qr', join(root, 'hr_ahla_shabab_v28_public_pages_upload.zip'), '.'], { cwd: out, stdio: 'inherit' });
  console.log('Public package created: hr_ahla_shabab_v28_public_pages_upload.zip');
} catch (error) {
  console.warn('zip command unavailable; dist_public_pages folder is ready.');
}
