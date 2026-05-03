import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
<<<<<<< HEAD
import postgres from 'postgres';

const projectRef = process.env.SUPABASE_PROJECT_REF;
const password = process.env.SUPABASE_DB_PASSWORD;

if (!projectRef || !password) {
  console.error('Missing SUPABASE_PROJECT_REF or SUPABASE_DB_PASSWORD.');
=======
import pkg from 'pg';
const { Client } = pkg;

const projectRef = process.env.SUPABASE_PROJECT_REF;
const password = process.env.SUPABASE_DB_PASSWORD;
const connectionString = process.env.SUPABASE_DB_URL;

if (!connectionString && (!projectRef || !password)) {
  console.error('Missing SUPABASE_DB_URL or both SUPABASE_PROJECT_REF and SUPABASE_DB_PASSWORD.');
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
  process.exit(1);
}

const root = process.cwd();
const sqlFiles = [
  join(root, 'supabase/sql/001_schema_rls_seed.sql'),
  ...readdirSync(join(root, 'supabase/sql/patches'))
    .filter((name) => /^\d{3}_.+\.sql$/.test(name))
    .sort()
    .map((name) => join(root, 'supabase/sql/patches', name)),
];

<<<<<<< HEAD
const sql = postgres({
  host: process.env.SUPABASE_DB_HOST || `db.${projectRef}.supabase.co`,
  port: Number(process.env.SUPABASE_DB_PORT || 5432),
  database: 'postgres',
  username: process.env.SUPABASE_DB_USER || 'postgres',
  password,
  ssl: 'require',
  prepare: false,
  max: 1,
  idle_timeout: 5,
  connect_timeout: 30,
});

try {
=======
const client = new Client(connectionString ? {
  connectionString,
  ssl: process.env.SUPABASE_DB_SSL === 'false' ? false : { rejectUnauthorized: false },
} : {
  host: process.env.SUPABASE_DB_HOST || `db.${projectRef}.supabase.co`,
  port: Number(process.env.SUPABASE_DB_PORT || 5432),
  database: process.env.SUPABASE_DB_NAME || 'postgres',
  user: process.env.SUPABASE_DB_USER || 'postgres',
  password,
  ssl: process.env.SUPABASE_DB_SSL === 'false' ? false : { rejectUnauthorized: false },
  connectionTimeoutMillis: 30000,
});

try {
  await client.connect();

>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
  if (process.env.VERIFY_ONLY !== '1') {
    for (const file of sqlFiles) {
      const relative = file.slice(root.length + 1).replaceAll('\\', '/');
      process.stdout.write(`Applying ${relative} ... `);
<<<<<<< HEAD
      await sql.unsafe(readFileSync(file, 'utf8'));
=======
      await client.query(readFileSync(file, 'utf8'));
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
      console.log('OK');
    }
  }

  const expectedTables = [
    'permissions',
    'roles',
    'governorates',
    'complexes',
    'branches',
    'departments',
    'employees',
<<<<<<< HEAD
=======
    'profiles',
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
    'attendance_events',
    'attendance_daily',
    'leave_requests',
    'missions',
    'dispute_cases',
    'employee_policies',
    'daily_reports',
    'smart_alerts',
    'attendance_rule_runs',
    'database_migration_status',
<<<<<<< HEAD
  ];

  const rows = await sql`
    select table_name
    from information_schema.tables
    where table_schema = 'public'
      and table_type = 'BASE TABLE'
      and table_name = any(${expectedTables})
    order by table_name
  `;
=======
    'push_subscriptions',
    'notification_delivery_log',
    'kpi_cycles',
  ];

  const { rows } = await client.query(
    `select table_name
       from information_schema.tables
      where table_schema = 'public'
        and table_type = 'BASE TABLE'
        and table_name = any($1)
      order by table_name`,
    [expectedTables],
  );
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)

  const found = new Set(rows.map((row) => row.table_name));
  const missing = expectedTables.filter((name) => !found.has(name));
  console.log(`Verified ${rows.length}/${expectedTables.length} expected public tables.`);
  if (missing.length) {
    console.error(`Missing tables: ${missing.join(', ')}`);
    process.exitCode = 2;
  }
} finally {
<<<<<<< HEAD
  await sql.end({ timeout: 5 });
=======
  await client.end().catch(() => null);
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
}
