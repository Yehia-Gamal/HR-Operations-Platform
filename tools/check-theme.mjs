import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const requiredFiles = [
  'shared/css/neon-admin-theme.css',
  'docs/NEON_COMMAND_CENTER_THEME_V3_GUIDE.md',
  'docs/theme-preview/index.html',
  'FINAL_NEON_COMMAND_CENTER_THEME_V3_REPORT.md',
];

const requiredPages = [
  'index.html',
  'employee/index.html',
  'admin/index.html',
  'executive/index.html',
  'operations-gate/index.html',
  'admin-login.html',
];

const requiredSW = ['sw.js', 'sw-employee.js', 'sw-admin.js', 'sw-executive.js'];
const failures = [];

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(root, file))) failures.push(`Missing required theme file: ${file}`);
}

for (const page of requiredPages) {
  const html = read(page);
  if (!html.includes('neon-admin-theme.css')) failures.push(`Page does not load neon theme: ${page}`);
}

for (const sw of requiredSW) {
  const js = read(sw);
  if (!js.includes('./shared/css/neon-admin-theme.css') && !js.includes('shared/css/neon-admin-theme.css')) {
    failures.push(`Service worker does not cache neon theme: ${sw}`);
  }
}

const css = read('shared/css/neon-admin-theme.css');
for (const needle of ['--neon-focus', 'prefers-reduced-motion', 'risk-high', 'touch-action: manipulation', 'neon-command-center']) {
  if (!css.includes(needle)) failures.push(`Theme CSS missing: ${needle}`);
}

if (failures.length) {
  failures.forEach((failure) => console.error('❌', failure));
  process.exit(1);
}
console.log('✅ Neon Command Center Theme V3 check passed.');
