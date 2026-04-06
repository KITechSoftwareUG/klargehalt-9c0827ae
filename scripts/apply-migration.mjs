/**
 * One-time migration script.
 *
 * Usage:
 *   1. Add SUPABASE_DB_PASSWORD to .env (find it in Supabase Dashboard > Settings > Database)
 *   2. npm install pg dotenv
 *   3. node scripts/apply-migration.mjs
 */

import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const { SUPABASE_DB_PASSWORD } = process.env;
const PROJECT_REF = 'btbucjkczpejplykyvkj';

if (!SUPABASE_DB_PASSWORD) {
  console.error('Error: SUPABASE_DB_PASSWORD not set in .env');
  console.error('Find it at: Supabase Dashboard > Settings > Database > Connection string');
  process.exit(1);
}

const client = new pg.Client({
  host: `db.${PROJECT_REF}.supabase.co`,
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: SUPABASE_DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
});

const migrationPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../supabase/migrations/20260401000000_fix_rls_recursion_and_onboarding.sql'
);

async function run() {
  await client.connect();
  console.log('Connected to Supabase Postgres.');

  const sql = fs.readFileSync(migrationPath, 'utf-8');
  await client.query(sql);
  console.log('Migration applied successfully.');

  await client.end();
}

run().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
