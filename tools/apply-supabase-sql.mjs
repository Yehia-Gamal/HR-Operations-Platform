import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import pkg from 'pg';
const { Client } = pkg;

const projectRef = process.env.SUPABASE_PROJECT_REF;
const password = process.env.SUPABASE_DB_PASSWORD;
const connectionString = process.env.SUPABASE_DB_URL;

if (!connectionString && (!projectRef || !password)) {
  console.error('Missing SUPABASE_DB_URL or both SUPABASE_PROJECT_REF and SUPABASE_DB_PASSWORD.');
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

  if (process.env.VERIFY_ONLY !== '1') {
    for (const file of sqlFiles) {
      const relative = file.slice(root.length + 1).replaceAll('\\', '/');
      process.stdout.write(`Applying ${relative} ... `);
      await client.query(readFileSync(file, 'utf8'));
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
    'profiles',
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

  const found = new Set(rows.map((row) => row.table_name));
  const missing = expectedTables.filter((name) => !found.has(name));
  console.log(`Verified ${rows.length}/${expectedTables.length} expected public tables.`);
  if (missing.length) {
    console.error(`Missing tables: ${missing.join(', ')}`);
    process.exitCode = 2;
  }
} finally {
  await client.end().catch(() => null);
}
