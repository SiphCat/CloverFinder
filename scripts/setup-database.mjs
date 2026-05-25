#!/usr/bin/env node
/**
 * Creates public.finds via direct Postgres.
 *
 * Add to .env.local (Supabase → Settings → Database → database password):
 *   SUPABASE_DB_PASSWORD=your_password
 * Then: npm run db:setup
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function loadEnvLocal() {
  const path = join(root, ".env.local");
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i <= 0) continue;
    out[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return out;
}

function resolveDbUrl(env) {
  const direct = env.SUPABASE_DB_URL || env.DATABASE_URL;
  if (direct && !direct.includes("[YOUR-PASSWORD]")) return direct;
  const ref = env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  const password = env.SUPABASE_DB_PASSWORD?.trim();
  if (ref && password) {
    return `postgresql://postgres:${encodeURIComponent(password)}@db.${ref}.supabase.co:5432/postgres`;
  }
  return null;
}

const env = { ...process.env, ...loadEnvLocal() };
const dbUrl = resolveDbUrl(env);

if (!dbUrl) {
  const ref = env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  console.error(`
Add your database password to .env.local:

  SUPABASE_DB_PASSWORD=your_password

Get / reset it: https://supabase.com/dashboard/project/${ref || "YOUR_REF"}/settings/database

Then run: npm run db:setup

Or run SQL manually: https://supabase.com/dashboard/project/${ref || "YOUR_REF"}/sql/new
  (paste supabase/sql/ensure_finds_table.sql)
`);
  process.exit(1);
}

async function main() {
  const { default: pg } = await import("pg");
  const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  const sql = readFileSync(join(root, "supabase/sql/ensure_finds_table.sql"), "utf8");

  await client.connect();
  console.log("Connected. Creating public.finds …\n");
  await client.query(sql);

  const check = await client.query(
    `select exists (
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = 'finds'
    ) as ok`
  );
  await client.end();

  if (check.rows[0]?.ok) {
    console.log("Success. Open /api/health/supabase → findsTableReady: true\n");
  } else {
    console.error("Table still missing after migration.");
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
